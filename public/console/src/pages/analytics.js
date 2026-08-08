import { el, mount, download } from '../ui/dom.js';
import {
  spinner, errorState, emptyState, section, metric, stopFunnel,
  suppressionNote, isSuppressed, notice, statusPill,
} from '../ui/components.js';

/**
 * Analytics — the renewal driver.
 *
 * Authoring is a one-time cost the buyer pays in labour. This is the thing that still has to be
 * worth money in month eleven, so it is built to stay legible when the numbers are small and honest
 * when they are thin.
 */
export async function renderAnalytics(root, { session, navigate, params }) {
  const orgId = session.orgId;
  mount(root, spinner('Loading analytics'));

  let adventures;
  try {
    adventures = await session.backend.orgAnalytics(orgId);
  } catch (error) {
    mount(root, errorState(error, {
      onRetry: () => renderAnalytics(root, { session, navigate, params }),
      onBilling: () => navigate('billing'),
    }));
    return;
  }

  if (!adventures.length) {
    mount(root, el('div', {},
      el('h1', { text: 'Analytics' }),
      emptyState('Nothing measured yet',
        'Numbers appear once an adventure is published and people start walking it.')));
    return;
  }

  const selectedId = params.adventure ?? adventures[0].id;
  const page = el('div');
  page.append(el('h1', { text: 'Analytics' }));
  page.append(el('p', { class: 'lede', text: 'Anonymous, aggregated, and measured separately for each published version.' }));

  const tabs = el('div', { class: 'tabs' });
  for (const adventure of adventures) {
    tabs.append(el('button', {
      text: adventure.title,
      'aria-pressed': String(String(adventure.id) === String(selectedId)),
      onClick: () => navigate('analytics', { adventure: adventure.id }),
    }));
  }
  page.append(tabs);

  const detailSlot = el('div', {}, spinner('Loading'));
  page.append(detailSlot);
  mount(root, page);

  await renderDetail(detailSlot, { session, navigate, adventureId: selectedId, version: params.version });
}

async function renderDetail(slot, { session, navigate, adventureId, version }) {
  const orgId = session.orgId;
  let analytics;
  let billing = null;
  try {
    [analytics, billing] = await Promise.all([
      session.backend.adventureAnalytics(orgId, adventureId, version),
      session.backend.billingStatus(orgId).catch(() => null),
    ]);
  } catch (error) {
    mount(slot, errorState(error, {
      onRetry: () => renderDetail(slot, { session, navigate, adventureId, version }),
      onBilling: () => navigate('billing'),
    }));
    return;
  }

  const page = el('div');

  page.append(el('div', { class: 'row', style: { marginBottom: '16px' } },
    el('div', {},
      el('h2', { text: analytics.adventure.title, style: { marginBottom: '6px' } }),
      el('div', { class: 'meta small muted' }, statusPill(analytics.adventure.status),
        el('span', { text: ` version ${analytics.adventure.version}` }))),
    versionPicker(analytics, (next) => navigate('analytics', { adventure: adventureId, version: next }))));

  if (analytics.versions_available.length > 1) {
    // Editing an adventure starts a new measurement series. Mixing versions would judge a fix to a
    // broken stop against the very numbers it was made to repair.
    page.append(el('p', { class: 'small muted',
      text: 'Each published version is measured on its own, so an edit never contaminates the numbers it was meant to fix.' }));
  }

  const m = analytics.metrics;
  page.append(section(null, null, el('div', { class: 'grid grid-3' },
    metric({ label: 'Views', value: m.views, caption: 'People who opened it' }),
    metric({ label: 'Walkers', value: m.starts, caption: 'Distinct people who started' }),
    metric({ label: 'Completed', value: m.verified_completion_rate, caption: 'Verified on foot, not self-reported' }),
    metric({ label: 'In groups', value: m.group_rate, caption: 'Runs with two or more people' }),
    metric({ label: 'Corroborated', value: m.corroborated_runs, caption: 'Two people verified the same stop together — the strongest signal' }),
    metric({ label: 'Rating', value: m.median_rating, caption: 'Median, out of 5' }))));

  const anySuppressed = isSuppressed(m.starts) || analytics.per_stop.some((s) => isSuppressed(s.reached));
  if (anySuppressed) page.append(suppressionNote(analytics.small_n_threshold));

  page.append(section('Stop by stop', 'Where people stop walking, named.',
    analytics.per_stop.length
      ? stopFunnel(analytics.per_stop)
      : el('p', { class: 'muted', text: 'No stops recorded for this version.' })));

  page.append(exportBlock({ session, navigate, analytics, billing, adventureId, version }));
  mount(slot, page);
}

function versionPicker(analytics, onChange) {
  if (analytics.versions_available.length < 2) return null;
  const select = el('select', {
    onChange: (event) => onChange(event.target.value),
    'aria-label': 'Version',
  });
  for (const value of analytics.versions_available) {
    const option = el('option', { value, text: `Version ${value}` });
    if (value === analytics.adventure.version) option.selected = true;
    select.append(option);
  }
  return el('label', { class: 'field', style: { marginBottom: '0', minWidth: '150px' } },
    el('span', { text: 'Version' }), select);
}

function exportBlock({ session, navigate, billing, adventureId, version }) {
  const wrap = el('div', { class: 'card' });
  const allowed = billing?.entitlements?.csv_export ?? false;
  const status = el('div');

  const button = el('button', {
    class: allowed ? 'btn' : 'btn ghost',
    text: 'Export CSV',
    onClick: async () => {
      button.disabled = true;
      mount(status);
      try {
        const { blob, filename } = await session.backend.exportAnalyticsCSV(
          session.orgId, adventureId, version);
        download(blob, filename);
      } catch (error) {
        mount(status, error.routesToBilling
          ? notice('warn', 'Not on your plan', error.message,
              { label: 'See plans', onClick: () => navigate('billing') })
          : notice('bad', 'Export failed', error.message));
      }
      button.disabled = false;
    },
  });

  wrap.append(el('div', { class: 'row' },
    el('div', {},
      el('h3', { text: 'Export' }),
      // The export is aggregates — the same figures shown here, suppression already applied. Raw
      // per-person rows are deliberately not a product on any surface.
      el('p', { class: 'small muted',
        text: 'Exports the aggregates on this page, with suppression applied. Not per-person rows — Nostia does not produce those.' })),
    button));
  wrap.append(status);
  if (!allowed) {
    wrap.append(el('p', { class: 'small muted',
      text: 'CSV export is part of the Institutional plan.' }));
  }
  return wrap;
}
