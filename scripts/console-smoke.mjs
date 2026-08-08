/**
 * Contract smoke test for the console's API layer. `node scripts/smoke.mjs`, no dependencies.
 *
 * It asserts the things a UI bug would otherwise hide until a customer saw it:
 *
 *  - the two backends expose the same method set (the seam is real, not aspirational)
 *  - suppressed cells arrive as markers and are never mistaken for zero
 *  - every rate carries its denominator
 *  - an unpriced tier refuses checkout with 501 rather than inventing a number
 *  - a gated feature refuses with 402, so the UI can route to billing
 *
 * It does not touch the DOM, so it runs anywhere Node does.
 */
import { MockBackend } from '../public/console/src/api/mock.js';
import { RestBackend } from '../public/console/src/api/rest.js';

let passed = 0;
const failures = [];

function check(label, condition) {
  if (condition) {
    passed += 1;
  } else {
    failures.push(label);
  }
}

async function expectError(label, kind, run) {
  try {
    await run();
    failures.push(`${label} — expected ${kind}, got success`);
  } catch (error) {
    check(`${label} → ${kind}`, error?.kind === kind);
  }
}

const isSuppressed = (v) => Boolean(v && typeof v === 'object' && v.suppressed);
const isRate = (v) => Boolean(v && typeof v === 'object' && 'denominator' in v);

const backend = new MockBackend();

// ---- The seam ---------------------------------------------------------------

const contractMethods = [
  'signIn', 'loadMe', 'signOut', 'orgAnalytics', 'listAdventures', 'adventureAnalytics',
  'exportAnalyticsCSV', 'billingStatus', 'startCheckout', 'billingPortal', 'listInviteCodes',
  'setCredentials',
];
for (const method of contractMethods) {
  check(`MockBackend.${method}`, typeof backend[method] === 'function');
  check(`RestBackend.${method}`, typeof RestBackend.prototype[method] === 'function');
}

// ---- Identity ---------------------------------------------------------------

const auth = await backend.signIn('olaf@nostia.io', 'x');
check('sign-in returns a token', typeof auth.token === 'string' && auth.token.length > 0);
check('sign-in returns memberships', Array.isArray(auth.memberships) && auth.memberships.length > 0);
check('roles are present on every membership', auth.memberships.every((m) => typeof m.role === 'string'));
check('sample data includes a non-owner, so the owner gate is exercised',
  auth.memberships.some((m) => m.role !== 'owner'));

// ---- Analytics with real numbers (org 1) ------------------------------------

const rich = await backend.adventureAnalytics(1, 1);
check('metrics present', Boolean(rich.metrics));
check('starts is a plain number when above threshold', typeof rich.metrics.starts === 'number');
check('completion rate carries n and denominator', isRate(rich.metrics.verified_completion_rate));
check('completion rate denominator is non-zero',
  rich.metrics.verified_completion_rate.denominator > 0);
check('per-stop funnel is populated', rich.per_stop.length > 0);
check('first stop has no drop-off from a previous stop', rich.per_stop[0].drop_off_from_previous === null);
check('versions_available is a list', Array.isArray(rich.versions_available));
check('threshold is reported so the UI can name it', rich.small_n_threshold === 5);

const flagged = rich.per_stop.find((s) => isRate(s.failed_verifications)
  && s.failed_verifications.rate >= 0.4);
check('a stop with heavy verification failure exists to exercise the authoring-problem callout',
  Boolean(flagged));

// ---- Analytics below the threshold (org 2) ----------------------------------

const thin = await backend.adventureAnalytics(2, 3);
check('starts suppresses below threshold', isSuppressed(thin.metrics.starts));
check('suppression marker names the threshold', thin.metrics.starts.threshold === 5);
check('suppression is never the number zero', thin.metrics.starts !== 0);
check('per-stop cells suppress too', thin.per_stop.every((s) => isSuppressed(s.reached)));

const rollup = await backend.orgAnalytics(2);
check('roll-up suppresses as well', rollup.every((r) => isSuppressed(r.starts)));

// ---- Commercial paths -------------------------------------------------------

const billing = await backend.billingStatus(1);
check('billing reports a tier', typeof billing.tier === 'string');
check('billing reports whether it is purchasable', typeof billing.purchasable === 'boolean');
check('no price is present anywhere in the billing payload',
  !JSON.stringify(billing).match(/"(price|amount|currency)"/));
check('unlimited is null, not zero',
  billing.entitlements.adventures === null || billing.entitlements.adventures > 0);

await expectError('checkout for an unpriced tier', 'not-purchasable',
  () => backend.startCheckout(1, 'standard'));
await expectError('billing portal with Stripe unconfigured', 'unavailable',
  () => backend.billingPortal(1));
await expectError('CSV export below the institutional tier', 'entitlement',
  () => backend.exportAnalyticsCSV(1, 1));
await expectError('analytics for an adventure in another organization', 'not-found',
  () => backend.adventureAnalytics(1, 3));

// ---- Past-due semantics -----------------------------------------------------

const pastDue = await backend.billingStatus(3);
check('a past-due organization still reports its published adventures',
  pastDue.usage.published_adventures > 0);
check('nothing in the payload marks published content as taken down',
  !JSON.stringify(pastDue).includes('unpublished'));

// ---- Result -----------------------------------------------------------------

if (failures.length) {
  console.error(`\n${failures.length} failed:\n` + failures.map((f) => `  ✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${passed} assertions passed`);
