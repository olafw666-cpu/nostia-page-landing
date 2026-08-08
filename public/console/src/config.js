/**
 * Every environment-dependent value in the console. Nothing else holds a URL literal.
 *
 * `backend` is the switch between the in-memory sample data and a real server. A backend IS
 * now deployed (org.nostia.io), so `rest` is the default — the previous `mock` default existed
 * only because there was nothing to talk to.
 */
export const config = {
  /**
   * 'rest' | 'mock' — overridable at runtime with ?backend=mock, which is how the sample data
   * is demoed without a server and without an account.
   *
   * Guarded for the non-browser case so the API layer can be imported by the smoke test, which
   * runs in Node with no DOM.
   */
  backend: (typeof location !== 'undefined'
    ? new URLSearchParams(location.search).get('backend')
    : null) || 'rest',

  /**
   * Base URL for the REST backend. Routes in src/api/routes.js are appended to it.
   *
   * NOT api.nostia.io — that host is the live consumer backend on the DigitalOcean droplet and
   * serves none of the org_* routes this console calls. The org backend is a separate deployment
   * on its own host, so the two never share a cert, a database, or a Stripe webhook endpoint.
   */
  apiBaseURL: 'https://org.nostia.io/api',

  /** Where "get in touch" goes when a tier has no Stripe price configured yet. */
  salesContact: 'mailto:sales@nostia.io?subject=Nostia%20for%20organizations',

  /**
   * The console is for organization OWNERS.
   *
   * Billing routes are owner-only server-side, so an admin would see a dashboard whose primary
   * action 403s. Gating in the client turns that into an explanation instead of a broken screen —
   * it is a UX decision, not a security one. The server is still the authority.
   */
  requiredRole: 'owner',
};
