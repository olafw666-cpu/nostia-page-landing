import { ApiError } from './errors.js';

/**
 * The school layer of MockBackend: Demo University's clubs, events, attendance, moderation and
 * outbox, in memory, answering in the SAME shapes the server returns.
 *
 * Names, numbers and the story are copied from nostia-pivot/demo/fixture.json (the `school`
 * block) — the single definition of demo content. If one changes, change the other: the console on
 * ?backend=mock and the seeded demo server must tell the same story, or a screenshot of one
 * contradicts the other. Times are hours relative to page load, exactly as the seed uses them.
 *
 * Everything here is fabricated. Seeded photo checks carry ai_provider 'fixture' — no photo
 * existed — and the console labels them so, here as on the server.
 */

const H = 3600 * 1000;
const at = (hours) => new Date(Date.now() + hours * H).toISOString();

const PEOPLE = {
  101: 'Dana Whitfield', 102: 'Maya Okafor', 103: 'Theo Lindqvist', 104: 'Jonas Reyes', 105: 'Priya Raman',
  106: 'Leo Brandt', 107: 'Nina Castillo', 108: 'Sam Adeyemi', 109: 'Ava Moreau', 110: 'Ben Kowalski',
  111: 'Caleb Nguyen', 112: 'Chloe Park', 113: 'Diego Alvarez', 114: 'Elena Petrova', 115: 'Ethan Brooks',
  116: 'Fatima Hassan', 117: "Grace O'Neill", 118: 'Hannah Weiss', 119: 'Isaac Mensah', 120: 'Jada Thompson',
  121: 'Kai Nakamura', 122: 'Lena Fischer', 123: 'Liam Doyle', 124: 'Mateo Silva', 125: 'Mia Johansson',
  126: 'Noah Bennett', 127: 'Olivia Chen', 128: 'Omar Farouk', 129: 'Quinn Harper', 130: 'Rosa Delgado',
  131: 'Tara Singh', 132: 'Uma Patel', 133: 'Victor Hale', 134: 'Wen Li', 135: 'Zoe Martin',
};
const user = (id) => ({ id, name: PEOPLE[id], username: `demo-user-${PEOPLE[id].split(' ')[0].toLowerCase().replace(/'/g, '')}` });

const SCHOOL_ID = 1;

export class MockSchool {
  constructor() {
    this.policy = {
      institution_org_id: SCHOOL_ID,
      club_creation_policy: 'request',
      club: { attendance_required: true, methods: ['photo', 'survey'] },
      campus: { attendance_required: true, methods: ['survey'] },
      due_hours: 24, photo_tolerance_pct: 20, lock_when_overdue: true,
      updated_at: at(-200), is_default: false,
    };

    // Club org ids 11–15. Members listed by user id; the leader is the club owner.
    this.clubs = [
      { id: 11, name: 'Demo University Hiking Club', category: 'outdoors', join_policy: 'open', status: 'active',
        description: 'Weekend trail days, trail maintenance and a Saturday walk every month.',
        leader: 102, officers: [108], members: [104, 109, 110, 112, 113, 114, 117, 118, 119, 121, 122, 125, 126, 127, 129, 130, 135] },
      { id: 12, name: 'Demo University Robotics Society', category: 'technology', join_policy: 'approval', status: 'active',
        description: 'Builds a competition robot each year and runs open build nights.',
        leader: 106, officers: [104], members: [111, 115, 116, 123, 124, 128, 131, 132, 133, 134, 110, 121] },
      { id: 13, name: 'Demo University Chess Club', category: 'general', join_policy: 'open', status: 'active',
        description: 'Weekly casual games and a monthly blitz tournament.',
        leader: 103, officers: [], members: [119, 120, 123, 126, 128, 134, 135] },
      { id: 14, name: 'Demo University Film Society', category: 'arts', join_policy: 'open', status: 'pending',
        description: 'Screenings of student films and a spring festival.', leader: 105, officers: [], members: [], requested_by: 105 },
      { id: 15, name: 'Demo University Improv Troupe', category: 'arts', join_policy: 'open', status: 'rejected',
        description: 'Short-form improv, rehearsing twice a week.', leader: 107, officers: [], members: [], requested_by: 107,
        decision_note: 'Please book a faculty advisor and a rehearsal room first, then re-apply.' },
    ];

    const clubEvent = (id, club, title, location, startH, endH, extra = {}) => ({
      id, org_id: club, category: 'club', title, description: '', location, starts_at: at(startH), ends_at: at(endH),
      status: 'scheduled', attendance_required: true, methods: ['photo', 'survey'], due_at: at(endH + 24),
      audience_all: false, audience: [], checkin_code: null, report: null, photo_checks: [], checkins: [], rsvps: [], ...extra,
    });
    const check = (claimed, count, low, high, confidence, verdict, hoursAgo) => ({
      claimed_count: claimed, ai_provider: 'fixture', ai_model: null, ai_count: count, ai_count_low: low, ai_count_high: high,
      ai_confidence: confidence, verdict, reason: 'Seeded sample — no photo was analysed', created_at: at(hoursAgo),
    });
    const report = (count, filedAt, summary) => ({ outcome: 'filed', reported_count: count, answers: { summary }, note: null,
      submitted_by: null, filed_at: filedAt });
    const firstN = (club, n) => [...club.officers, ...club.members].slice(0, n);

    const [hiking, robotics, chess] = this.clubs;
    this.events = [
      clubEvent(1, 13, 'Weekly chess', 'Library Commons', -200, -198, {
        photo_checks: [check(7, 7, 6, 8, 'high', 'consistent', -199.5)], report: report(7, at(-194), 'Casual games; two new players.'),
        checkins: firstN(chess, 6) }),
      clubEvent(2, 11, 'Trail maintenance day', 'Mesa trailhead', -170, -166, {
        photo_checks: [check(18, 17, 15, 20, 'high', 'consistent', -169.5)], report: report(18, at(-163), 'Cleared four drainage channels and re-marked the lower loop.'),
        checkins: firstN(hiking, 15) }),
      clubEvent(3, 12, 'Build night', 'Engineering Lab B', -122, -119, {
        photo_checks: [check(30, 12, 10, 14, 'medium', 'discrepancy', -121.5)], report: report(30, at(-114), 'Assembled the drive train.'),
        checkins: firstN(robotics, 9) }),
      { ...clubEvent(4, SCHOOL_ID, 'Fall Involvement Fair', 'Main Quad', -100, -96, {
        category: 'campus', methods: ['survey'], audience_all: true,
        report: report(140, at(-76), 'Estimated from the table sign-up sheets.'),
        checkins: Object.keys(PEOPLE).map(Number).filter((id) => id > 103).slice(0, 24) }) },
      clubEvent(5, 12, 'Competition prep', 'Engineering Lab B', -48, -46, {
        photo_checks: [check(11, 12, 10, 13, 'high', 'consistent', -47.5)], report: report(11, at(-44), 'Tuned the autonomous routine.'),
        checkins: firstN(robotics, 10) }),
      clubEvent(6, 13, 'Blitz tournament', 'Library Commons', -32, -30),
      clubEvent(7, 11, 'Weekly meeting', 'Student Union 204', -3.5, -2, { checkin_code: 'KMMECP', checkins: firstN(hiking, 6) }),
      { ...clubEvent(8, SCHOOL_ID, 'Wellness Week Kickoff', 'Recreation Center', 26, 28, {
        category: 'campus', methods: ['survey'], audience: [11, 12], rsvps: firstN(hiking, 9) }) },
      clubEvent(9, 11, 'Saturday walk: Mesa warm-up', 'Mesa trailhead', 50, 53, { rsvps: firstN(hiking, 7), adventure: { id: 4, title: 'Mesa Warm-up' } }),
      clubEvent(10, 12, 'Sensor workshop', 'Engineering Lab B', 74, 76, { rsvps: firstN(robotics, 5) }),
    ];

    this.surveys = {
      club: [
        { id: 'summary', prompt: 'What did the group do?', kind: 'short_text', audience: 'leader', required: true },
        { id: 'rating', prompt: 'How did it go?', kind: 'rating', audience: 'both', required: false },
        { id: 'first_time', prompt: 'Was this your first time?', kind: 'yes_no', audience: 'student', required: false },
        { id: 'concerns', prompt: 'Anything the school should know about?', kind: 'short_text', audience: 'leader', required: false },
      ],
      campus: [
        { id: 'rating', prompt: 'How useful was this event?', kind: 'rating', audience: 'both', required: false },
        { id: 'heard_from', prompt: 'How did you hear about it?', kind: 'choice', options: ['A club', 'Email', 'Posters', 'A friend'], audience: 'student', required: false },
        { id: 'summary', prompt: 'Summary for the record', kind: 'short_text', audience: 'leader', required: true },
      ],
    };

    this.moderation = [
      { id: 501, club: { id: 12, name: 'Demo University Robotics Society' }, author: user(133), mine: false,
        body: 'whoever keeps taking my soldering iron I will find you', created_at: at(-12), hidden: false, reports: 1,
        report_reasons: ['Not okay for the group chat'] },
      { id: 502, club: { id: 11, name: 'Demo University Hiking Club' }, author: user(113), mine: false,
        body: 'this club is a waste of time lol', created_at: at(-4), hidden: true, hide_reason: 'Off-topic and unkind', reports: 0,
        report_reasons: ['Not okay for the group chat'] },
    ];

    this.outbox = [
      { id: 3, subject: 'Reminder: file attendance within 24 hours', audience: { kind: 'club_leaders' }, sender: user(101),
        body: 'Club leaders: attendance for every club event is due within 24 hours of the end. Overdue attendance pauses scheduling until it is filed. Reply in the app if you need a waiver.',
        recipient_ids: [102, 106, 103], created_at: at(-20) },
    ];
    this.nextId = 1000;
  }

  // ---- helpers ---------------------------------------------------------------

  club(id) { return this.clubs.find((c) => c.id === Number(id)); }
  event(id) { return this.events.find((e) => e.id === Number(id)); }
  people(club) { return [club.leader, ...club.officers, ...club.members]; }

  status(e, now = new Date().toISOString()) {
    if (e.status === 'cancelled') return 'cancelled';
    if (e.report) return e.report.outcome === 'waived' ? 'waived' : 'filed';
    if (!e.attendance_required) return 'not_required';
    if (now < e.starts_at) return 'upcoming';
    if (now > e.due_at) return 'overdue';
    return 'open';
  }

  expected(e) {
    if (e.category === 'club') return this.people(this.club(e.org_id));
    if (e.audience_all) return Object.keys(PEOPLE).map(Number).filter((id) => id !== 101);
    return [...new Set(e.audience.flatMap((id) => this.people(this.club(id))))];
  }

  describe(e) {
    const host = e.org_id === SCHOOL_ID ? 'Demo University Student Affairs' : this.club(e.org_id)?.name;
    return {
      id: e.id, org_id: e.org_id, org_name: host, institution_org_id: SCHOOL_ID, category: e.category,
      title: e.title, description: e.description, location: e.location, starts_at: e.starts_at, ends_at: e.ends_at,
      status: e.status, adventure: e.adventure ?? null,
      attendance: { required: e.attendance_required, methods: e.methods, due_at: e.due_at, status: this.status(e),
        reported_count: e.report?.reported_count ?? null, checkin_open: !!e.checkin_code && this.status(e) === 'open' },
      audience: e.category === 'campus' ? { all: e.audience_all, club_ids: e.audience } : null,
      rsvp_going: e.rsvps.length, checkins: e.checkins.length,
    };
  }

  overdueFor(clubId) {
    return this.events.filter((e) => e.org_id === clubId && e.category === 'club' && this.status(e) === 'overdue')
      .map((e) => ({ id: e.id, title: e.title, ends_at: e.ends_at, attendance_due_at: e.due_at }));
  }

  describeClub(c) {
    return {
      id: c.id, institution_org_id: SCHOOL_ID, name: c.name, description: c.description, category: c.category,
      join_policy: c.join_policy, status: c.status, leader: user(c.leader), member_count: this.people(c).length,
      my_role: null, my_join_request: null, decision_note: c.decision_note ?? null,
      requested_by: c.requested_by ? user(c.requested_by) : null, decided_at: c.decided_at ?? null,
      overdue_attendance: this.overdueFor(c.id).length, created_at: at(-400),
    };
  }

  // ---- policy & clubs --------------------------------------------------------

  getPolicy() { return structuredClone(this.policy); }

  updatePolicy(patch) {
    const next = structuredClone(this.policy);
    if (patch.club_creation_policy !== undefined) {
      if (!['admin_only', 'request', 'open'].includes(patch.club_creation_policy)) {
        throw new ApiError('unknown', 'club_creation_policy must be one of: admin_only, request, open', { status: 400 });
      }
      next.club_creation_policy = patch.club_creation_policy;
    }
    for (const side of ['club', 'campus']) {
      if (!patch[side]) continue;
      Object.assign(next[side], patch[side]);
      if (next[side].attendance_required && !next[side].methods.length) {
        throw new ApiError('unknown', `${side}: choose at least one verification method, or make attendance optional`, { status: 400 });
      }
    }
    if (patch.due_hours !== undefined) {
      const v = Number(patch.due_hours);
      if (!Number.isInteger(v) || v < 1 || v > 168) throw new ApiError('unknown', 'due_hours must be an integer from 1 to 168', { status: 400 });
      next.due_hours = v;
    }
    if (patch.photo_tolerance_pct !== undefined) {
      const v = Number(patch.photo_tolerance_pct);
      if (!Number.isInteger(v) || v < 5 || v > 50) throw new ApiError('unknown', 'photo_tolerance_pct must be an integer from 5 to 50', { status: 400 });
      next.photo_tolerance_pct = v;
    }
    if (patch.lock_when_overdue !== undefined) next.lock_when_overdue = !!patch.lock_when_overdue;
    next.updated_at = new Date().toISOString();
    next.is_default = false;
    this.policy = next;
    return structuredClone(next);
  }

  listClubs() {
    return { clubs: this.clubs.map((c) => this.describeClub(c)), policy: this.policy.club_creation_policy };
  }

  createClub(fields) {
    const name = String(fields.name || '').trim();
    if (name.length < 3) throw new ApiError('unknown', 'A club name of at least 3 characters is required', { status: 400 });
    if (this.clubs.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.status !== 'rejected')) {
      throw new ApiError('conflict', 'A club with that name already exists', { status: 409, reason: 'club_name_taken' });
    }
    const club = { id: this.nextId++, name, description: fields.description || '', category: fields.category || 'general',
      join_policy: fields.join_policy || 'open', status: 'active', leader: Number(fields.leader_user_id) || 101,
      officers: [], members: [], decided_at: new Date().toISOString() };
    this.clubs.push(club);
    return this.describeClub(club);
  }

  decideClub(clubId, decision, note) {
    const c = this.club(clubId);
    if (!c) throw new ApiError('not-found', 'Not found', { status: 404 });
    if (c.status !== 'pending') throw new ApiError('conflict', `This club is already ${c.status}`, { status: 409, reason: 'not_pending' });
    if (decision === 'reject' && !note) throw new ApiError('unknown', 'Say why, so the student knows what to change', { status: 400 });
    c.status = decision === 'approve' ? 'active' : 'rejected';
    c.decision_note = note || null;
    c.decided_at = new Date().toISOString();
    return this.describeClub(c);
  }

  setClubStatus(clubId, status, note) {
    const c = this.club(clubId);
    if (!c) throw new ApiError('not-found', 'Not found', { status: 404 });
    if (!['active', 'suspended'].includes(c.status)) {
      throw new ApiError('conflict', `A ${c.status} club cannot be changed here`, { status: 409, reason: 'not_decided' });
    }
    c.status = status;
    if (note) c.decision_note = note;
    return this.describeClub(c);
  }

  listMembers() {
    return Object.keys(PEOPLE).map(Number).map((id) => ({
      user: user(id), email: `${user(id).username}@demo.invalid`, role: id === 101 ? 'admin' : 'member',
      joined_at: at(-2880), clubs: this.clubs.filter((c) => c.status === 'active' && this.people(c).includes(id)).length,
    }));
  }

  // ---- events & attendance ---------------------------------------------------

  listEvents(orgId) {
    return this.events.filter((e) => e.org_id === Number(orgId)).map((e) => this.describe(e)).reverse();
  }

  createEvent(fields) {
    const starts = new Date(fields.starts_at);
    const ends = new Date(fields.ends_at);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime()) || ends <= starts) {
      throw new ApiError('unknown', 'ends_at must be after starts_at', { status: 400 });
    }
    const required = fields.attendance_required ?? this.policy.campus.attendance_required;
    const e = {
      id: this.nextId++, org_id: SCHOOL_ID, category: 'campus', title: fields.title, description: fields.description || '',
      location: fields.location || '', starts_at: starts.toISOString(), ends_at: ends.toISOString(), status: 'scheduled',
      attendance_required: !!required, methods: required ? (fields.attendance_methods || this.policy.campus.methods) : [],
      due_at: new Date(ends.getTime() + this.policy.due_hours * H).toISOString(),
      audience_all: !fields.audience_club_ids?.length, audience: (fields.audience_club_ids || []).map(Number),
      checkin_code: null, report: null, photo_checks: [], checkins: [], rsvps: [],
    };
    this.events.push(e);
    return this.describe(e);
  }

  cancelEvent(eventId) {
    const e = this.event(eventId);
    if (new Date().toISOString() >= e.ends_at) {
      throw new ApiError('conflict', 'An event that has already happened cannot be cancelled', { status: 409, reason: 'already_ended' });
    }
    e.status = 'cancelled';
    return this.describe(e);
  }

  eventAttendance(orgId, eventId) {
    const e = this.event(eventId);
    if (!e) throw new ApiError('not-found', 'Not found', { status: 404 });
    const own = e.org_id === Number(orgId);
    const open = !!e.checkin_code && this.status(e) === 'open';
    return {
      event: this.describe(e), status: this.status(e), expected: this.expected(e).length,
      report: e.report, photo_checks: e.photo_checks,
      checkins: e.checkins.map((id, i) => ({ user: user(id), via: 'code', answers: { rating: 3 + (i % 3) }, at: e.starts_at })),
      rsvps: e.rsvps.map((id) => ({ user: user(id), status: 'going' })),
      checkin: own ? { open, code: open ? e.checkin_code : null, closes_at: e.due_at } : { open },
      survey: {
        leader: this.surveys[e.category].filter((q) => q.audience !== 'student'),
        student: this.surveys[e.category].filter((q) => q.audience !== 'leader'),
      },
    };
  }

  uploadAttendancePhoto(eventId, claimedCount) {
    const e = this.event(eventId);
    const claimed = Number(claimedCount);
    // The mock cannot see a photo, so it says so: a SIMULATED estimate, labelled 'stub' exactly as
    // the server labels its own stub. It never pretends to have analysed anything.
    const count = 8 + (claimed % 7);
    const tolerance = Math.max(3, Math.ceil(claimed * this.policy.photo_tolerance_pct / 100));
    const verdict = Math.abs(claimed - count) <= tolerance ? 'consistent' : 'discrepancy';
    const checkRow = { claimed_count: claimed, ai_provider: 'stub', ai_model: 'stub', ai_count: count, ai_count_low: count - 2,
      ai_count_high: count + 2, ai_confidence: 'medium', verdict, reason: 'Simulated estimate — no model was called', created_at: new Date().toISOString() };
    e.photo_checks.push(checkRow);
    return { check: { ...checkRow, tolerance }, remaining: 3 - e.photo_checks.length };
  }

  fileAttendance(orgId, eventId, fields) {
    const e = this.event(eventId);
    if (e.report) throw new ApiError('conflict', 'Attendance is already filed for this event', { status: 409, reason: 'already_filed' });
    if (e.methods.includes('photo') && !e.photo_checks.length) {
      throw new ApiError('conflict', 'This event requires a room photo before it can be filed', { status: 409, reason: 'photo_required' });
    }
    e.report = { outcome: 'filed', reported_count: Number(fields.reported_count), answers: fields.answers || {}, note: fields.note || null,
      submitted_by: user(101), filed_at: new Date().toISOString() };
    return this.eventAttendance(orgId, eventId);
  }

  openCheckin(eventId) {
    const e = this.event(eventId);
    e.checkin_code = e.checkin_code || 'H7QRMA';
    return { code: e.checkin_code, closes_at: e.due_at, event_id: e.id };
  }

  waiveAttendance(orgId, eventId, note) {
    const e = this.event(eventId);
    if (!note) throw new ApiError('unknown', 'A reason is required to waive attendance', { status: 400 });
    e.report = { outcome: 'waived', reported_count: null, answers: {}, note, submitted_by: user(101), filed_at: new Date().toISOString() };
    return this.eventAttendance(orgId, eventId);
  }

  row(e) {
    const check = e.photo_checks[e.photo_checks.length - 1];
    const expected = this.expected(e).length;
    return {
      id: e.id, org_id: e.org_id, org_name: this.describe(e).org_name, category: e.category, title: e.title,
      starts_at: e.starts_at, ends_at: e.ends_at, required: e.attendance_required, methods: e.methods, status: this.status(e),
      due_at: e.due_at, reported_count: e.report?.outcome === 'filed' ? e.report.reported_count : null,
      ai_count: check?.ai_count ?? null, ai_range: check ? [check.ai_count_low, check.ai_count_high] : null,
      ai_provider: check?.ai_provider ?? null, verdict: check?.verdict ?? null,
      checkins: e.checkins.length, rsvps: e.rsvps.length, expected,
      checkin_rate: expected ? Math.round((e.checkins.length / expected) * 1000) / 10 : null,
      hours_to_file: e.report?.outcome === 'filed' ? Math.round((Date.parse(e.report.filed_at) - Date.parse(e.ends_at)) / H * 10) / 10 : null,
    };
  }

  compliance() {
    const clubs = this.clubs.filter((c) => ['active', 'suspended'].includes(c.status)).map((c) => {
      const overdue = this.overdueFor(c.id);
      const open = this.events.filter((e) => e.org_id === c.id && this.status(e) === 'open')
        .map((e) => ({ id: e.id, title: e.title, ends_at: e.ends_at, attendance_due_at: e.due_at }));
      const locked = this.policy.lock_when_overdue && overdue.length > 0;
      return { id: c.id, name: c.name, club_status: c.status, leader: PEOPLE[c.leader],
        state: overdue.length ? (locked ? 'locked' : 'overdue') : (open.length ? 'open' : 'clear'),
        locked, overdue, open,
        discrepancies: this.events.filter((e) => e.org_id === c.id && e.photo_checks.at(-1)?.verdict === 'discrepancy').length,
        last_filed_at: null };
    });
    const flagged = this.events.filter((e) => e.photo_checks.at(-1)?.verdict === 'discrepancy').map((e) => {
      const p = e.photo_checks.at(-1);
      return { event_id: e.id, title: e.title, org_id: e.org_id, org_name: this.describe(e).org_name, starts_at: e.starts_at,
        claimed_count: p.claimed_count, ai_count: p.ai_count, ai_range: [p.ai_count_low, p.ai_count_high],
        ai_provider: p.ai_provider, reason: p.reason, checked_at: p.created_at };
    });
    const campus = this.events.filter((e) => e.category === 'campus' && e.attendance_required && ['open', 'overdue'].includes(this.status(e)))
      .map((e) => ({ id: e.id, title: e.title, ends_at: e.ends_at, attendance_due_at: e.due_at, status: this.status(e) }));
    return {
      summary: { clubs: clubs.length, locked: clubs.filter((c) => c.locked).length,
        overdue_events: clubs.reduce((s, c) => s + c.overdue.length, 0), open_events: clubs.reduce((s, c) => s + c.open.length, 0),
        flagged: flagged.length, campus_owed: campus.length },
      clubs, campus, flagged,
    };
  }

  analytics(category) {
    if (!['club', 'campus'].includes(category)) throw new ApiError('unknown', 'category must be club or campus', { status: 400 });
    const now = new Date().toISOString();
    const rows = this.events.filter((e) => e.category === category && e.status === 'scheduled' && e.starts_at <= now)
      .map((e) => this.row(e)).reverse();
    const required = rows.filter((r) => r.required);
    const done = required.filter((r) => ['filed', 'waived'].includes(r.status));
    const overdue = required.filter((r) => r.status === 'overdue');
    const filed = rows.filter((r) => r.status === 'filed');
    const hours = filed.map((r) => r.hours_to_file).filter((h) => h != null).sort((a, b) => a - b);
    const kpis = {
      events: rows.length, required: required.length, filed: filed.length, waived: 0,
      open: required.filter((r) => r.status === 'open').length, overdue: overdue.length,
      filing_rate: done.length + overdue.length ? Math.round((done.length / (done.length + overdue.length)) * 1000) / 10 : null,
      median_hours_to_file: hours.length ? hours[Math.floor(hours.length / 2)] : null,
      photo_checks: rows.filter((r) => r.verdict).length, discrepancies: rows.filter((r) => r.verdict === 'discrepancy').length,
      reported_total: filed.reduce((s, r) => s + (r.reported_count || 0), 0), checkins_total: rows.reduce((s, r) => s + r.checkins, 0),
      unique_students: new Set(this.events.filter((e) => e.category === category).flatMap((e) => e.checkins)).size,
    };
    const byWeek = new Map();
    for (const r of rows) {
      const d = new Date(r.starts_at);
      const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
      const key = monday.toISOString().slice(0, 10);
      const w = byWeek.get(key) || { week: key, events: 0, reported: 0, checkins: 0 };
      w.events += 1; w.reported += r.reported_count || 0; w.checkins += r.checkins;
      byWeek.set(key, w);
    }
    const out = { category, window: { start: at(-2160), end: now }, kpis,
      weekly: [...byWeek.values()].sort((a, b) => a.week.localeCompare(b.week)), events: rows };
    if (category === 'club') {
      out.clubs = this.clubs.filter((c) => ['active', 'suspended'].includes(c.status)).map((c) => {
        const mine = rows.filter((r) => r.org_id === c.id);
        const done2 = mine.filter((r) => ['filed', 'waived'].includes(r.status));
        const over2 = mine.filter((r) => r.status === 'overdue');
        const rep = mine.filter((r) => r.reported_count != null);
        return { id: c.id, name: c.name, status: c.status, leader: PEOPLE[c.leader], members: this.people(c).length,
          events: mine.length, filed: rep.length, overdue: over2.length,
          filing_rate: done2.length + over2.length ? Math.round((done2.length / (done2.length + over2.length)) * 1000) / 10 : null,
          discrepancies: mine.filter((r) => r.verdict === 'discrepancy').length,
          avg_reported: rep.length ? Math.round(rep.reduce((s, r) => s + r.reported_count, 0) / rep.length * 10) / 10 : null,
          avg_checkins: mine.length ? Math.round(mine.reduce((s, r) => s + r.checkins, 0) / mine.length * 10) / 10 : null,
          checkin_rate: mine.reduce((s, r) => s + r.expected, 0)
            ? Math.round(mine.reduce((s, r) => s + r.checkins, 0) / mine.reduce((s, r) => s + r.expected, 0) * 1000) / 10 : null };
      });
    }
    return out;
  }

  students() {
    const now = new Date().toISOString();
    const required = this.events.filter((e) => e.attendance_required && e.status === 'scheduled' && e.starts_at <= now);
    const rows = Object.keys(PEOPLE).map(Number).filter((id) => id !== 101).map((id) => {
      const expected = required.filter((e) => this.expected(e).includes(id));
      const attended = expected.filter((e) => e.checkins.includes(id));
      const club = expected.filter((e) => e.category === 'club');
      const campus = expected.filter((e) => e.category === 'campus');
      return { user: user(id), clubs: this.clubs.filter((c) => c.status === 'active' && this.people(c).includes(id)).length,
        expected: expected.length, attended: attended.length,
        rate: expected.length ? Math.round((attended.length / expected.length) * 1000) / 10 : null,
        club: { expected: club.length, attended: club.filter((e) => e.checkins.includes(id)).length },
        campus: { expected: campus.length, attended: campus.filter((e) => e.checkins.includes(id)).length } };
    });
    rows.sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101) || a.user.name.localeCompare(b.user.name));
    return { window: { start: at(-2160), end: now }, students: rows };
  }

  studentDetail(userId) {
    const id = Number(userId);
    if (!PEOPLE[id]) throw new ApiError('not-found', 'Not found', { status: 404 });
    const now = new Date().toISOString();
    const events = this.events.filter((e) => e.attendance_required && e.status === 'scheduled' && e.starts_at <= now && this.expected(e).includes(id))
      .map((e) => ({ id: e.id, title: e.title, category: e.category, org_name: this.describe(e).org_name, starts_at: e.starts_at,
        attended: e.checkins.includes(id), checked_in_at: e.checkins.includes(id) ? e.starts_at : null }));
    return { user: user(id), window: { start: at(-2160), end: now }, events };
  }

  csv(category) {
    const rows = this.analytics(category).events;
    const header = 'event_id,org,category,title,starts_at,required,status,reported_count,ai_count,ai_provider,verdict,checkins,rsvps,expected';
    const cell = (v) => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const lines = rows.map((r) => [r.id, r.org_name, r.category, r.title, r.starts_at, r.required ? 1 : 0, r.status,
      r.reported_count, r.ai_count, r.ai_provider, r.verdict, r.checkins, r.rsvps, r.expected].map(cell).join(','));
    return `${[header, ...lines].join('\n')}\n`;
  }

  // ---- surveys, moderation, outbox -------------------------------------------

  getSurvey(category) {
    return { category, questions: structuredClone(this.surveys[category] || []), source: 'school', updated_at: at(-300) };
  }

  updateSurvey(category, questions) {
    if (!Array.isArray(questions) || questions.length > 6) {
      throw new ApiError('unknown', 'A survey can have at most 6 questions', { status: 400 });
    }
    for (const [i, q] of questions.entries()) {
      if (!q.prompt) throw new ApiError('unknown', `question ${i + 1} needs a prompt`, { status: 400 });
      if (q.kind === 'choice' && (!q.options || q.options.length < 2)) {
        throw new ApiError('unknown', `question ${i + 1}: a choice needs 2 to 6 options`, { status: 400 });
      }
    }
    this.surveys[category] = structuredClone(questions);
    return this.getSurvey(category);
  }

  listModeration() { return structuredClone(this.moderation); }

  hideChatMessage(messageId, reason) {
    const m = this.moderation.find((x) => x.id === Number(messageId));
    if (!m) throw new ApiError('not-found', 'Not found', { status: 404 });
    if (m.hidden) throw new ApiError('conflict', 'Already hidden', { status: 409 });
    m.hidden = true; m.hide_reason = reason || null; m.reports = 0;
    return { hidden: true };
  }

  resolve(audience) {
    switch (audience?.kind) {
      case 'members': return Object.keys(PEOPLE).map(Number).filter((id) => id !== 101);
      case 'club_leaders': return this.clubs.filter((c) => c.status === 'active').map((c) => c.leader);
      case 'clubs': {
        const clubs = (audience.club_ids || []).map((id) => this.club(id));
        if (!clubs.length || clubs.some((c) => !c)) throw new ApiError('unknown', 'Every club must belong to this school', { status: 400 });
        return [...new Set(clubs.flatMap((c) => (audience.scope === 'officers' ? [c.leader, ...c.officers] : this.people(c))))];
      }
      case 'event_rsvps': return this.event(audience.event_id)?.rsvps ?? [];
      case 'event_attendees': return this.event(audience.event_id)?.checkins ?? [];
      case 'event_absentees': {
        const e = this.event(audience.event_id);
        return e ? this.expected(e).filter((id) => !e.checkins.includes(id)) : [];
      }
      default: throw new ApiError('unknown', 'audience.kind must be one of: members, club_leaders, clubs, event_rsvps, event_attendees, event_absentees', { status: 400 });
    }
  }

  summarize(m) {
    return { id: m.id, subject: m.subject, body: m.body, audience: m.audience, sender: m.sender,
      recipient_count: m.recipient_ids.length, recorded: 0, undeliverable_domain: m.recipient_ids.length, no_address: 0,
      delivery: 'outbox_only', created_at: m.created_at };
  }

  listOutbox() { return { delivery: 'outbox_only', messages: this.outbox.map((m) => this.summarize(m)) }; }

  previewOutbox(audience) {
    const ids = this.resolve(audience);
    // Every demo address is on demo.invalid: recorded, and undeliverable by construction.
    return { recipient_count: ids.length, recorded: 0, undeliverable_domain: ids.length, no_address: 0,
      sample: ids.slice(0, 8).map(user), delivery: 'outbox_only' };
  }

  sendOutbox(fields) {
    if (!fields.subject) throw new ApiError('unknown', 'A subject is required', { status: 400 });
    if (!fields.body) throw new ApiError('unknown', 'A message is required', { status: 400 });
    const ids = this.resolve(fields.audience);
    if (!ids.length) throw new ApiError('unknown', 'That audience has nobody in it', { status: 400, reason: 'empty_audience' });
    const m = { id: this.nextId++, subject: fields.subject, body: fields.body, audience: fields.audience, sender: user(101),
      recipient_ids: ids, created_at: new Date().toISOString() };
    this.outbox.unshift(m);
    return this.loadOutbox(m.id);
  }

  loadOutbox(messageId) {
    const m = this.outbox.find((x) => x.id === Number(messageId));
    if (!m) throw new ApiError('not-found', 'Not found', { status: 404 });
    return { ...this.summarize(m), recipients: m.recipient_ids.map((id) => ({ user: user(id), status: 'undeliverable_domain' })) };
  }
}
