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

    // A correct password is not always a session. When the account has a passkey
    // enrolled the server answers 200 with { two_factor_required: true } and NO
    // token, and this used to read result.token straight through — storing
    // `undefined` as the credential and leaving the console signed-in-looking
    // but 401ing on every request.
    //
    // The console cannot finish the ceremony itself: the WebAuthn relying party
    // is org.nostia.io and this page is served from nostia.io, and a page may
    // claim its own domain or a parent, never a sibling. So it says so plainly
    // instead of failing sideways.
    if (result?.two_factor_required) {
      throw new ApiError(
        'two_factor_required',
        'This account is protected with Face ID. Open the Nostia app on your phone to sign in.',
      );
    }
    if (!result?.token) {
      throw new ApiError('unknown', 'The server did not return a session.');
    }

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

  // ---- Authoring ---------------------------------------------------------
  // Every judgement here belongs to the server: what a valid radius is, whether
  // an edit clears approval, whether an adventure may publish. This layer
  // carries the request and relays the answer.

  async loadAdventure(orgId, adventureId) {
    const result = await this.#json(path(routes.adventure, { org: orgId, adventure: adventureId }));
    return {
      adventure: result.adventure,
      steps: result.steps ?? [],
      // The server ships preflight failures with the read, so the editor can
      // show why an adventure cannot publish without a second round trip.
      preflightFailures: result.preflight_failures ?? [],
    };
  }

  async createAdventure(orgId, fields) {
    const result = await this.#json(path(routes.adventures, { org: orgId }), {
      method: 'POST', body: fields,
    });
    return result.adventure;
  }

  async updateAdventure(orgId, adventureId, fields) {
    const result = await this.#json(path(routes.adventure, { org: orgId, adventure: adventureId }), {
      method: 'PATCH', body: fields,
    });
    return result.adventure;
  }

  async addStep(orgId, adventureId, fields) {
    const result = await this.#json(path(routes.steps, { org: orgId, adventure: adventureId }), {
      method: 'POST', body: fields,
    });
    return result.step;
  }

  async updateStep(orgId, adventureId, stepId, fields) {
    const result = await this.#json(
      path(routes.step, { org: orgId, adventure: adventureId, step: stepId }),
      { method: 'PATCH', body: fields },
    );
    return result.step;
  }

  async deleteStep(orgId, adventureId, stepId) {
    await this.#json(path(routes.step, { org: orgId, adventure: adventureId, step: stepId }),
      { method: 'DELETE' });
    return true;
  }

  /**
   * Reference image upload. multipart, not JSON — and the response deliberately
   * does NOT contain the image or a URL to it: reference photos are never served
   * to a client, which is the whole mitigation for "walker photographs the
   * reference instead of the place".
   */
  async uploadStepReference(orgId, adventureId, stepId, file) {
    const form = new FormData();
    form.append('image', file);
    return this.#json(
      path(routes.stepReference, { org: orgId, adventure: adventureId, step: stepId }),
      { method: 'POST', form },
    );
  }

  async approveStep(orgId, adventureId, stepId) {
    return this.#json(path(routes.stepApprove, { org: orgId, adventure: adventureId, step: stepId }),
      { method: 'POST' });
  }

  async preflight(orgId, adventureId) {
    const result = await this.#json(path(routes.preflight, { org: orgId, adventure: adventureId }));
    return { ok: result.ok === true, failures: result.failures ?? [] };
  }

  async publishAdventure(orgId, adventureId) {
    const result = await this.#json(path(routes.publish, { org: orgId, adventure: adventureId }),
      { method: 'POST' });
    return result.adventure ?? result;
  }

  async archiveAdventure(orgId, adventureId) {
    const result = await this.#json(path(routes.archive, { org: orgId, adventure: adventureId }),
      { method: 'POST' });
    return result.adventure ?? result;
  }

  /**
   * A published adventure is immutable — editing one creates a new draft version
   * rather than changing what a walker is standing in front of.
   */
  async reviseAdventure(orgId, adventureId) {
    const result = await this.#json(path(routes.revise, { org: orgId, adventure: adventureId }),
      { method: 'POST' });
    return result.adventure ?? result;
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

  async #raw(route, { method = 'GET', body, form, authenticated = true, allowRefresh = true } = {}) {
    const headers = { Accept: 'application/json' };
    // A FormData body sets its own Content-Type, boundary included. Setting it
    // by hand produces a boundary that does not match the payload and the server
    // parses zero fields — the classic multipart mistake.
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (authenticated) {
      if (!this.token) throw new ApiError('unauthenticated', 'Sign in to continue.');
      headers.Authorization = `Bearer ${this.token}`;
    }

    let payload;
    if (form !== undefined) payload = form;
    else if (body !== undefined) payload = JSON.stringify(body);

    let response;
    try {
      response = await fetch(this.baseURL + route, { method, headers, body: payload });
    } catch (cause) {
      throw new ApiError('network', 'Could not reach the server.', { cause });
    }

    if (response.status === 401 && authenticated && allowRefresh) {
      const refreshed = await this.#refresh();
      if (refreshed) {
        return this.#raw(route, { method, body, form, authenticated, allowRefresh: false });
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
