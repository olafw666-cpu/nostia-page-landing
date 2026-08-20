import { ApiError } from './errors.js';

const SUPPRESSED = { suppressed: true, reason: 'small_n', threshold: 5 };
const rate = (n, denominator) => ({ n, denominator, rate: denominator ? n / denominator : null });

/** One fully-authored, approved, publishable stop. */
const step = (id, order, title, text, criterion, lat, lng, radius, dwell) => ({
  id,
  order,
  title,
  text,
  verify_criterion: criterion,
  verification_mode: 'geo_and_photo',
  lat,
  lng,
  geofence_radius_m: radius,
  dwell_seconds: dwell,
  has_reference: true,
  approved_at: '2026-08-01T09:00:00Z',
});

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
      // Fictional, and campus-shaped because the product is: BUSINESS_MODEL_V2
      // moved the buyer from tourism boards to colleges.
      { org_id: 1, name: 'Lakeside University Student Affairs', role: 'owner',
        branding: { accent_color: '#A3B1A1', logo_url: null } },
      { org_id: 2, name: 'Riverside College Orientation', role: 'owner', branding: null },
      // An admin-only membership, so the console's owner gate is visible in the sample data
      // instead of being a code path nobody ever sees.
      { org_id: 3, name: 'Northgate Residence Life', role: 'admin', branding: null },
    ];

    this.adventures = {
      1: [
        { id: 1, title: 'Find Your Footing', status: 'published', version: 1,
          description: "Five places you'll use more than you expect.",
          difficulty: 'medium', estimated_minutes: 75,
          updated_at: '2026-08-01T09:12:00Z' },
        { id: 2, title: 'Campus Landmarks', status: 'published', version: 1,
          description: 'A single stop, used to show the geofence-locked state.',
          difficulty: 'easy', estimated_minutes: 5,
          updated_at: '2026-08-01T09:14:00Z' },
        { id: 3, title: 'Library Loop', status: 'published', version: 1,
          description: 'A short two-stop route.',
          difficulty: 'easy', estimated_minutes: 10,
          updated_at: '2026-08-01T09:16:00Z' },
        { id: 4, title: 'Move-In Week (draft)', status: 'draft', version: 1,
          description: 'Not finished. Stop 2 has no location yet.',
          difficulty: 'easy', estimated_minutes: 40,
          updated_at: '2026-08-12T17:40:00Z' },
      ],
      2: [
        { id: 5, title: 'Welcome Week Loop', status: 'published', version: 1,
          updated_at: '2026-07-29T11:00:00Z' },
      ],
      3: [],
    };

    // Verbatim from the seeded content, so a stop title read on this screen is the
    // same string the phone shows. Coordinates are central Boulder, deliberately
    // not a real institution's campus.
    this.steps = {
      1: [
        step(101, 1, 'Start at the Stacks',
          'Every campus has a building where the lights stay on latest. Find the main library, '
          + "stand at the front entrance, and photograph the doors. You'll be back here more than you think.",
          'The photo shows the exterior entrance of a library or academic building, including doors '
          + 'and any visible signage or lettering.', 40.0150, -105.2705, 60, 45),
        step(102, 2, 'Where Everyone Ends Up',
          'The student union is the default answer to "where should we meet?" Go inside, find a spot '
          + 'where people are actually sitting, and photograph the seating area.',
          'The photo is taken indoors and shows a lounge or seating area containing at least two '
          + 'chairs, benches, or tables.', 40.0168, -105.2680, 75, 60),
        step(103, 3, 'Learn the Line',
          "Find the dining hall you'll use most. Photograph the serving area or the tables — "
          + 'whichever is busier right now.',
          'The photo shows a dining space: a serving counter, a food station, or an area with '
          + 'dining tables and chairs.', 40.0185, -105.2712, 60, 45),
        step(104, 4, 'Somewhere to Put the Stress',
          "The rec centre is the cheapest thing on campus you're already paying for. Go in, find "
          + 'the gym floor or the equipment, and take a photo.',
          'The photo shows exercise equipment, a gymnasium floor, an indoor court, or a pool.',
          40.0210, -105.2668, 80, 45),
        step(105, 5, 'The Middle of It',
          "End on the main green. Stand somewhere you can see a building you'll have class in, "
          + 'and photograph the view.',
          'The photo is taken outdoors and shows open lawn, grass, or a plaza with at least one '
          + 'building visible in the background.', 40.0175, -105.2645, 100, 60),
      ],
      2: [
        step(201, 1, 'Out of Range',
          'This stop sits about 500 metres away and is never satisfiable. It exists to show what '
          + 'a locked stop looks like before you have arrived.',
          'The photo shows a building exterior.', 40.0195, -105.2646, 25, 30),
      ],
      3: [
        step(301, 1, 'In Range',
          'Stand where you are and let the geofence settle. This is the stop that opens on arrival '
          + 'and takes the first photo.',
          'The photo is taken indoors and shows a wall, ceiling, or floor together with at least '
          + 'one piece of furniture.', 40.0150, -105.2705, 50, 15),
        step(302, 2, 'The Rejection',
          'Photograph the ceiling first, then photograph a printed page. The difference between '
          + 'the two answers is what shows the judge is actually looking.',
          'The photo shows a printed page or a document with legible text on it.',
          40.0150, -105.2705, 50, 15),
      ],
      // Stop 2 is deliberately missing its coordinate, its reference and its
      // approval. The draft must fail preflight for a real reason, or the
      // editor's "why can't I publish this" path is never seen in the sample data.
      4: [
        step(401, 1, 'Residence Hall Desk', 'Find your hall front desk and photograph the counter.',
          'The photo shows a reception or service desk indoors.', 40.0160, -105.2690, 60, 45),
        { id: 402, order: 2, title: 'The Mail Room', text: 'Find where parcels arrive.',
          verify_criterion: 'The photo shows mailboxes or a parcel counter.',
          verification_mode: 'geo_and_photo', lat: null, lng: null,
          geofence_radius_m: 60, dwell_seconds: 45, has_reference: false, approved_at: null },
      ],
      5: [
        step(501, 1, 'The Quad', 'Start in the middle of the quad.',
          'The photo shows open lawn with a building behind it.', 40.0150, -105.2705, 80, 45),
        step(502, 2, 'The Library Steps', 'Walk to the library steps.',
          'The photo shows steps leading up to a building entrance.', 40.0165, -105.2688, 80, 45),
      ],
    };
    this.nextId = 5000;

    this.billing = {
      // Campus, matching the seeded organisation. Unlimited adventures and stops,
      // CSV export on, and multi_admin — which is a real enforced entitlement now,
      // not a declared flag, so `can_add_admin` is meaningful here.
      1: {
        tier: 'campus', label: 'Campus', status: 'active',
        current_period_end: '2027-08-14T00:00:00Z', seats: null,
        entitlements: {
          adventures: null, stops: null, analytics: true, custom_branding: true,
          invite_codes: true, csv_export: true, multi_admin: true, assist_calls_per_day: 60,
          sso: false,
        },
        usage: { published_adventures: 3, admins: 1, admin_limit: null, can_add_admin: true },
        // `purchasable` is true — Campus carries a Stripe lookup key — but `configured`
        // is false, because no Stripe Price object exists and Stripe is not wired up.
        // Checkout therefore 501s, which is the path that actually ships.
        purchasable: true,
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
        // Scoped to one adventure — this is the code that goes on a printed QR.
        // org.nostia.io, NOT api.nostia.io: the latter is the consumer backend and
        // serves no /i/ route, which on a printed sign is unfixable.
        { id: 41, org_id: 1, org_adventure_id: 3, code: 'H7KDQ3NM', max_uses: 500, use_count: 137,
          expires_at: null, revoked_at: null, grants: 'adventure_access', role: 'member',
          universal_link: 'https://org.nostia.io/i/H7KDQ3NM' },
        // NULL adventure = a membership grant. A different thing entirely, and the
        // pair is why both are in the sample data.
        { id: 42, org_id: 1, org_adventure_id: null, code: 'TQ4MXCFA', max_uses: 40, use_count: 40,
          expires_at: null, revoked_at: null, grants: 'org_membership', role: 'member',
          universal_link: 'https://org.nostia.io/i/TQ4MXCFA' },
      ],
      2: [],
      3: [],
    };

    /**
     * The funnel, stated rather than derived.
     *
     * Every count is DISTINCT USERS, which is what the server counts, and the rows
     * have to hang together: whoever verifies stop N is exactly the set that
     * reaches stop N+1. Derived from a formula — as this fixture once did — the
     * rows contradicted each other.
     */
    this.funnels = {
      1: {
        metrics: {
          views: 54, starts: 54, completed: 27, totalRuns: 54,
          groupRuns: 6, plans: 48, corroborated: 12, medianRating: 4,
        },
        perStop: [
          { reached: 48, verified: 46, failed: 18, median: 189 },
          { reached: 46, verified: 41, failed: 30, median: 190 },
          { reached: 41, verified: 33, failed: 25, median: 161 },
          { reached: 33, verified: 29, failed: 20, median: 177 },
          { reached: 29, verified: 27, failed: 10, median: 197 },
        ],
      },
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
    const steps = this.steps[adventure.id] ?? [];
    const funnel = this.funnels[adventure.id];

    let previousReached = null;
    const perStop = steps.map((step, index) => {
      const row = { step_id: step.id, order: index + 1, title: step.title };
      const cell = funnel?.perStop[index];

      if (numbers.suppressed || !cell || cell.reached < 5) {
        Object.assign(row, {
          reached: SUPPRESSED, verified: SUPPRESSED, drop_off_from_previous: SUPPRESSED,
          failed_verifications: SUPPRESSED, median_seconds: SUPPRESSED,
        });
      } else {
        Object.assign(row, {
          reached: cell.reached,
          verified: cell.verified,
          drop_off_from_previous: previousReached ? rate(cell.reached, previousReached) : null,
          // §8: a high ratio here is an authoring problem — the criterion or the
          // reference image is wrong — not evidence that people are cheating.
          failed_verifications: rate(cell.failed, Math.max(1, cell.verified)),
          median_seconds: cell.median,
        });
      }
      previousReached = cell?.reached ?? previousReached;
      return row;
    });

    const metrics = numbers.suppressed || !funnel
      ? {
          views: SUPPRESSED, starts: SUPPRESSED, verified_completion_rate: SUPPRESSED,
          group_rate: SUPPRESSED, corroborated_runs: SUPPRESSED, median_rating: SUPPRESSED,
        }
      : {
          views: funnel.metrics.views,
          starts: funnel.metrics.starts,
          verified_completion_rate: rate(funnel.metrics.completed, funnel.metrics.totalRuns),
          group_rate: rate(funnel.metrics.groupRuns, funnel.metrics.plans),
          corroborated_runs: funnel.metrics.corroborated,
          median_rating: funnel.metrics.medianRating,
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
      // Every figure on this backend is invented, so it carries the same disclosure
      // the real server attaches to seeded runs, in the same shape. The console
      // renders one banner and neither backend gets to skip it.
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
    const header = ['stop_order', 'stop_title', 'reached', 'verified', 'median_seconds'];
    const rows = [header.join(',')];
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

  /**
   * A placeholder, and deliberately one that cannot be mistaken for a real code.
   *
   * The mock has no QR encoder and should not grow one: duplicating a hand-rolled
   * Reed-Solomon implementation would give the demo a second encoder to keep in
   * step with the real one, and the failure mode of getting that wrong is a code
   * that prints and does not scan. What it returns instead is a card that says
   * so, so nobody takes the sample tour to a printer.
   */
  async inviteQrSvg(orgId, codeId) {
    await pause(250);
    const code = (this.invites[orgId] ?? []).find((c) => String(c.id) === String(codeId));
    if (!code) throw new ApiError('not-found', 'No such invite code.');
    const label = code.code.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" width="264" height="264" viewBox="0 0 264 264">',
      '<rect width="264" height="264" fill="#fff"/>',
      '<rect x="12" y="12" width="240" height="240" fill="none" stroke="#111" stroke-width="2" stroke-dasharray="8 6"/>',
      `<text x="132" y="120" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#111">Sample data</text>`,
      `<text x="132" y="144" text-anchor="middle" font-family="monospace" font-size="19" fill="#111">${label}</text>`,
      `<text x="132" y="172" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#555">No scannable code on this backend</text>`,
      '</svg>',
    ].join('');
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

  /**
   * Only adventures with a stated funnel have numbers. Everything else is
   * suppressed, which is not padding — a brand-new tour spends its first weeks in
   * exactly that state, and if the console is illegible there the customer
   * concludes the product is broken before it has had a chance to work.
   *
   * The two short routes (Campus Landmarks, Library Loop) are suppressed for the
   * same reason they are in reality: two people have walked them, both of them
   * rehearsing.
   */
  #numbers(adventureId) {
    const funnel = this.funnels[adventureId];
    if (funnel) return { ...funnel.metrics, suppressed: false };
    return { views: 9, starts: 3, totalRuns: 3, completed: 1, groupRuns: 0, plans: 3,
             corroborated: 0, suppressed: true };
  }
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
