import { el, mount, formatDate } from '../ui/dom.js';
import { spinner, errorState, emptyState, section, pill, notice } from '../ui/components.js';

/**
 * Read-only view of the organization's invite codes and their reach.
 *
 * Minting and revoking live in the mobile app — the person who decides a code is needed is usually
 * the person standing where the sign will go. What belongs on a desktop is the reporting question:
 * which channels are actually bringing people in.
 */
export async function renderDistribution(root, { session, navigate }) {
  mount(root, spinner('Loading codes'));

  let codes;
  try {
    codes = await session.backend.listInviteCodes(session.orgId);
  } catch (error) {
    mount(root, errorState(error, {
      onRetry: () => renderDistribution(root, { session, navigate }),
      onBilling: () => navigate('billing'),
    }));
    return;
  }

  const page = el('div');
  page.append(el('h1', { text: 'Distribution' }));
  page.append(el('p', { class: 'lede', text: 'How your adventures are reaching people.' }));

  if (!codes.length) {
    page.append(emptyState('No invite codes yet',
      'Codes are created in the Nostia mobile app, along with their printable QR. Once one exists, its redemptions show up here.'));
    mount(root, page);
    return;
  }

  const total = codes.reduce((sum, code) => sum + (code.use_count ?? 0), 0);
  page.append(notice('info', `${total} redemptions across ${codes.length} codes`,
    'A code that grants membership brings someone into your organization. A code scoped to one adventure unlocks just that walk, without anybody having to join.'));

  const list = el('div');
  for (const code of codes) list.append(codeRow(code));
  page.append(section('Codes', null, list));

  mount(root, page);
}

function codeRow(code) {
  const grantsMembership = code.org_adventure_id == null;
  const revoked = Boolean(code.revoked_at) || code.revoked === true;
  const exhausted = code.max_uses != null && code.use_count >= code.max_uses;
  const expired = code.expires_at ? new Date(code.expires_at) < new Date() : false;

  const meta = el('div', { class: 'meta' },
    pill(grantsMembership ? 'Membership' : 'One adventure', grantsMembership ? 'info' : ''),
    code.expires_at ? el('span', { text: `expires ${formatDate(code.expires_at)}` }) : null,
    revoked ? el('span', { class: 'muted', text: 'revoked' }) : null,
    !revoked && exhausted ? el('span', { class: 'muted', text: 'fully redeemed' }) : null,
    !revoked && !exhausted && expired ? el('span', { class: 'muted', text: 'expired' }) : null);

  return el('div', { class: 'list-item', style: { cursor: 'default' } },
    el('div', {},
      el('div', { class: 'title mono', text: formatCode(code.code) }),
      meta),
    el('div', { class: 'figure' }, String(code.use_count ?? 0),
      el('small', { text: code.max_uses ? `of ${code.max_uses} uses` : 'redemptions' })));
}

/** Grouped in fours, the way it reads on a printed sign. */
function formatCode(code = '') {
  return code.length > 4 ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
}
