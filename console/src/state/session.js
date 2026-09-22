import { config } from '../config.js';

const STORAGE_KEY = 'nostia.console.session';
const SSO_KEY = 'nostia.console.sso';

/**
 * Identity, the backend handle, and which organization is selected.
 *
 * WHO GETS IN. This used to be an owner-only surface, which was right when the console did billing
 * and analytics and nothing else. Authoring changed that: creating adventures, editing stops and
 * approving them are all `requireOrgAdmin` server-side, so shutting admins out of the console now
 * denies them work the server would happily accept.
 *
 * So the gate is: **owner or admin may enter; only an owner sees the owner-only actions.** That
 * matches the server exactly — publish, archive, checkout and the billing portal are
 * `requireOrgOwner`, everything else is `requireOrgAdmin`. Anything narrower hides real work;
 * anything wider renders buttons that 403.
 *
 * The server remains the authority. This is a UX gate, not a security one.
 */
const MANAGING_ROLES = ['owner', 'admin'];
export class Session {
  constructor(backend) {
    this.backend = backend;
    this.user = null;
    this.memberships = [];
    this.orgId = null;
    this.listeners = new Set();

    if (this.backend.onSessionExpired !== undefined) {
      this.backend.onSessionExpired = () => this.signOut();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  #emit() {
    for (const listener of this.listeners) listener(this);
  }

  get isSignedIn() { return Boolean(this.user); }

  /**
   * Organizations this user can operate on at all — owner or admin — EXCEPT clubs.
   *
   * The console is the school administrators' surface. A club's leader is its owner, so without
   * this a student president signing in here would get a console for their chess club; club
   * leaders run their clubs from the app instead, where the room photo and the check-in code live.
   */
  get manageableMemberships() {
    return this.memberships.filter((m) => MANAGING_ROLES.includes(m.role) && m.org_type !== 'club');
  }

  /** Club memberships with a managing role — kept so the console can say where to go instead. */
  get clubLeaderships() {
    return this.memberships.filter((m) => MANAGING_ROLES.includes(m.role) && m.org_type === 'club');
  }

  /** True when the selected organization is a school: that is what turns on the school pages. */
  get isInstitution() {
    return this.organization?.org_type === 'institution';
  }

  /** Organizations this user owns. Owner-only actions check this, not membership. */
  get ownedMemberships() {
    return this.memberships.filter((m) => m.role === config.requiredRole);
  }

  /** Memberships that fall short of owner, kept so the console can say why they're missing. */
  get nonOwnerMemberships() {
    return this.memberships.filter((m) => m.role !== config.requiredRole);
  }

  get organization() {
    return this.manageableMemberships.find((m) => String(m.org_id) === String(this.orgId)) ?? null;
  }

  /**
   * Role in the CURRENTLY SELECTED organization — the only role any screen should branch on. A
   * user can own one organization and merely administer another, so a global "is owner" would
   * enable a publish button in the wrong tab.
   */
  get role() {
    return this.organization?.role ?? null;
  }

  get isOwner() {
    return this.role === 'owner';
  }

  async restore() {
    // Coming back from the mock identity provider with ?code= in the URL.
    if (await this.#completeSso()) return true;
    const stored = readStored();
    if (!stored?.token) return false;
    this.backend.setCredentials({ token: stored.token, refreshToken: stored.refreshToken });
    try {
      const me = await this.backend.loadMe();
      this.#adopt(me.user, me.memberships, stored);
      return true;
    } catch {
      // A backend without `/me` is a documented gap, not a dead session — fall back to what was
      // cached at sign-in rather than bouncing the user to a login screen.
      if (stored.user) {
        this.#adopt(stored.user, stored.memberships ?? [], stored);
        return true;
      }
      clearStored();
      return false;
    }
  }

  async signIn(email, password) {
    const result = await this.backend.signIn(email, password);
    let memberships = result.memberships ?? [];
    if (!memberships.length) {
      try {
        memberships = (await this.backend.loadMe()).memberships ?? [];
      } catch { /* documented gap; the sign-in payload is the fallback */ }
    }
    const credentials = { token: result.token, refreshToken: result.refreshToken ?? null };
    writeStored({ ...credentials, user: result.user, memberships });
    this.#adopt(result.user, memberships, credentials);
  }

  /**
   * SSO, in two halves. The first half leaves the page: it makes a PKCE verifier, keeps it in
   * sessionStorage, and sends the browser to the identity provider's authorize page. The second
   * half (#completeSso, run by restore() on the way back) exchanges the returned code with that
   * verifier. The verifier never appears in a URL — that is the point of PKCE.
   *
   * The mock backend has no provider page to visit, so it signs in directly.
   */
  async beginSso() {
    const ssoConfig = await this.backend.ssoConfig();
    if (!ssoConfig?.enabled) throw new Error('Single sign-on is not available here.');
    if (config.backend === 'mock') {
      const result = await this.backend.ssoExchange({});
      this.#adoptResult(result);
      return;
    }
    const verifier = randomUrlSafe(48);
    const challenge = await sha256UrlSafe(verifier);
    const state = randomUrlSafe(16);
    const redirectUri = `${location.origin}${location.pathname}`;
    try {
      sessionStorage.setItem(SSO_KEY, JSON.stringify({ verifier, state, redirectUri }));
    } catch { throw new Error('This browser is blocking session storage, which sign-in needs.'); }
    const apiOrigin = new URL(config.apiBaseURL, location.href).origin;
    const query = new URLSearchParams({
      response_type: 'code', client_id: 'nostia-console', redirect_uri: redirectUri,
      code_challenge: challenge, code_challenge_method: 'S256', state,
    });
    location.assign(`${apiOrigin}${ssoConfig.authorize_path}?${query}`);
  }

  async #completeSso() {
    if (typeof location === 'undefined') return false;
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    if (!code) return false;
    let pending = null;
    try { pending = JSON.parse(sessionStorage.getItem(SSO_KEY) ?? 'null'); } catch { /* ignore */ }
    try { sessionStorage.removeItem(SSO_KEY); } catch { /* ignore */ }
    // Whatever happens next, the code comes out of the address bar: a code left in the URL ends
    // up in history and in any screenshot of the page.
    params.delete('code');
    params.delete('state');
    history.replaceState(null, '', `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`);
    // The state must be the one this tab sent, or the code was not ours to redeem.
    if (!pending || pending.state !== returnedState) return false;
    try {
      const result = await this.backend.ssoExchange({ code, code_verifier: pending.verifier, redirect_uri: pending.redirectUri });
      this.#adoptResult(result);
      return true;
    } catch {
      return false;
    }
  }

  #adoptResult(result) {
    const credentials = { token: result.token, refreshToken: result.refreshToken ?? null };
    writeStored({ ...credentials, user: result.user, memberships: result.memberships ?? [] });
    this.#adopt(result.user, result.memberships ?? [], credentials);
  }

  async signOut() {
    await this.backend.signOut?.();
    clearStored();
    this.user = null;
    this.memberships = [];
    this.orgId = null;
    this.#emit();
  }

  selectOrganization(orgId) {
    if (String(orgId) === String(this.orgId)) return;
    this.orgId = orgId;
    this.#emit();
  }

  #adopt(user, memberships, credentials) {
    this.user = user;
    this.memberships = memberships ?? [];
    this.backend.setCredentials(credentials);
    // Re-resolve the selected org against the fresh list: a role can be revoked, and silently
    // keeping a stale selection would leave someone in a dashboard they no longer belong to.
    const manageable = this.manageableMemberships;
    if (!manageable.some((m) => String(m.org_id) === String(this.orgId))) {
      this.orgId = manageable[0]?.org_id ?? null;
    }
    this.#emit();
  }
}

// ---------------------------------------------------------------------------
// Storage
//
// sessionStorage, not localStorage: a billing console on a shared or public machine should not
// leave a usable token behind after the tab closes.
// ---------------------------------------------------------------------------

function randomUrlSafe(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64Url(buf);
}

async function sha256UrlSafe(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return base64Url(new Uint8Array(digest));
}

function base64Url(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function readStored() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch { /* private mode; the session simply won't survive a reload */ }
}

function clearStored() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
