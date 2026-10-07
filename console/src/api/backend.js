import { RestBackend } from './rest.js';

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
 *
 * loadAdventure(orgId, advId)                      → { adventure, steps, preflightFailures }
 * createAdventure(orgId, fields)                   → adventure
 * updateAdventure(orgId, advId, fields)            → adventure
 * addStep(orgId, advId, fields)                    → step
 * updateStep(orgId, advId, stepId, fields)         → step
 * deleteStep(orgId, advId, stepId)                 → true
 * uploadStepReference(orgId, advId, stepId, file)  → { ok, has_reference }
 * approveStep(orgId, advId, stepId)                → { ok }
 * preflight(orgId, advId)                          → { ok, failures }
 * publishAdventure(orgId, advId)                   → adventure
 * archiveAdventure(orgId, advId)                   → adventure
 * reviseAdventure(orgId, advId)                    → adventure
 * ```
 *
 * The school layer (clubs, campus events, attendance, moderation, outbox, mock SSO) adds:
 *
 * ```
 * ssoConfig() / ssoExchange({code, code_verifier, redirect_uri})
 * getPolicy / updatePolicy                       listClubs / createClub / decideClub / setClubStatus
 * listMembers                                    listEvents / createEvent / cancelEvent
 * eventAttendance / uploadAttendancePhoto / fileAttendance / openCheckin / waiveAttendance
 * attendanceCompliance / attendanceAnalytics / studentAttendance / studentDetail / exportAttendanceCSV
 * getSurvey / updateSurvey                       listModeration / hideChatMessage
 * listOutbox / previewOutbox / sendOutbox / loadOutbox
 * ```
 *
 * `RestBackend` (HTTP, speaking docs/BACKEND_CONTRACT.md) is the only one the console loads. An
 * in-memory `MockBackend` with the same methods lives in scripts/console-fixtures/ for the smoke
 * test, outside public/ so it is never published (it was the ?backend=mock sample tour until
 * 2026-10-06).
 *
 * Adopting a different backend:
 *   same shapes, different URLs → edit src/api/routes.js
 *   different payload shapes    → edit src/api/rest.js
 *   not HTTP at all             → write a third object with these methods
 */
export function makeBackend() {
  return new RestBackend();
}
