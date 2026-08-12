import { config } from '../config.js';

const STORAGE_KEY = 'nostia.console.session';

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

  /** Organizations this user can operate on at all — owner or admin. */
  get manageableMemberships() {
    return this.memberships.filter((m) => MANAGING_ROLES.includes(m.role));
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
