/**
 * One error type for the whole console.
 *
 * The `kind` field is what pages branch on. Two of them must never be collapsed into a generic
 * failure, because they are the entire commercial surface:
 *
 *  - `entitlement` (402) — the plan doesn't include this. Route to billing, never show a
 *    permission error: the user isn't forbidden, they're unsubscribed.
 *  - `not-purchasable` (501) — the tier has no price configured in Stripe yet. Say so; do not
 *    guess a number.
 */
export class ApiError extends Error {
  constructor(kind, message, extra = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    Object.assign(this, extra);
  }

  get routesToBilling() {
    return this.kind === 'entitlement';
  }

  get retryable() {
    return ['network', 'server', 'unknown'].includes(this.kind);
  }

  static fromStatus(status, body) {
    const message = body?.error || `Request failed (${status})`;
    const extra = { status, reason: body?.reason, tier: body?.tier };
    switch (status) {
      case 401: return new ApiError('unauthenticated', 'Your session expired. Sign in again.', extra);
      case 402: return new ApiError('entitlement', message, extra);
      case 403: return new ApiError('forbidden', message, extra);
      case 404: return new ApiError('not-found', message, extra);
      case 409: return new ApiError('conflict', message, extra);
      case 429: return new ApiError('rate-limited', message, extra);
      case 501: return new ApiError('not-purchasable', message, extra);
      case 503: return new ApiError('unavailable', message, extra);
      default:
        return new ApiError(status >= 500 ? 'server' : 'unknown', message, extra);
    }
  }
}
