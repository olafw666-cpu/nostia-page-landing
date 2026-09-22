import { el, mount } from '../ui/dom.js';
import { spinner, errorState, section, metric, notice, pill } from '../ui/components.js';
import {
  table, attendancePill, verdictPill, provenanceNote, formatDateTime, relative, methodsLabel,
} from '../ui/school.js';

/**
 * Campus events — the ones the SCHOOL runs (orientation sessions, fairs, wellness weeks), aimed at
 * everyone or at chosen clubs, whose members are notified in the app. They carry their own
 * attendance terms, in a category the analytics never mixes with club events.
 *
 * Club events are scheduled by club leaders in the app; a school admin sees them on the
 * Attendance page, and opens the same detail view below from there.
 */
export async function renderEvents(root, { session, navigate, params }) {
  if (params.event) {
    return renderEventDetail(root, { session, navigate, params, back: () => navigate('events') });
  }
  mount(root, spinner('Loading campus events'));
  let events; let policy; let clubs;
  try {
    [events, policy, clubs] = await Promise.all([
      session.backend.listEvents(session.orgId),
      session.backend.getPolicy(session.orgId),
      session.backend.listClubs(session.orgId),
    ]);
  } catch (error) {
    mount(root, errorState(error, { onRetry: () => renderEvents(root, { session, navigate, params }) }));
    return;
  }
  const now = new Date().toISOString();
  const upcoming = events.filter((e) => e.ends_at >= now);
  const past = events.filter((e) => e.ends_at < now);
  const cols = [
    { label: 'Event', value: (e) => el('div', {}, el('strong', { text: e.title }), el('div', { class: 'small muted', text: e.location })) },
    { label: 'When', value: (e) => `${formatDateTime(e.starts_at)} (${relative(e.starts_at)})` },
    { label: 'For', value: (e) => audienceLabel(e, clubs.clubs) },
    { label: 'Attendance', value: (e) => (e.status === 'cancelled' ? pill('Cancelled') : attendancePill(e.attendance.status)) },
    { label: 'RSVPs', value: (e) => e.rsvp_going, numeric: true },
    { label: 'Checked in', value: (e) => e.checkins, numeric: true },
  ];
  const open = (e) => navigate('events', { event: e.id });

  mount(root, el('div', {},
    el('h1', { text: 'Campus events' }),
    el('p', { class: 'lede', text: 'Events the school runs. Members of the clubs you choose are notified in the app, and attendance is tracked separately from club events.' }),
    section('Schedule a campus event', null, createForm(session, policy, clubs.clubs, () => renderEvents(root, { session, navigate, params }))),
    section('Upcoming', null, table(cols, upcoming, { onRowClick: open, empty: 'Nothing scheduled.' })),
    section('Past', null, table(cols, past, { onRowClick: open, empty: 'No past events.' }))));
}

function audienceLabel(e, clubs) {
  if (!e.audience || e.audience.all) return 'Everyone';
  const names = e.audience.club_ids.map((id) => clubs.find((c) => c.id === id)?.name?.replace('Demo University ', '') ?? `#${id}`);
  return names.join(', ');
}

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createForm(session, policy, clubs, onCreated) {
  const start = new Date(Date.now() + 2 * 86400000); start.setMinutes(0, 0, 0); start.setHours(17);
  const title = el('input', { required: true, maxlength: 100, placeholder: 'e.g. Spring Involvement Fair' });
  const location = el('input', { maxlength: 120, placeholder: 'Where' });
  const description = el('textarea', { rows: 2, maxlength: 1000, placeholder: 'What it is, in a sentence or two' });
  const starts = el('input', { type: 'datetime-local', value: toLocalInput(start) });
  const ends = el('input', { type: 'datetime-local', value: toLocalInput(new Date(start.getTime() + 2 * 3600000)) });
  const everyone = el('input', { type: 'radio', name: 'aud', checked: true });
  const some = el('input', { type: 'radio', name: 'aud' });
  const active = clubs.filter((c) => c.status === 'active');
  const boxes = active.map((c) => ({ id: c.id, input: el('input', { type: 'checkbox' }), name: c.name }));
  const required = el('input', { type: 'checkbox', checked: policy.campus.attendance_required });
  const photo = el('input', { type: 'checkbox', checked: policy.campus.methods.includes('photo') });
  const survey = el('input', { type: 'checkbox', checked: policy.campus.methods.includes('survey') || !policy.campus.methods.length });
  const status = el('div');
  const submit = el('button', { class: 'btn', type: 'submit', text: 'Schedule and notify' });

  return el('form', { class: 'card', onSubmit: async (event) => {
    event.preventDefault();
    submit.disabled = true;
    mount(status);
    const clubIds = some.checked ? boxes.filter((b) => b.input.checked).map((b) => b.id) : [];
    if (some.checked && !clubIds.length) {
      mount(status, notice('bad', 'Pick at least one club', 'Or choose "Everyone".'));
      submit.disabled = false;
      return;
    }
    try {
      await session.backend.createEvent(session.orgId, {
        title: title.value.trim(), location: location.value.trim(), description: description.value.trim(),
        starts_at: new Date(starts.value).toISOString(), ends_at: new Date(ends.value).toISOString(),
        audience_all: !some.checked, audience_club_ids: clubIds,
        attendance_required: required.checked,
        attendance_methods: [photo.checked && 'photo', survey.checked && 'survey'].filter(Boolean),
      });
      onCreated();
    } catch (error) {
      mount(status, notice('bad', 'Not scheduled', error.message));
      submit.disabled = false;
    }
  } },
  el('label', { class: 'field' }, el('span', { text: 'Title' }), title),
  el('div', { class: 'grid grid-2' },
    el('label', { class: 'field' }, el('span', { text: 'Starts' }), starts),
    el('label', { class: 'field' }, el('span', { text: 'Ends' }), ends)),
  el('label', { class: 'field' }, el('span', { text: 'Location' }), location),
  el('label', { class: 'field' }, el('span', { text: 'Description' }), description),
  el('fieldset', { class: 'plain' }, el('legend', { text: 'Who is it for? They are notified in the app.' }),
    el('label', { class: 'check' }, everyone, 'Everyone at the school'),
    el('label', { class: 'check' }, some, 'Members of these clubs:'),
    el('div', { class: 'chips' }, boxes.map((b) => el('label', { class: 'check chip' }, b.input, b.name.replace('Demo University ', ''))))),
  el('fieldset', { class: 'plain' }, el('legend', { text: 'Attendance for this event' }),
    el('label', { class: 'check' }, required, 'Attendance is required'),
    el('label', { class: 'check' }, survey, 'Survey + check-in code'),
    el('label', { class: 'check' }, photo, 'Room photo with AI headcount')),
  status, submit);
}

// ---------------------------------------------------------------------------
// Event detail — one event's full attendance record. Used by this page and by Attendance.
// ---------------------------------------------------------------------------

export async function renderEventDetail(root, { session, navigate, params, back }) {
  mount(root, spinner('Loading the attendance record'));
  let d;
  try {
    d = await session.backend.eventAttendance(session.orgId, params.event);
  } catch (error) {
    mount(root, errorState(error, { onRetry: () => renderEventDetail(root, { session, navigate, params, back }) }));
    return;
  }
  const refresh = () => renderEventDetail(root, { session, navigate, params, back });
  const e = d.event;
  const own = String(e.org_id) === String(session.orgId);
  const lastCheck = d.photo_checks[d.photo_checks.length - 1];
  const canFile = own && ['open', 'overdue'].includes(d.status);

  const page = el('div', {},
    el('button', { class: 'btn link', text: '← Back', onClick: back }),
    el('h1', { text: e.title }),
    el('p', { class: 'lede' },
      `${e.org_name} · ${formatDateTime(e.starts_at)} – ${formatDateTime(e.ends_at)}${e.location ? ` · ${e.location}` : ''}`),
    el('div', { class: 'row' }, attendancePill(d.status),
      el('span', { class: 'small muted', text: e.attendance.required
        ? `${methodsLabel(e.attendance.methods)} · due ${formatDateTime(e.attendance.due_at)} (${relative(e.attendance.due_at)})`
        : 'Attendance not required' })));

  page.append(section(null, null, el('div', { class: 'grid grid-4' },
    metric({ label: 'Reported by the leader', value: d.report?.reported_count ?? null, caption: d.report ? `Filed ${formatDateTime(d.report.filed_at)}` : 'Not filed yet' }),
    metric({ label: 'Room-photo estimate', value: lastCheck?.ai_count != null ? `~${lastCheck.ai_count}` : null,
      caption: lastCheck ? (lastCheck.ai_count != null ? `range ${lastCheck.ai_count_low}–${lastCheck.ai_count_high}` : 'not analysed') : 'No photo' }),
    metric({ label: 'Checked in themselves', value: d.checkins.length, caption: `of ${d.expected} expected` }),
    metric({ label: 'RSVPs', value: d.rsvps.filter((r) => r.status === 'going').length, caption: 'said they were going' }))));

  if (d.photo_checks.length) {
    page.append(section('Room photo checks', 'The photograph is analysed and discarded — only a fingerprint of it is kept.',
      ...d.photo_checks.map((c) => el('div', { class: 'card' },
        el('div', { class: 'row' }, verdictPill(c), el('span', { class: 'small muted', text: formatDateTime(c.created_at) })),
        el('p', { class: 'small', text: `Leader said ${c.claimed_count}; ${c.ai_count != null ? `estimate ~${c.ai_count} (range ${c.ai_count_low}–${c.ai_count_high}, ${c.ai_confidence} confidence)` : 'no estimate'}.` }),
        c.reason ? el('p', { class: 'small muted', text: c.reason }) : null,
        el('p', { class: 'small muted', text: provenanceNote(c) })))));
  }

  if (d.report) {
    page.append(section(d.report.outcome === 'waived' ? 'Waived' : 'Filed', null, el('div', { class: 'card' },
      d.report.outcome === 'waived'
        ? el('p', { text: `Waived by ${d.report.submitted_by?.name ?? 'an administrator'}: ${d.report.note}` })
        : el('p', { text: `${d.report.reported_count} reported by ${d.report.submitted_by?.name ?? 'the leader'}, ${formatDateTime(d.report.filed_at)}.` }),
      Object.keys(d.report.answers || {}).length
        ? el('dl', { class: 'answers' }, Object.entries(d.report.answers).flatMap(([k, v]) => [
          el('dt', { text: d.survey.leader.find((q) => q.id === k)?.prompt ?? k }), el('dd', { text: formatAnswer(v) })]))
        : null)));
  }

  if (own && ['open', 'upcoming', 'overdue'].includes(d.status)) page.append(checkinBlock(session, e, d, refresh));
  if (canFile) page.append(fileBlock(session, e, d, refresh));
  if (!d.report && ['open', 'overdue'].includes(d.status) && e.category !== undefined && session.isInstitution) {
    page.append(waiveBlock(session, e, refresh));
  }
  if (own && d.status === 'upcoming') {
    const cancel = el('button', { class: 'btn ghost', text: 'Cancel this event', onClick: async () => {
      cancel.disabled = true;
      try { await session.backend.cancelEvent(session.orgId, e.id); refresh(); } catch (error) { cancel.after(el('p', { class: 'small bad-text', text: error.message })); cancel.disabled = false; }
    } });
    page.append(section(null, null, cancel));
  }

  page.append(section('Who checked in', 'Students check themselves in with the code shown in the room, answering the short survey.',
    table([
      { label: 'Student', value: (c) => c.user?.name ?? '—' },
      { label: 'When', value: (c) => formatDateTime(c.at) },
      { label: 'Answers', value: (c) => Object.entries(c.answers || {}).map(([k, v]) => `${d.survey.student.find((q) => q.id === k)?.prompt ?? k}: ${formatAnswer(v)}`).join(' · ') || '—' },
    ], d.checkins, { empty: 'Nobody has checked in.' })));

  mount(root, page);
}

function formatAnswer(v) {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return String(v);
}

function checkinBlock(session, e, d, refresh) {
  const box = el('div', { class: 'card' });
  if (d.checkin.open && d.checkin.code) {
    box.append(el('p', { class: 'small muted', text: 'Show this in the room. Students enter it in the app to check in.' }),
      el('div', { class: 'big-code', 'aria-label': `Check-in code ${d.checkin.code.split('').join(' ')}`, text: d.checkin.code }),
      el('p', { class: 'small muted', text: `Open until ${formatDateTime(d.checkin.closes_at)}.` }));
  } else {
    const btn = el('button', { class: 'btn ghost', text: 'Open check-in', onClick: async () => {
      btn.disabled = true;
      try { await session.backend.openCheckin(session.orgId, e.id); refresh(); } catch (error) { btn.after(el('p', { class: 'small bad-text', text: error.message })); btn.disabled = false; }
    } });
    box.append(el('p', { class: 'small muted', text: 'Check-in opens 30 minutes before the start.' }), btn);
  }
  return section('Check-in code', null, box);
}

function questionInput(q) {
  switch (q.kind) {
    case 'rating': return el('select', { 'data-q': q.id }, el('option', { value: '', text: '—' }), [1, 2, 3, 4, 5].map((n) => el('option', { value: n, text: String(n) })));
    case 'yes_no': return el('select', { 'data-q': q.id }, el('option', { value: '', text: '—' }), el('option', { value: 'true', text: 'Yes' }), el('option', { value: 'false', text: 'No' }));
    case 'choice': return el('select', { 'data-q': q.id }, el('option', { value: '', text: '—' }), (q.options || []).map((o) => el('option', { value: o, text: o })));
    default: return el('input', { 'data-q': q.id, maxlength: 280 });
  }
}

function readAnswers(form, questions) {
  const out = {};
  for (const q of questions) {
    const input = form.querySelector(`[data-q="${q.id}"]`);
    if (!input || input.value === '') continue;
    out[q.id] = q.kind === 'rating' ? Number(input.value) : q.kind === 'yes_no' ? input.value === 'true' : input.value;
  }
  return out;
}

function fileBlock(session, e, d, refresh) {
  const status = el('div');
  const needsPhoto = e.attendance.methods.includes('photo');
  const count = el('input', { type: 'number', min: 0, max: 2000, required: true, 'aria-label': 'How many people attended' });
  const questions = d.survey.leader;
  const form = el('form', { class: 'card' });

  const photoFile = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Room photo' });
  const photoBtn = el('button', { class: 'btn ghost', type: 'button', text: 'Check the photo', onClick: async () => {
    if (!photoFile.files[0] || !count.value) {
      mount(status, notice('bad', 'Choose a photo and enter the count first', null));
      return;
    }
    photoBtn.disabled = true;
    photoBtn.textContent = 'Counting…';
    try {
      const result = await session.backend.uploadAttendancePhoto(session.orgId, e.id, photoFile.files[0], Number(count.value));
      mount(status, notice(result.check.verdict === 'discrepancy' ? 'warn' : 'ok', 'Photo checked',
        `${provenanceNote(result.check)} Verdict: ${result.check.verdict}.`));
      setTimeout(refresh, 1200);
    } catch (error) {
      mount(status, notice('bad', 'Photo not checked', error.message));
    } finally { photoBtn.disabled = false; photoBtn.textContent = 'Check the photo'; }
  } });

  form.append(
    el('label', { class: 'field' }, el('span', { text: 'How many people were there?' }), count),
    needsPhoto ? el('div', { class: 'field' }, el('span', { text: `Room photo${d.photo_checks.length ? ` (${d.photo_checks.length} checked so far, up to 3)` : ' — required'}` }),
      el('div', { class: 'row' }, photoFile, photoBtn)) : null,
    ...questions.map((q) => el('label', { class: 'field' }, el('span', { text: `${q.prompt}${q.required ? ' *' : ''}` }), questionInput(q))),
    status,
    el('button', { class: 'btn', type: 'submit', text: 'File attendance' }));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    mount(status);
    try {
      await session.backend.fileAttendance(session.orgId, e.id, { reported_count: Number(count.value), answers: readAnswers(form, questions) });
      refresh();
    } catch (error) {
      mount(status, notice('bad', 'Not filed', error.message));
    }
  });
  return section('File attendance', needsPhoto ? 'This event needs a room photo before it can be filed.' : null, form);
}

function waiveBlock(session, e, refresh) {
  const note = el('input', { maxlength: 500, placeholder: 'Why — e.g. the building closed for weather', 'aria-label': 'Reason for waiving' });
  const btn = el('button', { class: 'btn ghost', text: 'Waive attendance', onClick: async () => {
    btn.disabled = true;
    try { await session.backend.waiveAttendance(session.orgId, e.id, note.value.trim()); refresh(); } catch (error) { btn.after(el('p', { class: 'small bad-text', text: error.message })); btn.disabled = false; }
  } });
  return section('Waive', 'Excuse this event from filing. It releases the club\'s scheduling lock like a filing would, and is recorded with your name and reason.',
    el('div', { class: 'card' }, el('div', { class: 'row' }, note, btn)));
}
