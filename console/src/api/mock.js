import { ApiError } from './errors.js';

const SUPPRESSED = { suppressed: true, reason: 'small_n', threshold: 5 };
const rate = (n, denominator) => ({ n, denominator, rate: denominator ? n / denominator : null });

/**
 * In-memory backend with the same shape as `RestBackend`.
 *
 * It exists because no server is deployed for this product — without it the console could not be
 * run or reviewed at all. It is also written to exercise the states a happy-path fixture would
 * hide: small-n suppression, an organization whose numbers are all still hidden, a tier with no
 * Stripe price, and Stripe not configured.
 *
 * The suppressed organization is not padding. A brand-new tour spends its first weeks in exactly
 * that state, and if the console is illegible there the customer concludes the product is broken
 * before it has had a chance to work.
 */
export class MockBackend {
  constructor() {
    this.signedIn = false;
    this.user = { id: 1, username: 'olaf', email: 'olaf@nostia.io' };
    this.memberships = [
      { org_id: 1, name: 'Exeter Historical Society', role: 'owner',
        branding: { accent_color: '#2E7D32', logo_url: null } },
      { org_id: 2, name: 'Seacoast Science Center', role: 'owner', branding: null },
      // An admin-only membership, so the console's owner gate is visible in the sample data
      // instead of being a code path nobody ever sees.
      { org_id: 3, name: 'Portsmouth Downtown District', role: 'admin', branding: null },
    ];

    this.adventures = {
      1: [
        { id: 1, title: 'Waterfront Mills Walk', status: 'published', version: 2,
          updated_at: '2026-07-02T09:12:00Z' },
        { id: 2, title: 'Bandstand to Bridge (draft)', status: 'draft', version: 2,
          updated_at: '2026-08-01T17:40:00Z' },
      ],
      2: [
        { id: 3, title: 'Tide Pool Trail', status: 'published', version: 1,
          updated_at: '2026-07-29T11:00:00Z' },
      ],
      3: [],
    };

    this.stops = {
      1: ['The Landing', 'Powder House', 'Mill Race', 'Bandstand', 'Last Mill'],
      3: ['West Pool', 'The Ledge', 'Cormorant Rock'],
    };

    // Authoring works on whole stops, analytics only needs the titles above, so
    // the editable records are derived from the same source rather than being a
    // second list that can disagree with it.
    //
    // Stop 4 of the published walk is deliberately missing its coordinate and
    // its approval: the draft in org 1 must fail preflight for a real reason, or
    // the editor's "why can't I publish this" path is never seen in the demo.
    this.steps = {};
    for (const [adventureId, titles] of Object.entries(this.stops)) {
      this.steps[adventureId] = titles.map((title, index) => ({
        id: 1000 + Number(adventureId) * 100 + index,
        order: index + 1,
        title,
        text: `Find ${title} and look for the marker.`,
        verify_criterion: `a clear photo of ${title}`,
        verification_mode: 'geo_and_photo',
        lat: 42.9814 + index * 0.001,
        lng: -70.9478 + index * 0.001,
        geofence_radius_m: 100,
        dwell_seconds: 90,
        has_reference: true,
        approved_at: '2026-07-01T12:00:00Z',
      }));
    }
    this.steps[2] = [
      { id: 1201, order: 1, title: 'Bandstand', text: 'Meet at the bandstand.',
        verify_criterion: 'the bandstand roof', verification_mode: 'geo_and_photo',
        lat: 42.9810, lng: -70.9470, geofence_radius_m: 100, dwell_seconds: 90,
        has_reference: true, approved_at: '2026-08-01T09:00:00Z' },
      { id: 1202, order: 2, title: 'String Bridge', text: 'Walk out to the bridge.',
        verify_criterion: 'the ironwork', verification_mode: 'geo_and_photo',
        lat: null, lng: null, geofence_radius_m: 100, dwell_seconds: 90,
        has_reference: false, approved_at: null },
    ];
    this.nextId = 5000;

    this.billing = {
      1: {
        tier: 'orientation', label: 'Orientation', status: 'active',
        current_period_end: '2026-09-01T00:00:00Z', seats: 1,
        entitlements: {
          adventures: 3, stops: 12, analytics: true, custom_branding: true,
          invite_codes: true, csv_export: false, multi_admin: false, assist_calls_per_day: 20,
          sso: false,
        },
        usage: { published_adventures: 1, admins: 1, admin_limit: 1, can_add_admin: false },
        // Both false, because both are false in reality: no tier has a Stripe price and Stripe is
        // not configured. The console therefore renders the path that actually ships.
        purchasable: false,
        configured: false,
        can_publish: true,
        blocked_reason: null,
      },
      // An EXPIRED trial. Note it still reads `trialing` — nothing in Stripe ever moved it, because
      // Stripe was never involved — so `can_publish` is the only honest signal here, and this
      // fixture exists to stop a screen that reads `status` alone from looking correct.
      2: {
        tier: 'pilot', label: 'Pilot', status: 'trialing',
        current_period_end: '2026-07-28T00:00:00Z', seats: null,
        entitlements: {
          adventures: 1, stops: 5, analytics: true, custom_branding: false,
          // TRUE on the free tier (§V2-9): pilots are distributed by printed QR, so
          // gating codes would gate the experiment the tier exists to run.
          invite_codes: true, csv_export: false, multi_admin: false, assist_calls_per_day: 3,
          sso: false,
        },
        usage: { published_adventures: 1, admins: 1, admin_limit: 1, can_add_admin: false },
        purchasable: false,
        configured: false,
        can_publish: false,
        blocked_reason: 'trial_expired',
      },
      3: {
        tier: 'pilot', label: 'Pilot', status: 'past_due',
        current_period_end: '2026-07-20T00:00:00Z', seats: null,
        entitlements: {
          adventures: 1, stops: 5, analytics: true, custom_branding: false,
          // TRUE on the free tier (§V2-9): pilots are distributed by printed QR, so
          // gating codes would gate the experiment the tier exists to run.
          invite_codes: true, csv_export: false, multi_admin: false, assist_calls_per_day: 3,
          sso: false,
        },
        usage: { published_adventures: 1, admins: 1, admin_limit: 1, can_add_admin: false },
        purchasable: false,
        configured: false,
        can_publish: false,
        blocked_reason: 'past_due',
      },
    };

    this.invites = {
      1: [
        { id: 41, org_id: 1, org_adventure_id: 1, code: 'H7KDQ3NM', max_uses: 500, use_count: 137,
          expires_at: null, revoked_at: null, grants: 'adventure_access',
          universal_link: 'https://api.nostia.io/i/H7KDQ3NM' },
        { id: 42, org_id: 1, org_adventure_id: null, code: 'TQ4MXCFA', max_uses: 40, use_count: 40,
          expires_at: null, revoked_at: null, grants: 'org_membership',
          universal_link: 'https://api.nostia.io/i/TQ4MXCFA' },
      ],
      2: [],
      3: [],
    };
  }

  setCredentials() { /* the mock has no transport */ }

  async signIn(email) {
    await pause(400);
    if (!email) throw new ApiError('unknown', 'Enter an email address.');
    this.signedIn = true;
    return { token: 'mock-token', refreshToken: null, user: this.user, memberships: this.memberships };
  }

  async loadMe() {
    await pause(200);
    if (!this.signedIn) throw new ApiError('unauthenticated', 'Sign in to continue.');
    return { user: this.user, memberships: this.memberships };
  }

  async signOut() { this.signedIn = false; }

  async listAdventures(orgId) {
    await pause(250);
    return this.adventures[orgId] ?? [];
  }

  async orgAnalytics(orgId) {
    await pause(350);
    return (this.adventures[orgId] ?? [])
      .filter((a) => a.status !== 'draft')
      .map((adventure) => {
        const numbers = this.#numbers(adventure.id);
        return {
          id: adventure.id,
          title: adventure.title,
          status: adventure.status,
          version: adventure.version,
          starts: numbers.suppressed ? SUPPRESSED : numbers.starts,
          verified_completion_rate: numbers.suppressed
            ? SUPPRESSED
            : rate(numbers.completed, numbers.totalRuns),
        };
      });
  }

  async adventureAnalytics(orgId, adventureId, version) {
    await pause(400);
    const adventure = (this.adventures[orgId] ?? []).find((a) => String(a.id) === String(adventureId));
    if (!adventure) throw new ApiError('not-found', 'That adventure is not in this organization.');

    const numbers = this.#numbers(adventure.id);
    const titles = (this.steps[adventure.id] ?? []).map((s) => s.title);

    let previousReached = null;
    const perStop = titles.map((title, index) => {
      const reached = Math.max(0, numbers.starts - index * 3);
      // Stop 3 fails verification far more often than the rest, so the "this is an authoring
      // problem, not cheating" callout has something real to fire on.
      const verified = Math.max(0, reached - (index === 2 ? 6 : 1));
      const row = { step_id: adventure.id * 100 + index, order: index + 1, title };

      if (numbers.suppressed || reached < 5) {
        Object.assign(row, {
          reached: SUPPRESSED, verified: SUPPRESSED, drop_off_from_previous: SUPPRESSED,
          failed_verifications: SUPPRESSED, median_seconds: SUPPRESSED,
        });
      } else {
        const failed = index === 2 ? 9 : 2;
        Object.assign(row, {
          reached,
          verified,
          drop_off_from_previous: previousReached ? rate(reached, previousReached) : null,
          failed_verifications: rate(failed, Math.max(1, verified)),
          median_seconds: 140 + index * 45,
        });
      }
      previousReached = reached;
      return row;
    });

    const metrics = numbers.suppressed
      ? {
          views: SUPPRESSED, starts: SUPPRESSED, verified_completion_rate: SUPPRESSED,
          group_rate: SUPPRESSED, corroborated_runs: SUPPRESSED, median_rating: SUPPRESSED,
        }
      : {
          views: numbers.views,
          starts: numbers.starts,
          verified_completion_rate: rate(numbers.completed, numbers.totalRuns),
          group_rate: rate(numbers.groupRuns, numbers.plans),
          corroborated_runs: numbers.corroborated,
          median_rating: 4,
        };

    return {
      adventure: {
        id: adventure.id, title: adventure.title, status: adventure.status,
        version: version ?? adventure.version,
      },
      versions_available: adventure.version > 1
        ? [adventure.version, adventure.version - 1]
        : [adventure.version],
      small_n_threshold: 5,
      metrics,
      per_stop: perStop,
    };
  }

  async exportAnalyticsCSV(orgId, adventureId, version) {
    await pause(300);
    const status = this.billing[orgId];
    if (!status?.entitlements.csv_export) {
      throw new ApiError('entitlement', 'CSV export is part of the Campus plan.',
                         { tier: status?.tier });
    }
    const analytics = await this.adventureAnalytics(orgId, adventureId, version);
    const cell = (value) => (value && value.suppressed ? 'suppressed' : value ?? '');
    const rows = [['stop_order', 'stop_title', 'reached', 'verified', 'median_seconds'].join(',')];
    for (const stop of analytics.per_stop) {
      rows.push([stop.order, `"${stop.title}"`, cell(stop.reached), cell(stop.verified),
                 cell(stop.median_seconds)].join(','));
    }
    return {
      blob: new Blob([rows.join('\n')], { type: 'text/csv' }),
      filename: `adventure-${adventureId}-v${analytics.adventure.version}.csv`,
    };
  }

  // ---- Authoring ---------------------------------------------------------
  // A second full implementation, not a stub: the point of the seam is that no
  // page can tell which backend it is running on. It also reproduces the rules
  // that actually bite while authoring — a published adventure is immutable, any
  // edit clears approval, and preflight refuses to publish an incomplete stop.

  async loadAdventure(orgId, adventureId) {
    await pause(250);
    const adventure = (this.adventures[orgId] ?? []).find((a) => String(a.id) === String(adventureId));
    if (!adventure) throw new ApiError('not-found', 'Adventure not found.');
    const steps = this.#stepsFor(adventure.id);
    return { adventure, steps, preflightFailures: this.#preflightFailures(orgId, adventure, steps) };
  }

  async createAdventure(orgId, fields) {
    await pause(300);
    const status = this.billing[orgId];
    const published = (this.adventures[orgId] ?? []).filter((a) => a.status === 'published').length;
    const allowed = status?.entitlements.adventures;
    if (allowed !== null && allowed !== undefined && published >= allowed) {
      throw new ApiError('entitlement', `Your plan includes ${allowed} published adventure(s).`,
                         { tier: status?.tier });
    }
    const adventure = {
      id: this.#nextId(), title: fields.title || 'Untitled adventure', status: 'draft', version: 1,
      description: fields.description ?? '', difficulty: fields.difficulty ?? 'easy',
      estimated_minutes: fields.estimated_minutes ?? 60,
      updated_at: new Date().toISOString(),
    };
    (this.adventures[orgId] ||= []).push(adventure);
    this.steps[adventure.id] = [];
    return adventure;
  }

  async updateAdventure(orgId, adventureId, fields) {
    await pause(200);
    const adventure = (this.adventures[orgId] ?? []).find((a) => String(a.id) === String(adventureId));
    if (!adventure) throw new ApiError('not-found', 'Adventure not found.');
    if (adventure.status === 'published') {
      throw new ApiError('conflict', 'Published adventures are immutable; create a revision.');
    }
    Object.assign(adventure, fields, { updated_at: new Date().toISOString() });
    return adventure;
  }

  async addStep(orgId, adventureId, fields) {
    await pause(250);
    const { adventure } = await this.loadAdventure(orgId, adventureId);
    if (adventure.status === 'published') {
      throw new ApiError('conflict', 'Published adventures are immutable; create a revision.');
    }
    const status = this.billing[orgId];
    const steps = this.#stepsFor(adventure.id);
    const allowed = status?.entitlements.stops;
    if (allowed !== null && allowed !== undefined && steps.length >= allowed) {
      throw new ApiError('entitlement', `Your plan allows ${allowed} stops per adventure.`,
                         { tier: status?.tier });
    }
    const step = {
      id: this.#nextId(), order: steps.length + 1,
      title: fields.title ?? '', text: fields.text ?? '',
      verify_criterion: fields.verify_criterion ?? '',
      verification_mode: fields.verification_mode ?? 'geo_and_photo',
      lat: fields.lat ?? null, lng: fields.lng ?? null,
      geofence_radius_m: fields.geofence_radius_m ?? 100,
      dwell_seconds: fields.dwell_seconds ?? 90,
      has_reference: false, approved_at: null,
    };
    steps.push(step);
    return step;
  }

  async updateStep(orgId, adventureId, stepId, fields) {
    await pause(200);
    const step = this.#stepsFor(adventureId).find((s) => String(s.id) === String(stepId));
    if (!step) throw new ApiError('not-found', 'Stop not found.');
    // §12: EVERY edit clears approval, including one that changes nothing. A
    // conditional here would be exactly the "edit and preserve approval" path
    // the rule forbids.
    Object.assign(step, fields, { approved_at: null });
    return step;
  }

  async deleteStep(orgId, adventureId, stepId) {
    await pause(200);
    const steps = this.#stepsFor(adventureId);
    const index = steps.findIndex((s) => String(s.id) === String(stepId));
    if (index === -1) throw new ApiError('not-found', 'Stop not found.');
    steps.splice(index, 1);
    steps.forEach((s, i) => { s.order = i + 1; });
    return true;
  }

  async uploadStepReference(orgId, adventureId, stepId) {
    await pause(500);
    const step = this.#stepsFor(adventureId).find((s) => String(s.id) === String(stepId));
    if (!step) throw new ApiError('not-found', 'Stop not found.');
    // Note what is NOT returned: no URL, no storage key. A reference image is
    // never served back to a client.
    step.has_reference = true;
    step.approved_at = null;
    return { ok: true, step_id: step.id, has_reference: true };
  }

  async approveStep(orgId, adventureId, stepId) {
    await pause(200);
    const step = this.#stepsFor(adventureId).find((s) => String(s.id) === String(stepId));
    if (!step) throw new ApiError('not-found', 'Stop not found.');
    step.approved_at = new Date().toISOString();
    return { ok: true, step };
  }

  async preflight(orgId, adventureId) {
    await pause(250);
    const { adventure, steps } = await this.loadAdventure(orgId, adventureId);
    const failures = this.#preflightFailures(orgId, adventure, steps);
    return { ok: failures.length === 0, failures };
  }

  async publishAdventure(orgId, adventureId) {
    await pause(400);
    const { adventure, steps } = await this.loadAdventure(orgId, adventureId);
    const failures = this.#preflightFailures(orgId, adventure, steps);
    if (failures.length) {
      throw new ApiError('conflict', 'This adventure is not ready to publish yet.', { failures });
    }
    adventure.status = 'published';
    adventure.updated_at = new Date().toISOString();
    return adventure;
  }

  async archiveAdventure(orgId, adventureId) {
    await pause(300);
    const { adventure } = await this.loadAdventure(orgId, adventureId);
    adventure.status = 'archived';
    return adventure;
  }

  async reviseAdventure(orgId, adventureId) {
    await pause(350);
    const { adventure, steps } = await this.loadAdventure(orgId, adventureId);
    const revision = {
      ...adventure, id: this.#nextId(), status: 'draft', version: adventure.version + 1,
      updated_at: new Date().toISOString(),
    };
    (this.adventures[orgId] ||= []).push(revision);
    // Copied stops arrive UNAPPROVED: a new version has not been signed off by a
    // human yet, which is the entire point of the approval record.
    this.steps[revision.id] = steps.map((s) => ({ ...s, id: this.#nextId(), approved_at: null }));
    return revision;
  }

  async billingStatus(orgId) {
    await pause(250);
    const status = this.billing[orgId];
    if (!status) throw new ApiError('not-found', 'No billing record for this organization.');
    return status;
  }

  async startCheckout(orgId, tier) {
    await pause(350);
    // Not a mock limitation — the real 501. No tier has a Stripe price yet, price and interval live
    // in Stripe, and a console that invented one would be misrepresenting what the organization is
    // agreeing to pay.
    throw new ApiError('not-purchasable', `The ${tier} plan has no price configured yet.`, { tier });
  }

  async billingPortal() {
    await pause(300);
    throw new ApiError('unavailable', 'Billing is not configured on this backend.');
  }

  async listInviteCodes(orgId) {
    await pause(250);
    return this.invites[orgId] ?? [];
  }

  #stepsFor(adventureId) {
    return (this.steps[adventureId] ||= []);
  }

  #nextId() {
    this.nextId += 1;
    return this.nextId;
  }

  /**
   * The same preflight the server runs, in the same vocabulary: `{ code, detail }`.
   *
   * Kept honest on purpose — a mock that always says "ready to publish" would
   * hide the one screen the customer meets most often, which is the one
   * explaining why they cannot publish yet.
   */
  #preflightFailures(orgId, adventure, steps) {
    const failures = [];
    if (adventure.status !== 'draft') {
      failures.push({ code: 'not_draft', detail: `status is ${adventure.status}` });
    }
    if (!steps.length) failures.push({ code: 'no_steps', detail: 'an adventure needs at least one stop' });

    for (const step of steps) {
      const where = `stop ${step.order}`;
      if (!step.approved_at) failures.push({ code: 'unapproved_step', detail: `${where} is not approved` });
      if (step.verification_mode !== 'geo' && !step.has_reference) {
        failures.push({ code: 'missing_reference', detail: `${where} has no reference photo` });
      }
      if (step.verification_mode !== 'photo' && (step.lat === null || step.lng === null)) {
        failures.push({ code: 'missing_coordinate', detail: `${where} has no location` });
      }
    }

    const limits = this.billing[orgId]?.entitlements;
    if (limits?.stops != null && steps.length > limits.stops) {
      failures.push({ code: 'tier_limit', detail: `stops ${steps.length} > ${limits.stops}` });
    }
    return failures;
  }

  #numbers(adventureId) {
    if (String(adventureId) === '1') {
      return { views: 412, starts: 24, totalRuns: 31, completed: 14, groupRuns: 6, plans: 27,
               corroborated: 6, suppressed: false };
    }
    return { views: 9, starts: 3, totalRuns: 3, completed: 1, groupRuns: 0, plans: 3,
             corroborated: 0, suppressed: true };
  }
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
