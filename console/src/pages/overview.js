import { el, mount, formatDate } from '../ui/dom.js';
import {
  spinner, errorState, emptyState, section, statusPill, metric,
  isSuppressed, notice,
} from '../ui/components.js';

/**
 * Landing page: how the organization's published adventures are doing, and whether the plan is in
 * good standing.
 *
 * Deliberately answers two questions and no more — is this working, and what are we paying for it.
 * Those are the two decisions that get made at a desk; authoring happens on a phone, standing at
 * the stop being anchored.
 */
export async function renderOverview(root, { session, navigate }) {
  mount(root, spinner('Loading your organization'));
  const orgId = session.orgId;

  let rows;
  let billing = null;
  try {
    [rows, billing] = await Promise.all([
      session.backend.orgAnalytics(orgId),
      session.backend.billingStatus(orgId).catch(() => null),
    ]);
  } catch (error) {
    mount(root, errorState(error, {
      onRetry: () => renderOverview(root, { session, navigate }),
      onBilling: () => navigate('billing'),
    }));
    return;
  }

  const page = el('div');
  page.append(el('h1', { text: session.organization?.name ?? 'Overview' }));
  page.append(el('p', { class: 'lede', text: 'Published adventures and how they are performing.' }));

  // A school gets the attendance picture first: it is the reason the school is here.
  if (session.isInstitution) {
    try {
      const [board, clubs] = await Promise.all([
        session.backend.attendanceCompliance(orgId),
        session.backend.listClubs(orgId),
      ]);
      const pending = clubs.clubs.filter((c) => c.status === 'pending').length;
      const s = board.summary;
      page.append(section('This week at a glance', null, el('div', { class: 'grid grid-4' },
        metric({ label: 'Active clubs', value: clubs.clubs.filter((c) => c.status === 'active').length, caption: pending ? `${pending} waiting for approval` : 'none waiting' }),
        metric({ label: 'Clubs locked', value: s.locked, caption: 'overdue on attendance' }),
        metric({ label: 'Open to file', value: s.open_events, caption: 'club events' }),
        metric({ label: 'Flagged photos', value: s.flagged, caption: 'to review' }))));
      if (s.locked || s.flagged || pending) {
        page.append(notice('warn', 'Needs a look',
          [s.locked && `${s.locked} club${s.locked === 1 ? ' is' : 's are'} locked for overdue attendance`,
            s.flagged && `${s.flagged} headcount${s.flagged === 1 ? '' : 's'} flagged for review`,
            pending && `${pending} club request${pending === 1 ? '' : 's'} waiting`].filter(Boolean).join(' · '),
          { label: 'Open attendance', onClick: () => navigate('attendance') }));
      }
    } catch { /* the rest of the overview still renders */ }
  }

  if (billing?.status === 'past_due') {
    // Worth stating precisely rather than as a generic warning: the org's live content is not at
    // risk, and knowing that changes how urgently they treat it.
    page.append(notice('warn', 'Last payment failed',
      'Everything already published stays live — a printed QR code on a sign has to keep working. New publishes and assistant drafts are paused until the payment goes through.',
      { label: 'Go to billing', onClick: () => navigate('billing') }));
  }

  if (billing) {
    page.append(section(null, null, el('div', { class: 'grid grid-3' },
      metric({ label: 'Plan', value: billing.label, caption: renewalCaption(billing) }),
      metric({
        label: 'Published',
        value: billing.usage?.published_adventures ?? 0,
        caption: billing.entitlements.adventures == null
          ? 'Unlimited on this plan'
          : `of ${billing.entitlements.adventures} allowed`,
      }),
      metric({
        label: 'Stops per adventure',
        value: billing.entitlements.stops ?? '∞',
        caption: billing.entitlements.stops == null ? 'Unlimited' : 'Plan limit',
      }))));
  }

  if (!rows.length) {
    page.append(emptyState('Nothing published yet',
      'Adventures are authored in the Nostia mobile app — you have to be standing at a stop to anchor it. Once one is published, its numbers appear here.'));
  } else {
    const list = el('div');
    for (const row of rows) {
      list.append(adventureRow(row, () => navigate('analytics', { adventure: row.id })));
    }
    page.append(section('Adventures', 'Select one for the stop-by-stop breakdown.', list));
  }

  page.append(el('p', { class: 'small muted',
    text: 'Every figure here is anonymous and aggregated. Nostia never shows an organization who walked an adventure.' }));

  mount(root, page);
}

function adventureRow(row, onOpen) {
  const meta = el('div', { class: 'meta' }, statusPill(row.status), el('span', { text: `v${row.version}` }));

  const figure = el('div', { class: 'figure' });
  if (isSuppressed(row.starts)) {
    figure.append(el('span', { class: 'muted', text: '—' }),
                  el('small', { text: 'too few students yet' }));
  } else {
    figure.append(String(row.starts ?? 0), el('small', { text: 'students' }));
  }

  return el('button', { class: 'list-item', onClick: onOpen },
    el('div', {},
      el('div', { class: 'title', text: row.title }),
      meta),
    figure);
}

function renewalCaption(billing) {
  const date = formatDate(billing.current_period_end);
  if (!date) return billing.status ?? 'No plan';
  if (billing.status === 'canceled') return `Access ends ${date}`;
  if (billing.status === 'past_due') return `Period ended ${date}`;
  return `Renews ${date}`;
}
