import { el, mount } from '../ui/dom.js';
import { spinner, errorState, section, metric, pill } from '../ui/components.js';
import { table, formatDateTime } from '../ui/school.js';

/**
 * Students — per-student attendance across every required club and campus event they were
 * expected at, lowest rate first: who is drifting away is the question a dean actually asks.
 *
 * Individual attendance is an education record (FERPA): this page is for the school's own
 * administrators, and nothing on it is exported — the CSV on the Attendance page is event-level only.
 */
export async function renderMembers(root, { session, navigate, params }) {
  if (params.student) return renderStudent(root, { session, navigate, params });
  mount(root, spinner('Loading students'));
  let data; let roster;
  try {
    [data, roster] = await Promise.all([
      session.backend.studentAttendance(session.orgId),
      session.backend.listMembers(session.orgId),
    ]);
  } catch (error) {
    mount(root, errorState(error, { onRetry: () => renderMembers(root, { session, navigate, params }) }));
    return;
  }
  const withEvents = data.students.filter((s) => s.expected > 0);
  const low = withEvents.filter((s) => s.rate != null && s.rate < 50);
  const inClubs = roster.filter((m) => m.clubs > 0).length;

  mount(root, el('div', {},
    el('h1', { text: 'Students' }),
    el('p', { class: 'lede', text: 'Attendance per student, across every required club and campus event they were expected at.' }),
    section(null, null, el('div', { class: 'grid grid-4' },
      metric({ label: 'Students', value: roster.filter((m) => m.role === 'member').length }),
      metric({ label: 'In at least one club', value: inClubs }),
      metric({ label: 'Expected at an event', value: withEvents.length, caption: 'in the last 90 days' }),
      metric({ label: 'Under 50% attendance', value: low.length, caption: 'of events they were expected at' }))),
    section('Attendance by student', 'Lowest first. Select a student for their events.', table([
      { label: 'Student', value: (s) => el('strong', { text: s.user.name }) },
      { label: 'Clubs', value: (s) => s.clubs, numeric: true },
      { label: 'Club events', value: (s) => `${s.club.attended} of ${s.club.expected}`, numeric: true },
      { label: 'Campus events', value: (s) => `${s.campus.attended} of ${s.campus.expected}`, numeric: true },
      { label: 'Rate', value: (s) => (s.rate == null ? pill('No events yet') : pill(`${s.rate}%`, s.rate < 50 ? 'warn' : 'ok')) },
    ], data.students, { onRowClick: (s) => navigate('members', { student: s.user.id }) })),
    section('Roster', null, table([
      { label: 'Name', value: (m) => m.user.name },
      { label: 'Email', value: (m) => el('span', { class: 'mono small', text: m.email }) },
      { label: 'Role', value: (m) => (m.role === 'member' ? 'Student' : 'Administrator') },
      { label: 'Clubs', value: (m) => m.clubs ?? '—', numeric: true },
    ], roster)),
    el('p', { class: 'small muted', text: 'Every person here is fabricated — addresses are on demo.invalid, which cannot receive mail.' })));
}

async function renderStudent(root, { session, navigate, params }) {
  mount(root, spinner());
  let d;
  try {
    d = await session.backend.studentDetail(session.orgId, params.student);
  } catch (error) {
    mount(root, errorState(error, { onRetry: () => renderStudent(root, { session, navigate, params }) }));
    return;
  }
  const attended = d.events.filter((e) => e.attended).length;
  mount(root, el('div', {},
    el('button', { class: 'btn link', text: '← All students', onClick: () => navigate('members') }),
    el('h1', { text: d.user.name }),
    el('p', { class: 'lede', text: `Checked in at ${attended} of ${d.events.length} required events they were expected at.` }),
    table([
      { label: 'Event', value: (e) => el('div', {}, el('strong', { text: e.title }), el('div', { class: 'small muted', text: e.org_name })) },
      { label: 'Type', value: (e) => (e.category === 'club' ? 'Club' : 'Campus') },
      { label: 'When', value: (e) => formatDateTime(e.starts_at) },
      { label: 'Attended', value: (e) => (e.attended ? pill('✓ Checked in', 'ok') : pill('Not checked in')) },
    ], d.events, { empty: 'No required events yet.', onRowClick: (e) => navigate('attendance', { tab: 'compliance', event: e.id }) })));
}
