import { el, mount, formatDate } from '../ui/dom.js';
import { spinner, errorState, emptyState, section, pill, notice } from '../ui/components.js';

/**
 * The organization's invite codes, their reach, and the printable QR for each.
 *
 * Minting and revoking still live in the mobile app — the person who decides a
 * code is needed is usually standing where the sign will go. PRINTING is the
 * opposite: it happens at a desk, next to a printer, which is why the QR belongs
 * here. `routes.inviteQR` was declared when this console was written and nothing
 * ever called it, so the one asset in the product that exists to be put on paper
 * could only be got at by hand-crafting an authenticated request.
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
      'Codes are created in the Nostia mobile app. Once one exists, its printable QR and its redemptions show up here.'));
    mount(root, page);
    return;
  }

  const total = codes.reduce((sum, code) => sum + (code.use_count ?? 0), 0);
  page.append(notice('info', `${total} redemptions across ${codes.length} codes`,
    'A code that grants membership brings someone into your organization. A code scoped to one adventure unlocks just that walk, without anybody having to join.'));

  const list = el('div');
  for (const code of codes) list.append(codeRow(code, session));
  page.append(section('Codes', null, list));

  mount(root, page);
}

function codeRow(code, session) {
  const grantsMembership = code.org_adventure_id == null;
  const revoked = Boolean(code.revoked_at) || code.revoked === true;
  const exhausted = code.max_uses != null && code.use_count >= code.max_uses;
  const expired = code.expires_at ? new Date(code.expires_at) < new Date() : false;
  const dead = revoked || exhausted || expired;

  const meta = el('div', { class: 'meta' },
    pill(grantsMembership ? 'Membership' : 'One adventure', grantsMembership ? 'info' : ''),
    code.expires_at ? el('span', { text: `expires ${formatDate(code.expires_at)}` }) : null,
    revoked ? el('span', { class: 'muted', text: 'revoked' }) : null,
    !revoked && exhausted ? el('span', { class: 'muted', text: 'fully redeemed' }) : null,
    !revoked && !exhausted && expired ? el('span', { class: 'muted', text: 'expired' }) : null);

  const status = el('span', { class: 'small muted' });

  // A dead code still renders its QR — you may want to see what is already out
  // there on a wall — but printing one is almost always a mistake, so the button
  // says what will happen rather than silently producing a sheet nobody can use.
  const printBtn = el('button', {
    class: 'btn ghost',
    text: dead ? 'Preview QR' : 'Print QR',
    style: { marginTop: '10px' },
    onClick: async () => {
      printBtn.disabled = true;
      const original = printBtn.textContent;
      printBtn.textContent = 'Preparing…';
      mount(status);
      try {
        const svg = await session.backend.inviteQrSvg(session.orgId, code.id);
        openPrintView({ svg, code, grantsMembership, dead });
      } catch (error) {
        mount(status, el('span', { class: 'small', text: error.message || 'Could not load the QR.' }));
      } finally {
        printBtn.disabled = false;
        printBtn.textContent = original;
      }
    },
  });

  return el('div', { class: 'list-item', style: { cursor: 'default' } },
    el('div', {},
      el('div', { class: 'title mono', text: formatCode(code.code) }),
      meta,
      code.universal_link
        ? el('div', { class: 'small muted mono', style: { marginTop: '6px', wordBreak: 'break-all' }, text: code.universal_link })
        : null,
      printBtn,
      status),
    el('div', { class: 'figure' }, String(code.use_count ?? 0),
      el('small', { text: code.max_uses ? `of ${code.max_uses} uses` : 'redemptions' })));
}

/**
 * A print-ready sheet in a new window.
 *
 * The SVG is inlined rather than referenced. A blob URL in an <img> is a separate
 * document, and Safari routinely prints those as an empty box — which would be
 * discovered at the printer, on the morning of an orientation.
 *
 * The quiet zone matters as much as the code: a QR with no margin fails against a
 * dark surface or a busy poster, so the sheet keeps white space around it and
 * prints the human-readable code underneath as the fallback for a scan that will
 * not take.
 */
function openPrintView({ svg, code, grantsMembership, dead }) {
  const win = window.open('', '_blank', 'width=760,height=920');
  if (!win) {
    // A popup blocker is the common case and silently doing nothing is the worst
    // possible response, so say what to do about it.
    // eslint-disable-next-line no-alert
    alert('Your browser blocked the print window. Allow pop-ups for this site and try again.');
    return;
  }

  const pretty = code.code.length > 4 ? `${code.code.slice(0, 4)} ${code.code.slice(4)}` : code.code;
  const grant = grantsMembership ? 'Joins your organization' : 'Opens one adventure';
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  win.document.write(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Nostia invite ${esc(code.code)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 48px 32px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111; background: #fff; text-align: center;
  }
  .sheet { max-width: 520px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 6px; letter-spacing: -.01em; }
  .sub { color: #555; font-size: 14px; margin: 0 0 32px; }
  /* The quiet zone is part of the symbol. Without it a scanner cannot find the
     finder patterns against a dark or busy background. */
  .qr { display: inline-block; padding: 16px; background: #fff; }
  .qr svg { display: block; width: 320px; height: 320px; }
  .code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 30px; letter-spacing: .16em; margin: 26px 0 6px; }
  .hint { color: #555; font-size: 13px; margin: 0; }
  .link { color: #666; font-size: 11px; margin-top: 22px; word-break: break-all; }
  .warn { border: 1px solid #b3261e; color: #b3261e; border-radius: 8px;
          padding: 10px 12px; font-size: 13px; margin-bottom: 24px; }
  @media print {
    body { padding: 24px; }
    .warn { border-color: #000; color: #000; }
    @page { margin: 12mm; }
  }
</style></head>
<body>
  <div class="sheet">
    ${dead ? '<div class="warn">This code is no longer redeemable. Printing it will not work.</div>' : ''}
    <h1>Scan to start</h1>
    <p class="sub">${esc(grant)}</p>
    <div class="qr">${svg}</div>
    <div class="code">${esc(pretty)}</div>
    <p class="hint">No camera? Enter the code in the Nostia app.</p>
    ${code.universal_link ? `<p class="link">${esc(code.universal_link)}</p>` : ''}
  </div>
  <script>
    // Print once the SVG has laid out. Printing from the same tick gives Chrome
    // an empty page often enough to matter.
    window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 120); });
  <\/script>
</body></html>`);
  win.document.close();
}

/** Grouped in fours, the way it reads on a printed sign. */
function formatCode(code = '') {
  return code.length > 4 ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
}
