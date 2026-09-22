import { el, mount } from '../ui/dom.js';
import { spinner, errorState, section, notice, pill } from '../ui/components.js';
import { table, clubStatusPill, formatDateTime } from '../ui/school.js';

const POLICY_TEXT = {
  admin_only: ['Administrators only', 'Only school administrators can create a club, and they name its student leader.'],
  request: ['Students request, you approve', 'A student can ask for a club. It stays pending — no events, no chat — until an administrator approves it.'],
  open: ['Open', 'Any student can start a club and it is active at once. You can still suspend it.'],
};

/**
 * Clubs: which exist, who may create them, and what is waiting for a decision.
 *
 * The creation policy is ACCESS CONTROL, enforced server-side in exactly one place
 * (orgClubService.create). This page sets it and shows its consequences; it decides nothing.
 */
export async function renderClubs(root, { session, navigate, params }) {
  mount(root, spinner('Loading clubs'));
  let data; let policy; let members; let moderation;
  try {
    [data, policy, members, moderation] = await Promise.all([
      session.backend.listClubs(session.orgId),
      session.backend.getPolicy(session.orgId),
      session.backend.listMembers(session.orgId),
      session.backend.listModeration(session.orgId),
    ]);
  } catch (error) {
    mount(root, errorState(error, { onRetry: () => renderClubs(root, { session, navigate, params }) }));
    return;
  }
  const refresh = () => renderClubs(root, { session, navigate, params });
  const pending = data.clubs.filter((c) => c.status === 'pending');
  const live = data.clubs.filter((c) => ['active', 'suspended'].includes(c.status));
  const rejected = data.clubs.filter((c) => c.status === 'rejected');

  mount(root, el('div', {},
    el('h1', { text: 'Clubs' }),
    el('p', { class: 'lede', text: 'Student organizations inside the school. Each club runs its own events, walking trips, chat and member email from the app.' }),
    section('Who can create a club', null, policyControl(session, policy, refresh)),
    section(`Waiting for a decision${pending.length ? ` (${pending.length})` : ''}`, null,
      pending.length ? pending.map((c) => pendingCard(session, c, refresh)) : el('p', { class: 'muted small', text: 'No requests waiting.' })),
    section('Clubs', 'Suspending a club keeps its record but stops it scheduling, posting and filing until you reinstate it.', table([
      { label: 'Club', value: (c) => el('div', {}, el('strong', { text: c.name }), el('div', { class: 'small muted', text: c.category })) },
      { label: 'Leader', value: (c) => c.leader?.name ?? '—' },
      { label: 'Members', value: (c) => c.member_count, numeric: true },
      { label: 'Joining', value: (c) => (c.join_policy === 'approval' ? 'Leader approves' : 'Open') },
      { label: 'Status', value: (c) => clubStatusPill(c.status) },
      { label: 'Attendance', value: (c) => (c.overdue_attendance ? pill(`⚠ ${c.overdue_attendance} overdue`, 'bad') : pill('✓ Up to date', 'ok')) },
      { label: '', value: (c) => statusButton(session, c, refresh) },
    ], live, { empty: 'No active clubs yet.' })),
    section('Start a club for a student', 'Created active, with the student you choose as its leader.', createForm(session, members, refresh)),
    section('Chat moderation', 'Messages members reported, and ones officers hid in the last 30 days, across every club. Hiding keeps the message for the record and removes it for members.',
      moderation.length ? moderation.map((m) => moderationCard(session, m, refresh)) : el('p', { class: 'muted small', text: 'Nothing reported.' })),
    rejected.length ? section('Not approved', null, table([
      { label: 'Club', value: (c) => c.name },
      { label: 'Requested by', value: (c) => c.requested_by?.name ?? '—' },
      { label: 'Note to the student', value: (c) => c.decision_note ?? '—' },
      { label: 'Decided', value: (c) => formatDateTime(c.decided_at) },
    ], rejected)) : null));
}

function policyControl(session, policy, refresh) {
  const status = el('div');
  const options = Object.entries(POLICY_TEXT).map(([key, [label, help]]) => {
    const input = el('input', { type: 'radio', name: 'creation', value: key, checked: policy.club_creation_policy === key });
    return el('label', { class: 'check option' }, input, el('span', {}, el('strong', { text: label }), el('span', { class: 'small muted', text: ` — ${help}` })));
  });
  const save = el('button', { class: 'btn', type: 'submit', text: 'Save' });
  return el('form', { class: 'card', onSubmit: async (event) => {
    event.preventDefault();
    const value = event.target.querySelector('input[name="creation"]:checked')?.value;
    save.disabled = true;
    try {
      await session.backend.updatePolicy(session.orgId, { club_creation_policy: value });
      mount(status, notice('ok', 'Saved', POLICY_TEXT[value][1]));
      setTimeout(refresh, 900);
    } catch (error) {
      mount(status, notice('bad', 'Not saved', error.message));
    } finally { save.disabled = false; }
  } }, ...options, status, save);
}

function pendingCard(session, club, refresh) {
  const note = el('input', { maxlength: 500, placeholder: 'Note to the student (required to decline)', 'aria-label': `Note for ${club.name}` });
  const act = async (decision, btn) => {
    btn.disabled = true;
    try { await session.backend.decideClub(session.orgId, club.id, decision, note.value.trim() || undefined); refresh(); } catch (error) {
      btn.closest('.card').append(el('p', { class: 'small bad-text', text: error.message }));
      btn.disabled = false;
    }
  };
  const approve = el('button', { class: 'btn', text: 'Approve', onClick: () => act('approve', approve) });
  const reject = el('button', { class: 'btn ghost', text: 'Decline', onClick: () => act('reject', reject) });
  return el('div', { class: 'card' },
    el('div', { class: 'row' }, el('strong', { text: club.name }), clubStatusPill('pending')),
    el('p', { class: 'small', text: club.description || 'No description.' }),
    el('p', { class: 'small muted', text: `Requested by ${club.requested_by?.name ?? club.leader?.name ?? 'a student'} · ${club.category} · ${formatDateTime(club.created_at)}` }),
    el('div', { class: 'row' }, note, approve, reject));
}

function statusButton(session, club, refresh) {
  const suspend = club.status === 'active';
  const btn = el('button', { class: 'btn link', text: suspend ? 'Suspend' : 'Reinstate', onClick: async (event) => {
    event.stopPropagation();
    btn.disabled = true;
    try { await session.backend.setClubStatus(session.orgId, club.id, suspend ? 'suspended' : 'active'); refresh(); } catch (error) {
      btn.after(el('span', { class: 'small bad-text', text: ` ${error.message}` }));
      btn.disabled = false;
    }
  } });
  return btn;
}

function createForm(session, members, refresh) {
  const name = el('input', { required: true, maxlength: 80, placeholder: 'Demo University …' });
  const description = el('input', { maxlength: 500, placeholder: 'One line about the club' });
  const category = el('select', {}, ['academic', 'arts', 'cultural', 'outdoors', 'service', 'sports', 'technology', 'general']
    .map((c) => el('option', { value: c, text: c })));
  const leader = el('select', { required: true }, members.filter((m) => m.role === 'member')
    .map((m) => el('option', { value: m.user.id, text: m.user.name })));
  const status = el('div');
  return el('form', { class: 'card', onSubmit: async (event) => {
    event.preventDefault();
    try {
      await session.backend.createClub(session.orgId, {
        name: name.value.trim(), description: description.value.trim(), category: category.value,
        leader_user_id: Number(leader.value),
      });
      refresh();
    } catch (error) {
      mount(status, notice('bad', 'Not created', error.message));
    }
  } },
  el('div', { class: 'grid grid-2' },
    el('label', { class: 'field' }, el('span', { text: 'Name' }), name),
    el('label', { class: 'field' }, el('span', { text: 'Student leader' }), leader)),
  el('div', { class: 'grid grid-2' },
    el('label', { class: 'field' }, el('span', { text: 'Category' }), category),
    el('label', { class: 'field' }, el('span', { text: 'Description' }), description)),
  status, el('button', { class: 'btn', type: 'submit', text: 'Create club' }));
}

function moderationCard(session, m, refresh) {
  const hide = el('button', { class: 'btn ghost', text: 'Hide message', onClick: async () => {
    hide.disabled = true;
    try { await session.backend.hideChatMessage(session.orgId, m.id, 'Hidden by Student Affairs'); refresh(); } catch (error) {
      hide.after(el('span', { class: 'small bad-text', text: ` ${error.message}` }));
      hide.disabled = false;
    }
  } });
  return el('div', { class: 'card' },
    el('div', { class: 'row' },
      el('strong', { text: m.club.name }),
      m.hidden ? pill('Hidden', '') : pill(`⚠ Reported ×${m.reports}`, 'warn'),
      el('span', { class: 'small muted', text: `${m.author?.name ?? '—'} · ${formatDateTime(m.created_at)}` })),
    el('blockquote', { class: 'quote', text: m.body ?? '' }),
    m.report_reasons?.length ? el('p', { class: 'small muted', text: `Reports: ${m.report_reasons.join(' · ')}` }) : null,
    m.hidden ? el('p', { class: 'small muted', text: `Hidden${m.hide_reason ? `: ${m.hide_reason}` : ''}` }) : hide);
}
