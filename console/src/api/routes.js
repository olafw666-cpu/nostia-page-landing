/**
 * Every path the REST backend uses, in one place.
 *
 * First file to edit when adopting a backend that does the same things at different URLs — no
 * other file in the console contains a path literal. Defaults match docs/BACKEND_CONTRACT.md.
 */
export const routes = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/me',

  orgAnalytics: '/orgs/{org}/analytics',
  adventures: '/orgs/{org}/adventures',
  adventureAnalytics: '/orgs/{org}/adventures/{adventure}/analytics',
  adventureAnalyticsCSV: '/orgs/{org}/adventures/{adventure}/analytics.csv',

  // Authoring. Copied verbatim from apps/ios/Nostia/Core/Backend/BackendRoutes.swift
  // so the two clients cannot drift apart on a path.
  adventure: '/orgs/{org}/adventures/{adventure}',
  steps: '/orgs/{org}/adventures/{adventure}/steps',
  step: '/orgs/{org}/adventures/{adventure}/steps/{step}',
  stepReference: '/orgs/{org}/adventures/{adventure}/steps/{step}/reference',
  stepApprove: '/orgs/{org}/adventures/{adventure}/steps/{step}/approve',
  preflight: '/orgs/{org}/adventures/{adventure}/preflight',
  publish: '/orgs/{org}/adventures/{adventure}/publish',
  archive: '/orgs/{org}/adventures/{adventure}/archive',
  revise: '/orgs/{org}/adventures/{adventure}/revise',

  billing: '/orgs/{org}/billing',
  billingCheckout: '/orgs/{org}/billing/checkout',
  billingPortal: '/orgs/{org}/billing/portal',

  inviteCodes: '/orgs/{org}/invite-codes',
  inviteQR: '/orgs/{org}/invite-codes/{code}/qr.svg',

  // The school layer — clubs, campus events, attendance, moderation, outbox. {org} is the
  // SCHOOL here; the console is the school administrators' surface, and club leaders use the app.
  ssoConfig: '/auth/sso/config',
  ssoToken: '/auth/sso/token',
  policy: '/orgs/{org}/policy',
  clubs: '/orgs/{org}/clubs',
  clubDecision: '/orgs/{org}/clubs/{club}/decision',
  clubStatus: '/orgs/{org}/clubs/{club}/status',
  members: '/orgs/{org}/members',
  events: '/orgs/{org}/events',
  eventCancel: '/orgs/{org}/events/{event}/cancel',
  eventAttendance: '/orgs/{org}/events/{event}/attendance',
  eventPhoto: '/orgs/{org}/events/{event}/attendance/photo',
  eventCheckinCode: '/orgs/{org}/events/{event}/checkin-code',
  eventWaive: '/orgs/{org}/events/{event}/attendance/waive',
  compliance: '/orgs/{org}/attendance/compliance',
  attendanceAnalytics: '/orgs/{org}/attendance/analytics',
  attendanceStudents: '/orgs/{org}/attendance/students',
  attendanceStudent: '/orgs/{org}/attendance/students/{user}',
  attendanceCSV: '/orgs/{org}/attendance.csv',
  survey: '/orgs/{org}/survey',
  moderation: '/orgs/{org}/moderation',
  moderationHide: '/orgs/{org}/moderation/{message}/hide',
  outbox: '/orgs/{org}/outbox',
  outboxPreview: '/orgs/{org}/outbox/preview',
  outboxMessage: '/orgs/{org}/outbox/{message}',
};

/** Substitutes {org}, {adventure}, {code}. */
export function path(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    if (value === undefined || value === null) return match;
    return encodeURIComponent(String(value));
  });
}
