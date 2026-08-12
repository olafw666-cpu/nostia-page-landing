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
};

/** Substitutes {org}, {adventure}, {code}. */
export function path(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    if (value === undefined || value === null) return match;
    return encodeURIComponent(String(value));
  });
}
