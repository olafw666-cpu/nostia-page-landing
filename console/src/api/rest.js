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

  /**
   * The printable QR for one invite code, as SVG source.
   *
   * routes.inviteQR has been defined since the console was written and nothing
   * ever called it, so the one asset in this product that exists to be PRINTED
   * was reachable only by hand-crafting an authenticated request. It is fetched
   * as text rather than a blob because the print view inlines the markup — an
   * object URL would be a second document the print stylesheet cannot reach.
   */
  async inviteQrSvg(orgId, codeId, { scale = 8 } = {}) {
    const response = await this.#raw(
      path(routes.inviteQR, { org: orgId, code: codeId }) + `?scale=${encodeURIComponent(scale)}`);
    return response.text();
  }

  async listInviteCodes(orgId) {
    const result = await this.#json(path(routes.inviteCodes, { org: orgId }));
    return result.invite_codes ?? [];
  }

  // ---- School layer --------------------------------------------------------
  // Same rule as everything above: the server decides (who may create a club, whether a club is
  // locked, what a headcount verdict is); this carries requests and relays answers.

  async ssoConfig() {
    try {
      return await this.#json(routes.ssoConfig, { authenticated: false });
    } catch {
      // A host without the mock SSO does not have the route at all. That is "off", not an error.
      return { enabled: false };
    }
  }

  async ssoExchange({ code, code_verifier: verifier, redirect_uri: redirectUri }) {
    const result = await this.#json(routes.ssoToken, {
      method: 'POST', authenticated: false,
      body: { code, code_verifier: verifier, redirect_uri: redirectUri },
    });
    this.setCredentials({ token: result.token, refreshToken: result.refresh_token });
    return {
      token: result.token, refreshToken: result.refresh_token ?? null,
      user: result.user, memberships: result.memberships ?? [], sso: result.sso ?? null,
    };
  }

  async getPolicy(orgId) {
    return (await this.#json(path(routes.policy, { org: orgId }))).policy;
  }

  async updatePolicy(orgId, patch) {
    return (await this.#json(path(routes.policy, { org: orgId }), { method: 'PATCH', body: patch })).policy;
  }

  listClubs(orgId) {
    return this.#json(path(routes.clubs, { org: orgId }));
  }

  async createClub(orgId, fields) {
    return (await this.#json(path(routes.clubs, { org: orgId }), { method: 'POST', body: fields })).club;
  }

  async decideClub(orgId, clubId, decision, note) {
    return (await this.#json(path(routes.clubDecision, { org: orgId, club: clubId }), {
      method: 'POST', body: { decision, note },
    })).club;
  }

  async setClubStatus(orgId, clubId, status, note) {
    return (await this.#json(path(routes.clubStatus, { org: orgId, club: clubId }), {
      method: 'POST', body: { status, note },
    })).club;
  }

  async listMembers(orgId) {
    return (await this.#json(path(routes.members, { org: orgId }))).members ?? [];
  }

  async listEvents(orgId) {
    return (await this.#json(path(routes.events, { org: orgId }))).events ?? [];
  }

  async createEvent(orgId, fields) {
    return (await this.#json(path(routes.events, { org: orgId }), { method: 'POST', body: fields })).event;
  }

  async cancelEvent(orgId, eventId) {
    return (await this.#json(path(routes.eventCancel, { org: orgId, event: eventId }), { method: 'POST' })).event;
  }

  eventAttendance(orgId, eventId) {
    return this.#json(path(routes.eventAttendance, { org: orgId, event: eventId }));
  }

  uploadAttendancePhoto(orgId, eventId, file, claimedCount) {
    const form = new FormData();
    form.append('photo', file);
    form.append('claimed_count', String(claimedCount));
    return this.#json(path(routes.eventPhoto, { org: orgId, event: eventId }), { method: 'POST', form });
  }

  fileAttendance(orgId, eventId, fields) {
    return this.#json(path(routes.eventAttendance, { org: orgId, event: eventId }), { method: 'POST', body: fields });
  }

  openCheckin(orgId, eventId) {
    return this.#json(path(routes.eventCheckinCode, { org: orgId, event: eventId }), { method: 'POST' });
  }

  waiveAttendance(orgId, eventId, note) {
    return this.#json(path(routes.eventWaive, { org: orgId, event: eventId }), { method: 'POST', body: { note } });
  }

  attendanceCompliance(orgId) {
    return this.#json(path(routes.compliance, { org: orgId }));
  }

  attendanceAnalytics(orgId, category) {
    return this.#json(path(routes.attendanceAnalytics, { org: orgId }) + `?category=${encodeURIComponent(category)}`);
  }

  studentAttendance(orgId) {
    return this.#json(path(routes.attendanceStudents, { org: orgId }));
  }

  studentDetail(orgId, userId) {
    return this.#json(path(routes.attendanceStudent, { org: orgId, user: userId }));
  }

  async exportAttendanceCSV(orgId, category) {
    const response = await this.#raw(path(routes.attendanceCSV, { org: orgId }) + `?category=${encodeURIComponent(category)}`);
    return { blob: await response.blob(), filename: `attendance-${category}.csv` };
  }

  getSurvey(orgId, category) {
    return this.#json(path(routes.survey, { org: orgId }) + `?category=${encodeURIComponent(category)}`);
  }

  updateSurvey(orgId, category, questions) {
    return this.#json(path(routes.survey, { org: orgId }), { method: 'PATCH', body: { category, questions } });
  }

  async listModeration(orgId) {
    return (await this.#json(path(routes.moderation, { org: orgId }))).messages ?? [];
  }

  hideChatMessage(orgId, messageId, reason) {
    return this.#json(path(routes.moderationHide, { org: orgId, message: messageId }), { method: 'POST', body: { reason } });
  }

  listOutbox(orgId) {
    return this.#json(path(routes.outbox, { org: orgId }));
  }

  previewOutbox(orgId, audience) {
    return this.#json(path(routes.outboxPreview, { org: orgId }), { method: 'POST', body: { audience } });
  }

  async sendOutbox(orgId, fields) {
    return (await this.#json(path(routes.outbox, { org: orgId }), { method: 'POST', body: fields })).message;
  }

  async loadOutbox(orgId, messageId) {
    return (await this.#json(path(routes.outboxMessage, { org: orgId, message: messageId }))).message;
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
