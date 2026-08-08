import { el, formatDuration } from './dom.js';

// ---------------------------------------------------------------------------
// Suppression
// ---------------------------------------------------------------------------

/** A cell is suppressed when the server replaced it with a privacy marker. */
export const isSuppressed = (value) => Boolean(value && typeof value === 'object' && value.suppressed);

/** A rate object carries `{ n, denominator, rate }`. Never a bare percentage. */
export const isRate = (value) =>
  Boolean(value && typeof value === 'object' && 'denominator' in value);

/**
 * One analytics figure.
 *
 * The suppressed case renders as "Needs 5+ walkers", **never as 0**. Below the threshold the server
 * withholds the number because an aggregate over a handful of people identifies them — and an
 * organization shown `0` concludes their tour is broken when it is merely new. Same data, opposite
 * business conclusion, so the two cases never share a rendering.
 */
export function metric({ label, value, caption }) {
  const tile = el('div', { class: 'metric' });
  tile.append(el('div', { class: 'label', text: label }));

  if (isSuppressed(value)) {
    tile.classList.add('suppressed');
    tile.append(el('div', { class: 'value', text: `Needs ${value.threshold ?? 5}+` }));
    tile.append(el('div', { class: 'sub', text: 'Hidden until enough people have walked it' }));
  } else if (isRate(value)) {
    const percent = value.rate == null ? '—' : `${Math.round(value.rate * 100)}%`;
    const thin = value.denominator < 5;
    tile.append(el('div', { class: `value${thin ? ' thin' : ''}`, text: percent }));
    // The denominator always travels with the percentage: "100%" over two runs is not a
    // completion rate, it is two runs.
    tile.append(el('div', { class: 'sub', text: `${value.n} of ${value.denominator}` }));
  } else if (value === null || value === undefined) {
    tile.append(el('div', { class: 'value thin', text: '—' }));
  } else {
    tile.append(el('div', { class: 'value', text: String(value) }));
  }

  if (caption) tile.append(el('div', { class: 'caption', text: caption }));
  return tile;
}

export function suppressionNote(threshold = 5) {
  return notice('info', `Some figures stay hidden until ${threshold} people have walked this`,
    `Aggregates over a handful of people can identify them, so Nostia withholds those cells. They appear on their own once ${threshold} distinct walkers have taken part.`);
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

export function notice(kind, title, message, action) {
  const box = el('div', { class: `notice ${kind}` }, el('h3', { text: title }));
  if (message) box.append(el('p', { text: message }));
  if (action) {
    box.append(el('button', { class: 'btn link', text: action.label, onClick: action.onClick }));
  }
  return box;
}

export function pill(text, kind = '') {
  return el('span', { class: `pill ${kind}`.trim(), text });
}

export function statusPill(status) {
  switch (status) {
    case 'active': return pill('Active', 'ok');
    case 'trialing': return pill('Trial', 'info');
    case 'past_due': return pill('Payment failed', 'warn');
    case 'canceled': return pill('Canceled', 'bad');
    case 'published': return pill('Live', 'ok');
    case 'draft': return pill('Draft');
    case 'archived': return pill('Archived');
    default: return pill('No plan');
  }
}

export function spinner(label = 'Loading') {
  return el('div', { class: 'state' }, el('div', { class: 'spinner' }), el('p', { text: label }));
}

export function emptyState(title, message, action) {
  const box = el('div', { class: 'state' }, el('h2', { text: title }), el('p', { text: message }));
  if (action) box.append(el('button', { class: 'btn', text: action.label, onClick: action.onClick }));
  return box;
}

/**
 * One error presentation for the console.
 *
 * The recovery offered matches the cause: an entitlement failure goes to billing, a switched-off
 * capability explains itself instead of blaming the network, and only genuinely retryable failures
 * get a Retry button.
 */
export function errorState(error, { onRetry, onBilling } = {}) {
  const kind = error?.kind ?? 'unknown';
  const box = el('div', { class: 'state' });

  if (kind === 'entitlement') {
    box.append(el('h2', { text: 'Not on your plan' }));
    box.append(el('p', { text: error.message }));
    if (onBilling) box.append(el('button', { class: 'btn', text: 'See plans', onClick: onBilling }));
    return box;
  }

  if (kind === 'forbidden') {
    box.append(el('h2', { text: 'You don’t have access to this' }));
    box.append(el('p', { text: error.message }));
    return box;
  }

  box.append(el('h2', { text: kind === 'network' ? 'Couldn’t reach the server' : 'Something went wrong' }));
  box.append(el('p', { text: error?.message ?? String(error) }));
  if (onRetry && (error?.retryable ?? true)) {
    box.append(el('button', { class: 'btn ghost', text: 'Try again', onClick: onRetry }));
  }
  return box;
}

export function section(title, subtitle, ...children) {
  const wrap = el('section', { class: 'section' });
  if (title) wrap.append(el('h2', { text: title }));
  if (subtitle) wrap.append(el('p', { class: 'lede', text: subtitle }));
  wrap.append(...children.flat(Infinity).filter(Boolean));
  return wrap;
}

export function detailRow(label, value) {
  return el('div', { class: 'row' },
    el('span', { class: 'small muted', text: label }),
    el('span', { class: 'mono', text: value }));
}

// ---------------------------------------------------------------------------
// Funnel
// ---------------------------------------------------------------------------

/**
 * The per-stop funnel — the single most actionable output an organization gets, because it names
 * the stop people give up at rather than reporting an overall rate nobody can act on.
 */
export function stopFunnel(rows) {
  const scale = Math.max(1, ...rows.map((r) => (isSuppressed(r.reached) ? 0 : r.reached ?? 0)));
  const wrap = el('div', { class: 'card' });

  for (const row of rows) {
    const reached = isSuppressed(row.reached) ? null : row.reached;
    const verified = isSuppressed(row.verified) ? null : row.verified;

    const item = el('div', { class: 'funnel-row' });
    item.append(el('div', { class: 'funnel-head' },
      el('span', { class: 'funnel-ord', text: String(row.order) }),
      el('span', { class: 'funnel-title', text: row.title }),
      el('span', {
        class: 'funnel-count',
        text: reached == null ? 'hidden' : `${verified ?? 0}/${reached}`,
      })));

    const track = el('div', { class: 'funnel-track' });
    if (reached != null) {
      track.append(el('div', {
        class: 'funnel-reached',
        style: { width: `${(reached / scale) * 100}%` },
      }));
    }
    if (verified != null) {
      track.append(el('div', {
        class: 'funnel-verified',
        style: { width: `${(verified / scale) * 100}%` },
      }));
    }
    item.append(track);

    const meta = el('div', { class: 'funnel-meta' });
    const drop = row.drop_off_from_previous;
    if (isRate(drop) && drop.rate != null && drop.rate < 1) {
      const lost = Math.round((1 - drop.rate) * 100);
      meta.append(el('span', { class: drop.rate < 0.7 ? 'warn' : '', text: `${lost}% drop-off` }));
    }
    if (!isSuppressed(row.median_seconds) && row.median_seconds != null) {
      meta.append(el('span', { text: `median ${formatDuration(row.median_seconds)}` }));
    }
    if (meta.childElementCount) item.append(meta);

    // A stop that fails verification repeatedly is an authoring problem — the criterion or the
    // reference photo is wrong. Saying so is the difference between the organization fixing it and
    // the organization deciding its visitors cheat.
    const failed = row.failed_verifications;
    if (isRate(failed) && failed.rate >= 0.4 && failed.denominator >= 5) {
      item.append(el('div', {
        class: 'funnel-flag',
        text: `${failed.n} failed verifications here. The photo criterion or the reference image is probably wrong — that's fixable in the mobile editor.`,
      }));
    }

    wrap.append(item);
  }
  return wrap;
}
