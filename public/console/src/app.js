import { config } from './config.js';
import { makeBackend } from './api/backend.js';
import { Session } from './state/session.js';
import { el, mount } from './ui/dom.js';
import { spinner, notice } from './ui/components.js';
import { renderSignIn } from './pages/signin.js';
import { renderOverview } from './pages/overview.js';
import { renderAnalytics } from './pages/analytics.js';
import { renderBilling } from './pages/billing.js';
import { renderDistribution } from './pages/distribution.js';

const root = document.getElementById('app');
const session = new Session(makeBackend());

const PAGES = {
  overview: { label: 'Overview', icon: '◫', render: renderOverview },
  analytics: { label: 'Analytics', icon: '◧', render: renderAnalytics },
  distribution: { label: 'Distribution', icon: '◎', render: renderDistribution },
  billing: { label: 'Plan and billing', icon: '◈', render: renderBilling },
};

/** Hash routing: `#/analytics?adventure=3`. No history library, no server rewrites to configure. */
function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [name, query = ''] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(query));
  return { name: PAGES[name] ? name : 'overview', params };
}

function navigate(name, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null));
  location.hash = `#/${name}${query.toString() ? `?${query}` : ''}`;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

async function render() {
  if (!session.isSignedIn) {
    renderSignIn(root, { session, onSignedIn: render });
    return;
  }

  // The console is an owner surface. An admin's session is valid — they simply have nothing to do
  // here, and every billing route would refuse them server-side. Saying which organizations they're
  // in and what role they hold is more useful than an empty dashboard.
  if (!session.ownedMemberships.length) {
    mount(root, el('div', { class: 'signin' }, el('div', { class: 'card' },
      el('h1', { text: 'Nothing to manage here' }),
      el('p', { text: 'The console is for organization owners — it is where billing and analytics live. You are signed in, but you do not own an organization.' }),
      session.nonOwnerMemberships.length
        ? notice('info', 'You are an admin, not an owner',
            `${session.nonOwnerMemberships.map((m) => m.name).join(', ')} — ask the owner to open the console, or use the Nostia mobile app, where admins can author and publish.`)
        : notice('info', 'No organizations yet',
            'Ask an existing owner to add you, or create an organization in the Nostia mobile app.'),
      el('button', { class: 'btn ghost', text: 'Sign out', onClick: async () => { await session.signOut(); render(); } }))));
    return;
  }

  const route = currentRoute();
  const content = el('div', { class: 'content' }, spinner());
  mount(root, el('div', { class: 'shell' }, sidebar(route), content));

  try {
    await PAGES[route.name].render(content, { session, navigate, params: route.params });
  } catch (error) {
    // A page that throws outside its own handling still has to leave the shell usable.
    mount(content, notice('bad', 'This page failed to load', error?.message ?? String(error)));
    console.error(error);
  }
}

function sidebar(route) {
  const nav = el('nav', { class: 'nav', 'aria-label': 'Sections' });
  for (const [name, page] of Object.entries(PAGES)) {
    nav.append(el('button', {
      text: `${page.icon}  ${page.label}`,
      'aria-current': name === route.name ? 'page' : null,
      onClick: () => navigate(name),
    }));
  }

  const owned = session.ownedMemberships;
  const select = el('select', { 'aria-label': 'Organization', onChange: (event) => {
    session.selectOrganization(event.target.value);
    navigate('overview');
    render();
  } });
  for (const membership of owned) {
    const option = el('option', { value: membership.org_id, text: membership.name });
    if (String(membership.org_id) === String(session.orgId)) option.selected = true;
    select.append(option);
  }

  const switcher = owned.length > 1
    ? el('div', { class: 'org-switch' }, el('label', { text: 'Organization' }), select)
    : el('div', { class: 'org-switch' },
        el('label', { text: 'Organization' }),
        el('div', { style: { fontSize: '14px' }, text: owned[0]?.name ?? '' }));

  return el('aside', { class: 'sidebar' },
    el('div', { class: 'brand', text: 'NOSTIA' }, el('span', { text: 'Organization console' })),
    switcher,
    nav,
    el('div', { class: 'sidebar-foot' },
      el('div', { text: session.user?.username ?? '' }),
      el('button', {
        class: 'btn link',
        text: 'Sign out',
        onClick: async () => { await session.signOut(); render(); },
      }),
      el('div', { style: { marginTop: '10px' } },
        config.backend === 'mock'
          ? 'Sample data · no server connected'
          : el('code', { text: config.apiBaseURL }))));
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

window.addEventListener('hashchange', render);

mount(root, el('div', { class: 'signin' }, el('div', { class: 'card' }, spinner('Starting'))));
await session.restore();
await render();
