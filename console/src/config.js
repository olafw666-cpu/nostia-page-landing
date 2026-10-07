/**
 * Every environment-dependent value in the console. Nothing else holds a URL literal.
 *
 * There is no backend switch. Until 2026-10-06 the ?backend=mock query swapped in an in-memory sample
 * backend for a demo tour; that mode was removed, and the demo is shown by signing a real account
 * into org.nostia.io. The console always talks to a real server.
 */
export const config = {
  /**
   * Base URL for the REST backend. Routes in src/api/routes.js are appended to it.
   *
   * NOT api.nostia.io — that host is the live consumer backend on the DigitalOcean droplet and
   * serves none of the org_* routes this console calls. The org backend is a separate deployment
   * on its own host, so the two never share a cert, a database, or a Stripe webhook endpoint.
   */
  //
  // ONE exception, and it is still this file deciding: when the console is served by a backend
  // host itself (routes/consoleHost.js, when CONSOLE_DIR is set; no host does today), that host injects
  // <meta name="nostia-api-base" content="/api"> and the console talks to the host that served
  // it. On nostia.io there is no such tag and nothing changes.
  // Guarded for the non-browser case so the API layer can be imported by the smoke test, which
  // runs in Node with no DOM.
  apiBaseURL: (typeof document !== 'undefined'
    && document.querySelector('meta[name="nostia-api-base"]')?.getAttribute('content'))
    || 'https://org.nostia.io/api',

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
