import { config } from '../config.js';

const STORAGE_KEY = 'nostia.console.session';

/**
 * Identity, the backend handle, and which organization is selected.
 *
 * The console is an **owner** surface. Billing routes are owner-only server-side, so an admin would
 * land on a dashboard whose primary action 403s; filtering here turns that into an explanation.
 * The server remains the authority — this is a UX gate, not a security one, and the console would
 * still be refused if it asked.
 */
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

  /** Organizations this user owns — the ones the console can actually operate on. */
  get ownedMemberships() {
    return this.memberships.filter((m) => m.role === config.requiredRole);
  }

  /** Memberships that fall short of owner, kept so the console can say why they're missing. */
  get nonOwnerMemberships() {
    return this.memberships.filter((m) => m.role !== config.requiredRole);
  }

  get organization() {
    return this.ownedMemberships.find((m) => String(m.org_id) === String(this.orgId)) ?? null;
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
    // keeping a stale selection would leave someone in a dashboard they no longer own.
    const owned = this.ownedMemberships;
    if (!owned.some((m) => String(m.org_id) === String(this.orgId))) {
      this.orgId = owned[0]?.org_id ?? null;
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
