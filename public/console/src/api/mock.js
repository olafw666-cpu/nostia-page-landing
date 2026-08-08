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

    this.billing = {
      1: {
        tier: 'standard', label: 'Standard', status: 'active',
        current_period_end: '2026-09-01T00:00:00Z', seats: 1,
        entitlements: {
          adventures: 5, stops: 15, analytics: true, custom_branding: true,
          invite_codes: true, csv_export: false, multi_admin: false, assist_calls_per_day: 20,
        },
        usage: { published_adventures: 1 },
        // Both false, because both are false in reality: no tier has a Stripe price and Stripe is
        // not configured. The console therefore renders the path that actually ships.
        purchasable: false,
        configured: false,
      },
      2: {
        tier: 'trial', label: 'Trial', status: 'trialing',
        current_period_end: '2026-08-28T00:00:00Z', seats: null,
        entitlements: {
          adventures: 1, stops: 5, analytics: true, custom_branding: false,
          invite_codes: false, csv_export: false, multi_admin: false, assist_calls_per_day: 3,
        },
        usage: { published_adventures: 1 },
        purchasable: false,
        configured: false,
      },
      3: {
        tier: 'trial', label: 'Trial', status: 'past_due',
        current_period_end: '2026-07-20T00:00:00Z', seats: null,
        entitlements: {
          adventures: 1, stops: 5, analytics: true, custom_branding: false,
          invite_codes: false, csv_export: false, multi_admin: false, assist_calls_per_day: 3,
        },
        usage: { published_adventures: 1 },
        purchasable: false,
        configured: false,
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
    const titles = this.stops[adventure.id] ?? [];

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
      throw new ApiError('entitlement', 'CSV export is part of the Institutional plan.',
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
