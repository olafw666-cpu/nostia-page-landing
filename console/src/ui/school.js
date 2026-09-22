import { el } from './dom.js';
import { pill } from './components.js';

/**
 * UI pieces for the school pages: pills that never rely on colour alone, a plain table, the
 * survey editor, and two small charts drawn as inline SVG (no library — the CSP allows none, and
 * the console has no build step to bundle one).
 *
 * THE HONESTY LABELS live here, in one place, because they are the part of this UI that must not
 * drift: a headcount verdict always says HOW it was produced. 'fixture' is a seeded demo row with
 * no photo behind it; 'stub' is a simulated count; only 'anthropic' is a model's estimate.
 */

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(String(value).includes('T') ? value : `${String(value).replace(' ', 'T')}Z`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function relative(value) {
  const t = Date.parse(value);
  if (Number.isNaN(t)) return '';
  const hours = (t - Date.now()) / 3600000;
  const abs = Math.abs(hours);
  const text = abs < 1 ? `${Math.round(abs * 60)} min` : abs < 48 ? `${Math.round(abs)} h` : `${Math.round(abs / 24)} days`;
  return hours >= 0 ? `in ${text}` : `${text} ago`;
}

export function methodsLabel(methods = []) {
  if (!methods.length) return 'No attendance required';
  return methods.map((m) => (m === 'photo' ? 'Room photo' : 'Survey + check-in')).join(' and ');
}

/** Where an event stands on attendance. Icon + word, never colour alone. */
export function attendancePill(status) {
  switch (status) {
    case 'filed': return pill('✓ Filed', 'ok');
    case 'waived': return pill('Waived', 'info');
    case 'open': return pill('◷ Open — to file', 'info');
    case 'overdue': return pill('⚠ Overdue', 'bad');
    case 'upcoming': return pill('Upcoming');
    case 'cancelled': return pill('Cancelled');
    default: return pill('Not required');
  }
}

export function clubStatusPill(status) {
  switch (status) {
    case 'active': return pill('Active', 'ok');
    case 'pending': return pill('◷ Pending approval', 'warn');
    case 'suspended': return pill('Suspended', 'bad');
    case 'rejected': return pill('Not approved');
    default: return pill(status ?? '—');
  }
}

export function complianceBadge(state) {
  switch (state) {
    case 'locked': return pill('⛔ Locked — overdue', 'bad');
    case 'overdue': return pill('⚠ Overdue', 'warn');
    case 'open': return pill('◷ Filing open', 'info');
    default: return pill('✓ Up to date', 'ok');
  }
}

/**
 * A headcount check, labelled by provenance first and verdict second. A seeded row can never be
 * mistaken for a model's estimate, and a discrepancy is "review", never "fraud".
 */
export function verdictPill(check) {
  if (!check) return pill('No photo');
  const range = check.ai_count != null ? ` ~${check.ai_count}` : '';
  const provenance = check.ai_provider === 'fixture' ? 'Seeded sample'
    : check.ai_provider === 'stub' ? 'Simulated'
      : check.ai_provider === 'anthropic' ? 'AI estimate'
        : 'Not analysed';
  switch (check.verdict) {
    case 'consistent': return pill(`✓ ${provenance}${range} — consistent`, 'ok');
    case 'discrepancy': return pill(`⚠ ${provenance}${range} — review`, 'warn');
    case 'inconclusive': return pill(`${provenance} — inconclusive`, 'info');
    default: return pill('Photo not analysed', '');
  }
}

export function provenanceNote(check) {
  if (!check) return null;
  if (check.ai_provider === 'fixture') return 'Seeded sample — no photo was analysed. Every figure in this demo is fabricated.';
  if (check.ai_provider === 'stub') return 'Simulated estimate — no model was called.';
  if (check.ai_provider === 'anthropic') return `Estimated by ${check.ai_model || 'Claude'} from the room photo. The photo itself was not stored.`;
  return 'No AI headcount is configured on this server, so the photo was recorded unjudged.';
}

/**
 * A plain data table. `columns` = [{ label, value(row) → string|Node, numeric? }]. Wrapped in
 * .scroll-x so a wide table scrolls inside itself and never the page.
 */
export function table(columns, rows, { onRowClick, empty = 'Nothing yet.' } = {}) {
  if (!rows.length) return el('p', { class: 'muted small', text: empty });
  const head = el('tr', {}, columns.map((c) => el('th', { class: c.numeric ? 'num' : null, scope: 'col', text: c.label })));
  const body = rows.map((row) => {
    const tr = el('tr', { class: onRowClick ? 'clickable' : null },
      columns.map((c) => {
        const v = c.value(row);
        return el('td', { class: c.numeric ? 'num' : null }, v instanceof Node ? v : (v ?? '—'));
      }));
    if (onRowClick) {
      tr.tabIndex = 0;
      tr.addEventListener('click', () => onRowClick(row));
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') onRowClick(row); });
    }
    return tr;
  });
  return el('div', { class: 'scroll-x' }, el('table', { class: 'data' }, el('thead', {}, head), el('tbody', {}, body)));
}

// ---------------------------------------------------------------------------
// Charts. Inline SVG, drawn against CSS custom properties so light and dark are both selected
// rather than flipped. Series colours are slots 1–3 of the reference categorical palette
// (--series-1..3 in styles.css), which validate all-pairs in both modes.
// ---------------------------------------------------------------------------

const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  for (const c of children.flat()) if (c != null) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}

/**
 * Check-ins per week — ONE measure, one axis. Events per week is a different scale, so it is NOT
 * a second axis: it rides in the tooltip and the label under each bar.
 */
export function weeklyChart(weekly) {
  if (!weekly.length) return el('p', { class: 'muted small', text: 'No events in this window yet.' });
  const W = 640; const Hh = 200; const pad = { l: 36, r: 12, t: 22, b: 40 };
  const max = Math.max(1, ...weekly.map((w) => w.checkins));
  const bw = Math.min(48, (W - pad.l - pad.r) / weekly.length - 10);
  const x = (i) => pad.l + i * ((W - pad.l - pad.r) / weekly.length) + ((W - pad.l - pad.r) / weekly.length - bw) / 2;
  const y = (v) => pad.t + (Hh - pad.t - pad.b) * (1 - v / max);
  const root = svg('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'chart', role: 'img',
    'aria-label': `Students checked in per week, ${weekly.length} weeks` });
  root.append(svg('line', { x1: pad.l, x2: W - pad.r, y1: y(0), y2: y(0), class: 'axis' }));
  weekly.forEach((w, i) => {
    const h = Math.max(0, y(0) - y(w.checkins));
    const g = svg('g', { class: 'hit' },
      svg('title', {}, `Week of ${w.week}: ${w.checkins} check-ins across ${w.events} event${w.events === 1 ? '' : 's'}; ${w.reported} reported by leaders`),
      // Invisible, full-height hit target: bigger than the mark, so hovering a short bar works.
      svg('rect', { x: x(i) - 4, y: pad.t, width: bw + 8, height: y(0) - pad.t, class: 'hit-target' }),
      svg('path', { d: roundedTop(x(i), y(w.checkins), bw, h), class: 'bar s1' }),
      svg('text', { x: x(i) + bw / 2, y: y(w.checkins) - 6, class: 'val', 'text-anchor': 'middle' }, String(w.checkins)),
      svg('text', { x: x(i) + bw / 2, y: Hh - pad.b + 16, class: 'tick', 'text-anchor': 'middle' },
        new Date(`${w.week}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })),
      svg('text', { x: x(i) + bw / 2, y: Hh - pad.b + 30, class: 'tick muted', 'text-anchor': 'middle' },
        `${w.events} event${w.events === 1 ? '' : 's'}`));
    root.append(g);
  });
  return el('figure', { class: 'chart-wrap' },
    el('figcaption', { class: 'small muted', text: 'Students who checked themselves in, per week' }), root);
}

/** A bar with a 4px rounded data-end, anchored square to the baseline. */
function roundedTop(x, y, w, h) {
  if (h <= 0) return '';
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * THE THREE NUMBERS, per event: what the leader REPORTED, what the room photo's estimate suggests
 * (dot + low–high range), and how many students CHECKED IN themselves. Where they disagree is where
 * a school should look — the flag is a word, not a colour.
 */
export function threeNumbersChart(rows) {
  const shown = rows.filter((r) => r.reported_count != null || r.ai_count != null || r.checkins).slice(0, 10);
  if (!shown.length) return el('p', { class: 'muted small', text: 'No filed events in this window yet.' });
  const W = 640; const rowH = 34; const pad = { l: 190, r: 150, t: 8, b: 26 };
  const Hh = pad.t + shown.length * rowH + pad.b;
  const max = Math.max(5, ...shown.map((r) => Math.max(r.reported_count ?? 0, r.ai_range?.[1] ?? r.ai_count ?? 0, r.checkins)));
  const x = (v) => pad.l + (W - pad.l - pad.r) * (v / max);
  const root = svg('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'chart', role: 'img',
    'aria-label': 'Reported count, AI headcount estimate and self check-ins, per event' });
  for (const t of [0, Math.round(max / 2), max]) {
    root.append(svg('line', { x1: x(t), x2: x(t), y1: pad.t, y2: Hh - pad.b, class: 'grid' }));
    root.append(svg('text', { x: x(t), y: Hh - 8, class: 'tick', 'text-anchor': 'middle' }, String(t)));
  }
  shown.forEach((r, i) => {
    const cy = pad.t + i * rowH + rowH / 2;
    const flagged = r.verdict === 'discrepancy';
    const parts = [
      r.reported_count != null ? `reported ${r.reported_count}` : 'not filed',
      r.ai_count != null ? `photo estimate ~${r.ai_count} (${r.ai_range?.[0]}–${r.ai_range?.[1]})${r.ai_provider === 'fixture' ? ', seeded sample' : r.ai_provider === 'stub' ? ', simulated' : ''}` : 'no photo',
      `${r.checkins} checked in`,
    ];
    const g = svg('g', { class: 'hit' }, svg('title', {}, `${r.title} (${r.org_name}): ${parts.join('; ')}${flagged ? ' — flagged for review' : ''}`));
    g.append(svg('text', { x: pad.l - 10, y: cy + 4, class: 'label', 'text-anchor': 'end' }, truncate(r.title, 26)));
    g.append(svg('line', { x1: pad.l, x2: W - pad.r, y1: cy, y2: cy, class: 'row-rule' }));
    if (r.ai_range && r.ai_count != null) {
      g.append(svg('line', { x1: x(r.ai_range[0]), x2: x(r.ai_range[1]), y1: cy, y2: cy, class: 'range s2' }));
      g.append(svg('rect', { x: x(r.ai_count) - 5, y: cy - 5, width: 10, height: 10, transform: `rotate(45 ${x(r.ai_count)} ${cy})`, class: 'dot s2' }));
    }
    g.append(svg('circle', { cx: x(r.checkins), cy, r: 5, class: 'dot s3' }));
    if (r.reported_count != null) g.append(svg('circle', { cx: x(r.reported_count), cy, r: 5.5, class: 'dot s1' }));
    g.append(svg('text', { x: W - pad.r + 10, y: cy + 4, class: flagged ? 'flag' : 'val' },
      flagged ? `⚠ review: ${r.reported_count} vs ~${r.ai_count}`
        : [r.reported_count != null ? String(r.reported_count) : 'not filed',
          r.ai_count != null ? `~${r.ai_count}` : null,
          `${r.checkins} in`].filter(Boolean).join(' · ')));
    root.append(g);
  });
  const legend = el('div', { class: 'legend' },
    el('span', {}, el('i', { class: 'swatch s1 round' }), 'Reported by the leader'),
    el('span', {}, el('i', { class: 'swatch s2 diamond' }), 'Room-photo estimate (range)'),
    el('span', {}, el('i', { class: 'swatch s3 round' }), 'Checked in themselves'));
  return el('figure', { class: 'chart-wrap' }, legend, root);
}

function truncate(s, n) { return s.length > n ? `${s.slice(0, n - 1)}…` : s; }

// ---------------------------------------------------------------------------
// Survey editor — used for the school's default surveys. Club leaders edit their own in the app.
// ---------------------------------------------------------------------------

const KINDS = { rating: 'Rating 1–5', yes_no: 'Yes / no', choice: 'Multiple choice', short_text: 'Short text' };
const AUDIENCES = { both: 'Leader and students', leader: 'Leader only', student: 'Students only' };

export function surveyEditor(initial, { onSave, max = 6 }) {
  let questions = structuredClone(initial);
  const wrap = el('div', { class: 'survey-editor' });
  const status = el('div');

  const draw = () => {
    const list = el('div');
    questions.forEach((q, i) => {
      const prompt = el('input', { value: q.prompt, 'aria-label': `Question ${i + 1}`, onInput: (e) => { q.prompt = e.target.value; } });
      const kind = el('select', { 'aria-label': `Question ${i + 1} type`, onChange: (e) => { q.kind = e.target.value; if (q.kind === 'choice' && !q.options) q.options = ['Option A', 'Option B']; draw(); } },
        Object.entries(KINDS).map(([k, label]) => el('option', { value: k, text: label, selected: q.kind === k })));
      const audience = el('select', { 'aria-label': `Question ${i + 1} is answered by`, onChange: (e) => { q.audience = e.target.value; } },
        Object.entries(AUDIENCES).map(([k, label]) => el('option', { value: k, text: label, selected: (q.audience ?? 'both') === k })));
      const required = el('input', { type: 'checkbox', checked: !!q.required, onChange: (e) => { q.required = e.target.checked; } });
      const row = el('div', { class: 'card question' },
        el('div', { class: 'row' }, el('span', { class: 'mono small', text: `${i + 1}.` }), prompt),
        el('div', { class: 'row' }, kind, audience,
          el('label', { class: 'check' }, required, 'Required'),
          el('button', { class: 'btn link', type: 'button', text: 'Remove', onClick: () => { questions.splice(i, 1); draw(); } })));
      if (q.kind === 'choice') {
        row.append(el('div', { class: 'row' }, el('span', { class: 'small muted', text: 'Options' }),
          el('input', { value: (q.options || []).join(', '), 'aria-label': `Question ${i + 1} options, comma separated`,
            onInput: (e) => { q.options = e.target.value.split(',').map((s) => s.trim()).filter(Boolean); } })));
      }
      list.append(row);
    });
    const add = el('button', { class: 'btn ghost', type: 'button', text: '+ Add a question', disabled: questions.length >= max,
      onClick: () => { questions.push({ id: `q${Date.now() % 100000}`, prompt: '', kind: 'rating', audience: 'both', required: false }); draw(); } });
    const save = el('button', { class: 'btn', type: 'button', text: 'Save survey', onClick: async () => {
      save.disabled = true;
      status.replaceChildren();
      try {
        const result = await onSave(questions);
        questions = structuredClone(result.questions);
        status.replaceChildren(el('p', { class: 'small ok-text', text: 'Saved.' }));
        draw();
      } catch (error) {
        status.replaceChildren(el('p', { class: 'small bad-text', text: error.message }));
      } finally { save.disabled = false; }
    } });
    wrap.replaceChildren(list, el('div', { class: 'row' }, add, save), status);
  };
  draw();
  return wrap;
}
