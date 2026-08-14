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

  const card = el('div', { class: 'card' },
    el('div', { class: 'brand', text: 'NOSTIA', style: { marginBottom: '18px' } },
      el('span', { text: 'Orgs' })),
    el('p', { text: 'Billing and analytics for the adventures your organization publishes.' }),
    form);

  if (config.backend === 'mock') {
    // Reachable via ?backend=mock. Saying so here stops the reasonable assumption that the
    // numbers on the next screen came from somewhere real.
    card.append(notice('info', 'Demo tour — sample data',
      'This signs you in as Demo University Student Affairs. Any email and password will do, '
      + 'and every figure is invented. Drop the ?backend=mock from the URL to sign in to your '
      + 'real organization.'));
    // Prefilled so the tour is one click. The mock accepts any non-empty email; this
    // only removes a form-filling step from a demo that is often driven one-handed,
    // and the credentials are the seeded demo account's, not anyone's real ones.
    email.value = 'demo-user-admin@demo.invalid';
    password.value = 'demo';
  } else {
    // There is no self-serve signup: accounts are provisioned per organization. Without this,
    // a buyer's first experience of the console is a sign-in form with no way in.
    card.append(notice('info', 'No account yet?',
      'Organization accounts are set up with you directly rather than self-serve.'),
    el('p', { class: 'signin-links' },
      el('a', { href: config.salesContact, text: 'Talk to us' }),
      el('span', { class: 'sep', text: '·' }),
      el('a', { href: '?backend=mock', text: 'See a demo' })));
  }

  mount(root, el('div', { class: 'signin' }, card));
}
