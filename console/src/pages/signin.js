import { el, mount } from '../ui/dom.js';
import { notice } from '../ui/components.js';
import { config } from '../config.js';

export function renderSignIn(root, { session, onSignedIn }) {
  const errorSlot = el('div');

  const email = el('input', { type: 'email', name: 'email', autocomplete: 'username', required: true });
  const password = el('input', { type: 'password', name: 'password', autocomplete: 'current-password', required: true });
  const submit = el('button', { class: 'btn', type: 'submit', text: 'Sign in', style: { width: '100%' } });

  const form = el('form', {
    onSubmit: async (event) => {
      event.preventDefault();
      submit.disabled = true;
      submit.textContent = 'Signing in…';
      mount(errorSlot);
      try {
        await session.signIn(email.value.trim(), password.value);
        onSignedIn();
      } catch (error) {
        mount(errorSlot, notice('bad', 'Could not sign in', error.message));
        submit.disabled = false;
        submit.textContent = 'Sign in';
      }
    },
  },
    el('label', { class: 'field' }, el('span', { text: 'Email' }), email),
    el('label', { class: 'field' }, el('span', { text: 'Password' }), password),
    errorSlot,
    submit);

  // Single sign-on, when the server offers it. No server does today: the only provider was the
  // retired demo instance's MOCK one (off since 2026-10-06), and org.nostia.io answers 404, which
  // rest.js reads as "off". If a mock is ever on again, the button says "mock" in words: nobody
  // should read it as a real campus SSO integration, which is not built.
  const ssoSlot = el('div');
  session.backend.ssoConfig?.().then((sso) => {
    if (!sso?.enabled) return;
    const button = el('button', { class: 'btn ghost', type: 'button', style: { width: '100%' },
      text: `${sso.button_label || 'Single sign-on'}${sso.mock ? ' (mock)' : ''}`,
      onClick: async () => {
        button.disabled = true;
        mount(errorSlot);
        try {
          await session.beginSso();
          onSignedIn();
        } catch (error) {
          mount(errorSlot, notice('bad', 'Could not sign in', error.message));
          button.disabled = false;
        }
      } });
    mount(ssoSlot, el('div', { class: 'sso' },
      el('div', { class: 'divider', text: 'or' }),
      button,
      sso.mock ? el('p', { class: 'small muted', text: 'Mock identity provider for the demo — every identity on it is fabricated.' }) : null));
  }).catch(() => { /* no SSO on this host */ });

  const card = el('div', { class: 'card' },
    el('div', { class: 'brand', text: 'NOSTIA', style: { marginBottom: '18px' } },
      el('span', { text: 'Orgs' })),
    el('p', { text: 'Attendance, clubs and campus programming for your school — and the walking adventures it publishes.' }),
    form,
    ssoSlot);

  // There is no self-serve signup: accounts are provisioned per organization. Without this,
  // a buyer's first experience of the console is a sign-in form with no way in. (A "See a demo"
  // link to ?backend=mock sat here until 2026-10-06; the demo is now a real sign-in.)
  card.append(notice('info', 'No account yet?',
    'Organization accounts are set up with you directly rather than self-serve.'),
  el('p', { class: 'signin-links' },
    el('a', { href: config.salesContact, text: 'Talk to us' })));

  mount(root, el('div', { class: 'signin' }, card));
}
