import { el, mount, download } from '../ui/dom.js';
import { spinner, errorState, section, metric, notice, pill } from '../ui/components.js';
import {
  table, complianceBadge, attendancePill, verdictPill, provenanceNote, weeklyChart, threeNumbersChart,
  surveyEditor, formatDateTime, relative, methodsLabel,
} from '../ui/school.js';
import { renderEventDetail } from './events.js';

/**
 * Attendance — the reason a school buys this.
 *
 * Four views, as tabs:
 *   Compliance      who owes what right now: locked clubs, overdue and open events, flagged photos
 *   Club analytics  how the school's clubs are doing, from their required events
 *   Campus events   the same, for events the school ran itself — never mixed with clubs
 *   Policy          the rules: whether attendance is mandatory, which methods, how long to file
 *
 * Every number on these screens is the SERVER's. Nothing here computes a rate or a verdict.
 */
export async function renderAttendance(root, { session, navigate, params }) {
  if (params.event) {
    return renderEventDetail(root, { session, navigate, params, back: () => navigate('attendance', { tab: params.tab }) });
  }
  const tab = ['compliance', 'club', 'campus', 'policy'].includes(params.tab) ? params.tab : 'compliance';
  const tabs = el('div', { class: 'tabs', role: 'tablist' },
    [['compliance', 'Compliance'], ['club', 'Club analytics'], ['campus', 'Campus events'], ['policy', 'Policy']].map(([key, label]) =>
      el('button', { 'aria-pressed': String(key === tab), text: label, onClick: () => navigate('attendance', { tab: key }) })));
  const body = el('div', {}, spinner());
  mount(root, el('div', {},
    el('h1', { text: 'Attendance' }),
    el('p', { class: 'lede', text: 'Mandatory attendance for every club event, verified by a room photo, a survey, or both — and who is keeping up.' }),
    tabs, body));

  try {
    if (tab === 'compliance') await compliance(body, session, navigate);
    else if (tab === 'policy') await policy(body, session);
    else await analytics(body, session, navigate, tab);
  } catch (error) {
    mount(body, errorState(error, { onRetry: () => renderAttendance(root, { session, navigate, params }) }));
  }
}

async function compliance(body, session, navigate) {
  const data = await session.backend.attendanceCompliance(session.orgId);
  const open = (id) => navigate('attendance', { tab: 'compliance', event: id });
  const s = data.summary;

  const clubs = table([
    { label: 'Club', value: (c) => el('strong', { text: c.name }) },
    { label: 'Leader', value: (c) => c.leader },
    { label: 'State', value: (c) => complianceBadge(c.state) },
    { label: 'Owes', value: (c) => owes(c, open) },
    { label: 'Flagged photos', value: (c) => (c.discrepancies ? pill(`⚠ ${c.discrepancies}`, 'warn') : '—'), numeric: true },
  ], data.clubs, { empty: 'No active clubs yet.' });

  const flagged = data.flagged.length
    ? data.flagged.map((f) => el('button', { class: 'list-item', onClick: () => open(f.event_id) },
      el('div', {},
        el('div', { class: 'title', text: `${f.org_name} — ${f.title}` }),
        el('div', { class: 'meta' },
          el('span', { text: `Leader reported ${f.claimed_count}` }),
          el('span', { text: `photo estimate ~${f.ai_count} (${f.ai_range[0]}–${f.ai_range[1]})` }),
          el('span', { text: formatDateTime(f.starts_at) }))),
      verdictPill({ ...f, verdict: 'discrepancy', ai_count: f.ai_count })))
    : [el('p', { class: 'muted small', text: 'No headcount disagreements on record.' })];

  mount(body,
    section(null, null, el('div', { class: 'grid grid-4' },
      metric({ label: 'Clubs locked', value: s.locked, caption: 'Cannot schedule until they file' }),
      metric({ label: 'Overdue events', value: s.overdue_events, caption: 'Past their filing deadline' }),
      metric({ label: 'Open to file', value: s.open_events, caption: 'Ended or running, not filed yet' }),
      metric({ label: 'Flagged photos', value: s.flagged, caption: 'Reported count and photo disagree' }))),
    s.locked ? notice('warn', `${s.locked} club${s.locked === 1 ? ' is' : 's are'} locked`,
      'A club with overdue attendance cannot schedule new events until its leader files — or you waive it with a reason, which is recorded.') : null,
    section('Clubs', 'Right now. An overdue event from last month is exactly as overdue as one from yesterday.', clubs),
    section('Flagged for review', 'The leader\'s number and the room-photo estimate disagree beyond the tolerance. A flag is a reason to look, not a finding — counting a crowded room from one photo is approximate.', ...flagged),
    data.campus.length
      ? section('Campus events owed', 'Your own events that still need filing.', table([
        { label: 'Event', value: (e) => e.title },
        { label: 'Ended', value: (e) => formatDateTime(e.ends_at) },
        { label: 'Due', value: (e) => `${formatDateTime(e.attendance_due_at)} (${relative(e.attendance_due_at)})` },
        { label: 'State', value: (e) => attendancePill(e.status) },
      ], data.campus, { onRowClick: (e) => open(e.id) }))
      : null);
}

function owes(club, open) {
  const items = [...club.overdue.map((e) => ({ ...e, overdue: true })), ...club.open];
  if (!items.length) return el('span', { class: 'muted', text: 'Nothing' });
  return el('div', { class: 'owes' }, items.map((e) => el('button', {
    class: 'btn link', onClick: () => open(e.id),
    text: `${e.overdue ? '⚠ ' : ''}${e.title} — due ${relative(e.attendance_due_at)}`,
  })));
}

async function analytics(body, session, navigate, category) {
  const data = await session.backend.attendanceAnalytics(session.orgId, category);
  const k = data.kpis;
  const open = (id) => navigate('attendance', { tab: category, event: id });

  const exportBtn = el('button', { class: 'btn ghost', text: 'Export CSV', onClick: async () => {
    exportBtn.disabled = true;
    try {
      const { blob, filename } = await session.backend.exportAttendanceCSV(session.orgId, category);
      download(blob, filename);
    } catch (error) {
      exportBtn.after(el('p', { class: 'small bad-text', text: error.message }));
    } finally { exportBtn.disabled = false; }
  } });

  const events = table([
    { label: 'Event', value: (r) => el('div', {}, el('strong', { text: r.title }), el('div', { class: 'small muted', text: r.org_name })) },
    { label: 'When', value: (r) => formatDateTime(r.starts_at) },
    { label: 'Attendance', value: (r) => attendancePill(r.status) },
    { label: 'Reported', value: (r) => r.reported_count ?? '—', numeric: true },
    { label: 'Photo', value: (r) => (r.verdict ? verdictPill({ verdict: r.verdict, ai_provider: r.ai_provider, ai_count: r.ai_count }) : '—') },
    { label: 'Checked in', value: (r) => `${r.checkins} of ${r.expected}`, numeric: true },
    { label: 'RSVPs', value: (r) => r.rsvps, numeric: true },
  ], data.events, { onRowClick: (r) => open(r.id), empty: 'No events in this window.' });

  const clubTable = data.clubs ? section('By club', 'Filing rate counts required events whose deadline has come: filed or waived, over those plus the overdue.', table([
    { label: 'Club', value: (c) => el('strong', { text: c.name }) },
    { label: 'Members', value: (c) => c.members, numeric: true },
    { label: 'Events', value: (c) => c.events, numeric: true },
    { label: 'Filing rate', value: (c) => (c.filing_rate == null ? '—' : `${c.filing_rate}%`), numeric: true },
    { label: 'Avg reported', value: (c) => c.avg_reported ?? '—', numeric: true },
    { label: 'Avg checked in', value: (c) => c.avg_checkins ?? '—', numeric: true },
    { label: 'Check-in rate', value: (c) => (c.checkin_rate == null ? '—' : `${c.checkin_rate}%`), numeric: true },
    { label: 'Flags', value: (c) => (c.discrepancies ? pill(`⚠ ${c.discrepancies}`, 'warn') : '—') },
  ], data.clubs)) : null;

  mount(body,
    section(null, null, el('div', { class: 'grid grid-4' },
      metric({ label: 'Filing rate', value: k.filing_rate == null ? null : `${k.filing_rate}%`, caption: `${k.filed} filed · ${k.overdue} overdue` }),
      metric({ label: 'Median time to file', value: k.median_hours_to_file == null ? null : `${k.median_hours_to_file} h`, caption: 'After the event ended' }),
      metric({ label: 'Students reached', value: k.unique_students, caption: `${k.checkins_total} check-ins in total` }),
      metric({ label: 'Flagged photos', value: k.discrepancies, caption: `of ${k.photo_checks} photo checks` }))),
    section(category === 'club' ? 'Three numbers, per event' : 'Per event',
      'What the leader reported, what the room photo suggests, and how many students checked themselves in. Where they disagree is where to look.',
      threeNumbersChart(data.events)),
    section('Check-ins over time', null, weeklyChart(data.weekly)),
    clubTable,
    section('Events', 'Select one for its full record.', events, el('div', { class: 'row' }, exportBtn)),
    el('p', { class: 'small muted', text: 'Club events and campus events are reported separately and never mixed. Seeded demo figures are fabricated; seeded photo checks had no photo behind them.' }));
}

async function policy(body, session) {
  const [p, clubSurvey, campusSurvey] = await Promise.all([
    session.backend.getPolicy(session.orgId),
    session.backend.getSurvey(session.orgId, 'club'),
    session.backend.getSurvey(session.orgId, 'campus'),
  ]);
  const status = el('div');

  const sideEditor = (side, title, subtitle) => {
    const required = el('input', { type: 'checkbox', checked: p[side].attendance_required });
    const photo = el('input', { type: 'checkbox', checked: p[side].methods.includes('photo') });
    const survey = el('input', { type: 'checkbox', checked: p[side].methods.includes('survey') });
    const read = () => ({
      attendance_required: required.checked,
      methods: [photo.checked && 'photo', survey.checked && 'survey'].filter(Boolean),
    });
    return {
      read,
      node: el('div', { class: 'card' },
        el('h3', { text: title }), el('p', { class: 'small muted', text: subtitle }),
        el('label', { class: 'check' }, required, el('strong', { text: 'Attendance is mandatory' })),
        el('div', { class: 'methods' },
          el('label', { class: 'check' }, photo, el('span', {}, el('strong', { text: 'Room photo' }),
            el('span', { class: 'small muted', text: ' — the leader photographs the room and states a count; an AI estimate is compared against it. The photo is never stored.' }))),
          el('label', { class: 'check' }, survey, el('span', {}, el('strong', { text: 'Survey + check-in' }),
            el('span', { class: 'small muted', text: ' — the leader answers a short survey; students check in with a code shown in the room.' })))),
      ),
    };
  };

  const club = sideEditor('club', 'Club events', 'Applies to every event every club schedules. A club leader cannot opt out.');
  const campus = sideEditor('campus', 'Campus events', 'The default for events your staff schedule. You can change it per event.');
  const due = el('input', { type: 'number', min: 1, max: 168, value: p.due_hours, 'aria-label': 'Hours to file after an event ends' });
  const tol = el('input', { type: 'number', min: 5, max: 50, value: p.photo_tolerance_pct, 'aria-label': 'Photo tolerance percent' });
  const lock = el('input', { type: 'checkbox', checked: p.lock_when_overdue });

  const save = el('button', { class: 'btn', text: 'Save policy', onClick: async () => {
    save.disabled = true;
    mount(status);
    try {
      await session.backend.updatePolicy(session.orgId, {
        club: club.read(), campus: campus.read(),
        due_hours: Number(due.value), photo_tolerance_pct: Number(tol.value), lock_when_overdue: lock.checked,
      });
      mount(status, notice('ok', 'Policy saved', 'It applies to events scheduled from now on. Events already on the calendar keep the terms they were scheduled under.'));
    } catch (error) {
      mount(status, notice('bad', 'Not saved', error.message));
    } finally { save.disabled = false; }
  } });

  mount(body,
    p.is_default ? notice('info', 'Running on defaults', 'Nobody has saved a policy for this school yet. These are the built-in defaults.') : null,
    el('div', { class: 'grid grid-2' }, club.node, campus.node),
    section('Deadlines and enforcement', null, el('div', { class: 'card' },
      el('label', { class: 'field' }, el('span', { text: 'Hours to file after an event ends' }), due),
      el('label', { class: 'field' }, el('span', { text: 'Photo tolerance (%) — how far the reported count may be from the estimate before it is flagged. Never less than 3 people.' }), tol),
      el('label', { class: 'check' }, lock, el('span', {}, el('strong', { text: 'Lock scheduling when attendance is overdue' }),
        el('span', { class: 'small muted', text: ' — a club that misses a deadline cannot schedule anything new until it files.' }))))),
    el('div', { class: 'row' }, save), status,
    section('Default surveys', `Club leaders can edit their own club's survey in the app; these are what every club starts from. ${methodsLabel(['survey'])} uses them.`,
      el('h3', { text: 'Club events' }),
      surveyEditor(clubSurvey.questions, { onSave: (q) => session.backend.updateSurvey(session.orgId, 'club', q) }),
      el('h3', { text: 'Campus events', style: { marginTop: '18px' } }),
      surveyEditor(campusSurvey.questions, { onSave: (q) => session.backend.updateSurvey(session.orgId, 'campus', q) })));
}

export { provenanceNote };
