import { el, mount } from '../ui/dom.js';
import { spinner, errorState, section, notice } from '../ui/components.js';
import { table, formatDateTime } from '../ui/school.js';

const AUDIENCE_LABEL = {
  members: 'Everyone at the school',
  club_leaders: 'Every club leader',
  clubs: 'Members of chosen clubs',
  event_rsvps: 'People who RSVPed to an event',
  event_attendees: 'People who checked in to an event',
  event_absentees: 'People expected at an event who did not check in',
};

/**
 * Mass email — as an OUTBOX, and the page says so everywhere a message is composed or listed.
 * Nothing leaves the server: the message is recorded and each recipient sees it in the app. That
 * is the honest version for a demo whose every address is on demo.invalid, and it is the seam a
 * real mail transport would attach to later.
 */
export async function renderOutbox(root, { session, navigate, params }) {
  if (params.message) return renderMessage(root, { session, navigate, params });
  mount(root, spinner('Loading the outbox'));
  let log; let clubs; let events;
  try {
    [log, clubs, events] = await Promise.all([
      session.backend.listOutbox(session.orgId),
      session.backend.listClubs(session.orgId),
      session.backend.listEvents(session.orgId),
    ]);
  } catch (error) {
    mount(root, errorState(error, { onRetry: () => renderOutbox(root, { session, navigate, params }) }));
    return;
  }
  mount(root, el('div', {},
    el('h1', { text: 'Outbox' }),
    el('p', { class: 'lede', text: 'Message a range of students at once.' }),
    notice('info', 'Outbox only — nothing is emailed', 'Messages are recorded here and delivered to each recipient inside the Nostia app. No email leaves the server.'),
    section('Compose', null, compose(session, clubs.clubs, events, () => renderOutbox(root, { session, navigate, params }))),
    section('Sent', null, table([
      { label: 'Subject', value: (m) => el('strong', { text: m.subject }) },
      { label: 'To', value: (m) => AUDIENCE_LABEL[m.audience?.kind] ?? m.audience?.kind },
      { label: 'Recipients', value: (m) => m.recipient_count, numeric: true },
      { label: 'Delivery', value: () => 'In the app (outbox only)' },
      { label: 'When', value: (m) => formatDateTime(m.created_at) },
    ], log.messages, { onRowClick: (m) => navigate('outbox', { message: m.id }), empty: 'Nothing sent yet.' }))));
}

function compose(session, clubs, events, onSent) {
  const kind = el('select', { 'aria-label': 'Recipients' }, Object.entries(AUDIENCE_LABEL).map(([k, label]) => el('option', { value: k, text: label })));
  const active = clubs.filter((c) => c.status === 'active');
  const clubBoxes = active.map((c) => ({ id: c.id, input: el('input', { type: 'checkbox' }), name: c.name.replace('Demo University ', '') }));
  const scope = el('select', { 'aria-label': 'Which people in those clubs' },
    el('option', { value: 'members', text: 'All members' }), el('option', { value: 'officers', text: 'Leaders and officers only' }));
  const eventSelect = el('select', { 'aria-label': 'Event' }, events.map((e) => el('option', { value: e.id, text: `${e.title} — ${formatDateTime(e.starts_at)}` })));
  const clubPick = el('div', { class: 'chips' }, clubBoxes.map((b) => el('label', { class: 'check chip' }, b.input, b.name)), scope);
  const eventPick = el('div', {}, eventSelect);
  const subject = el('input', { maxlength: 120, required: true, 'aria-label': 'Subject' });
  const body = el('textarea', { rows: 5, maxlength: 5000, required: true, 'aria-label': 'Message' });
  const count = el('p', { class: 'small muted', text: '' });
  const status = el('div');

  const audience = () => {
    const k = kind.value;
    if (k === 'clubs') return { kind: k, club_ids: clubBoxes.filter((b) => b.input.checked).map((b) => b.id), scope: scope.value };
    if (k.startsWith('event_')) return { kind: k, event_id: Number(eventSelect.value) };
    return { kind: k };
  };
  const sync = async () => {
    clubPick.hidden = kind.value !== 'clubs';
    eventPick.hidden = !kind.value.startsWith('event_');
    count.textContent = 'Counting…';
    try {
      const p = await session.backend.previewOutbox(session.orgId, audience());
      count.textContent = `${p.recipient_count} recipient${p.recipient_count === 1 ? '' : 's'}${p.sample?.length ? ` — ${p.sample.slice(0, 4).map((u) => u.name).join(', ')}${p.recipient_count > 4 ? '…' : ''}` : ''}. Delivered in the app; nothing is emailed.`;
    } catch (error) {
      count.textContent = error.message;
    }
  };
  kind.addEventListener('change', sync);
  scope.addEventListener('change', sync);
  eventSelect.addEventListener('change', sync);
  clubBoxes.forEach((b) => b.input.addEventListener('change', sync));
  queueMicrotask(sync);

  const send = el('button', { class: 'btn', type: 'submit', text: 'Record and deliver in the app' });
  return el('form', { class: 'card', onSubmit: async (event) => {
    event.preventDefault();
    send.disabled = true;
    try {
      await session.backend.sendOutbox(session.orgId, { subject: subject.value.trim(), body: body.value.trim(), audience: audience() });
      onSent();
    } catch (error) {
      mount(status, notice('bad', 'Not recorded', error.message));
      send.disabled = false;
    }
  } },
  el('label', { class: 'field' }, el('span', { text: 'To' }), kind),
  clubPick, eventPick, count,
  el('label', { class: 'field' }, el('span', { text: 'Subject' }), subject),
  el('label', { class: 'field' }, el('span', { text: 'Message' }), body),
  status, send);
}

async function renderMessage(root, { session, navigate, params }) {
  mount(root, spinner());
  let m;
  try {
    m = await session.backend.loadOutbox(session.orgId, params.message);
  } catch (error) {
    mount(root, errorState(error, { onRetry: () => renderMessage(root, { session, navigate, params }) }));
    return;
  }
  const STATUS = { recorded: 'Recorded', undeliverable_domain: 'Recorded (address cannot receive mail)', no_address: 'Recorded (no address)' };
  mount(root, el('div', {},
    el('button', { class: 'btn link', text: '← Outbox', onClick: () => navigate('outbox') }),
    el('h1', { text: m.subject }),
    el('p', { class: 'lede', text: `${AUDIENCE_LABEL[m.audience?.kind] ?? ''} · ${m.recipient_count} recipients · ${formatDateTime(m.created_at)}` }),
    notice('info', 'Outbox only', 'This message was recorded and shown to each recipient in the app. It was not emailed.'),
    el('div', { class: 'card' }, el('p', { class: 'pre', text: m.body })),
    section('Recipients', null, table([
      { label: 'Name', value: (r) => r.user?.name ?? '—' },
      { label: 'Status', value: (r) => STATUS[r.status] ?? r.status },
    ], m.recipients))));
}
