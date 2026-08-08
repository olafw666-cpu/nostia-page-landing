import { config } from '../config.js';
import { routes, path } from './routes.js';
import { ApiError } from './errors.js';

/**
 * HTTP implementation, speaking docs/BACKEND_CONTRACT.md.
 *
 * Nothing here makes a product decision. Entitlement, small-n suppression and subscription state
 * are all server judgements; this file transports them and stops.
 */
export class RestBackend {
  constructor(baseURL = config.apiBaseURL) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.token = null;
    this.refreshToken = null;
    this.onSessionExpired = null;
    this._refreshing = null;
  }

  setCredentials({ token, refreshToken }) {
    this.token = token ?? null;
    this.refreshToken = refreshToken ?? null;
  }

  // ---- Identity ----------------------------------------------------------

  async signIn(email, password) {
    const result = await this.#json(routes.login, {
      method: 'POST',
      body: { email, password },
      authenticated: false,
    });
    this.setCredentials({ token: result.token, refreshToken: result.refresh_token });
    return {
      token: result.token,
      refreshToken: result.refresh_token ?? null,
      user: result.user,
      memberships: result.memberships ?? [],
    };
  }

  async loadMe() {
    const result = await this.#json(routes.me);
    return { user: result.user, memberships: result.memberships ?? [] };
  }

  async signOut() {
    try { await this.#raw(routes.logout, { method: 'POST' }); } catch { /* best effort */ }
    this.setCredentials({ token: null, refreshToken: null });
  }

  // ---- Analytics ---------------------------------------------------------

  async orgAnalytics(orgId) {
    const result = await this.#json(path(routes.orgAnalytics, { org: orgId }));
    return result.adventures ?? [];
  }

  async listAdventures(orgId, status) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const result = await this.#json(path(routes.adventures, { org: orgId }) + query);
    return result.adventures ?? [];
  }

  async adventureAnalytics(orgId, adventureId, version) {
    const query = version == null ? '' : `?version=${encodeURIComponent(version)}`;
    return this.#json(path(routes.adventureAnalytics, { org: orgId, adventure: adventureId }) + query);
  }

  async exportAnalyticsCSV(orgId, adventureId, version) {
    const query = version == null ? '' : `?version=${encodeURIComponent(version)}`;
    const response = await this.#raw(
      path(routes.adventureAnalyticsCSV, { org: orgId, adventure: adventureId }) + query);
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    return { blob: await response.blob(), filename: match?.[1] || 'analytics.csv' };
  }

  // ---- Billing -----------------------------------------------------------

  billingStatus(orgId) {
    return this.#json(path(routes.billing, { org: orgId }));
  }

  startCheckout(orgId, tier) {
    return this.#json(path(routes.billingCheckout, { org: orgId }), { method: 'POST', body: { tier } });
  }

  billingPortal(orgId) {
    return this.#json(path(routes.billingPortal, { org: orgId }), { method: 'POST' });
  }

  // ---- Distribution (read-only here; minting lives in the mobile app) -----

  async listInviteCodes(orgId) {
    const result = await this.#json(path(routes.inviteCodes, { org: orgId }));
    return result.invite_codes ?? [];
  }

  // ---- Transport ---------------------------------------------------------

  async #json(route, options = {}) {
    const response = await this.#raw(route, options);
    if (response.status === 204) return null;
    try {
      return await response.json();
    } catch {
      throw new ApiError('unknown', 'The server returned something this console could not read.');
    }
  }

  async #raw(route, { method = 'GET', body, authenticated = true, allowRefresh = true } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (authenticated) {
      if (!this.token) throw new ApiError('unauthenticated', 'Sign in to continue.');
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response;
    try {
      response = await fetch(this.baseURL + route, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (cause) {
      throw new ApiError('network', 'Could not reach the server.', { cause });
    }

    if (response.status === 401 && authenticated && allowRefresh) {
      const refreshed = await this.#refresh();
      if (refreshed) {
        return this.#raw(route, { method, body, authenticated, allowRefresh: false });
      }
      this.onSessionExpired?.();
      throw new ApiError('unauthenticated', 'Your session expired. Sign in again.');
    }

    if (!response.ok) {
      let payload = null;
      try { payload = await response.json(); } catch { /* not every error body is JSON */ }
      if (response.status === 401) this.onSessionExpired?.();
      throw ApiError.fromStatus(response.status, payload);
    }

    return response;
  }

  /** One in-flight refresh at a time; concurrent 401s await the same promise. */
  async #refresh() {
    if (!this.refreshToken) return false;
    if (!this._refreshing) {
      this._refreshing = (async () => {
        try {
          const response = await fetch(this.baseURL + routes.refresh, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: this.refreshToken }),
          });
          if (!response.ok) return false;
          const payload = await response.json();
          if (!payload?.token) return false;
          this.token = payload.token;
          return true;
        } catch {
          return false;
        } finally {
          this._refreshing = null;
        }
      })();
    }
    return this._refreshing;
  }
}
