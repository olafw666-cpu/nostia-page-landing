import { config } from '../config.js';
import { RestBackend } from './rest.js';
import { MockBackend } from './mock.js';

/**
 * **The seam.** Every page talks to an object with this shape and nothing else — no page calls
 * `fetch`.
 *
 * ```
 * signIn(email, password)                          → { token, user, memberships }
 * loadMe()                                         → { user, memberships }
 * signOut()                                        → void
 * orgAnalytics(orgId)                              → [rollupRow]
 * listAdventures(orgId)                            → [adventure]
 * adventureAnalytics(orgId, adventureId, version?) → analytics
 * exportAnalyticsCSV(orgId, adventureId, version?) → { blob, filename }
 * billingStatus(orgId)                             → billingStatus
 * startCheckout(orgId, tier)                       → { url }
 * billingPortal(orgId)                             → { url }
 * listInviteCodes(orgId)                           → [inviteCode]
 * ```
 *
 * Two implementations satisfy it: `RestBackend` (HTTP, speaking docs/BACKEND_CONTRACT.md) and
 * `MockBackend` (in-memory). The pages cannot tell which one they are running on — which is the
 * test that the abstraction is real rather than decorative.
 *
 * Adopting a different backend:
 *   same shapes, different URLs → edit src/api/routes.js
 *   different payload shapes    → edit src/api/rest.js
 *   not HTTP at all             → write a third object with these methods
 */
export function makeBackend() {
  return config.backend === 'rest' ? new RestBackend() : new MockBackend();
}
