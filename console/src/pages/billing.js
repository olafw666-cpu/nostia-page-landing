import { config } from '../config.js';
import { el, mount, formatDate } from '../ui/dom.js';
import { spinner, errorState, section, statusPill, notice, detailRow } from '../ui/components.js';

/**
 * Plan and billing.
 *
 * Two rules this page exists to hold, both of which a later "improvement" would break:
 *
 * 1. **No price is displayed that this console invented.** Price and billing interval live in
 *    Stripe and are resolved at runtime from a lookup key. When a tier has no price configured,
 *    checkout returns 501 and the page says exactly that — a placeholder number would be a
 *    statement about what the organization is agreeing to pay.
 * 2. **The client never grants entitlement.** Checkout opens Stripe in a new tab; coming back
 *    re-reads status from the server. Subscription state is written by the webhook and by nothing
 *    else, so a client-reported "success" means nothing.
 */
export async function renderBilling(root, { session, navigate }) {
  const orgId = session.orgId;
  mount(root, spinner('Loading plan'));

  let billing;
  try {
    billing = await session.backend.billingStatus(orgId);
  } catch (error) {
    mount(root, errorState(error, { onRetry: () => renderBilling(root, { session, navigate }) }));
    return;
  }

  const page = el('div');
  page.append(el('h1', { text: 'Plan and billing' }));
  page.append(el('p', { class: 'lede', text: session.organization?.name ?? '' }));

  // `can_publish` is the entitlement gate's own answer, and it is not always
  // inferable from `status`: an expired trial still reads "trialing", because
  // nothing in Stripe ever moved it. Trusting the label would show an enabled
  // Publish button that 402s.
  if (billing.can_publish === false && billing.status !== 'past_due') {
    page.append(notice('warn',
      billing.blocked_reason === 'trial_expired' ? 'Your trial has ended' : 'Publishing is paused',
      'Everything already published stays live — a printed QR code in the physical world has to keep working. What has stopped is publishing anything new and using the assistant.',
      { label: 'Talk to us about a plan', onClick: () => window.open(config.salesContact, '_blank', 'noopener') }));
  }

  if (billing.status === 'past_due') {
    page.append(notice('warn', 'Last payment failed',
      'Nothing has gone offline. Everything already published stays live — a printed QR code in the physical world has to keep working — but new publishes and assistant drafts are paused until the payment succeeds.',
      billing.configured ? { label: 'Update payment method', onClick: () => openPortal(session, page) } : null));
  }

  if (!billing.configured) {
    // The honest state of the product today: no Stripe key, no configured price. Better than a
    // checkout button that dead-ends in a 503.
    page.append(notice('info', 'Self-serve billing isn’t switched on yet',
      'Plans are still being set up. Get in touch and we’ll put your organization on the right one.',
      { label: 'Contact us', onClick: () => window.open(config.salesContact, '_blank', 'noopener') }));
  }

  // Admins can read the plan — knowing which tier they are authoring against is exactly what
  // explains a 402 — but checkout and the billing portal are requireOrgOwner server-side, so the
  // buttons that would 403 are not rendered for them.
  if (!session.isOwner) {
    page.append(notice('info', 'You can see the plan, but not change it',
      'Changing the plan or opening the payment portal is done by the organization owner.'));
  }

  page.append(currentPlanCard(billing, session, page));
  page.append(section('Plans', 'Feature comparison. Pricing is confirmed with us directly.',
    el('div', { class: 'grid grid-2' }, ...TIERS.map((tier) => tierCard(tier, billing, session, page)))));

  page.append(el('div', { class: 'card' },
    el('h3', { text: 'How billing works here' }),
    el('p', { class: 'small muted',
      text: 'Payment is taken by Stripe. Your subscription state comes from Stripe directly — this console never sets it, so returning from a payment page simply re-reads what Stripe recorded.' }),
    el('p', { class: 'small muted',
      text: 'Cancelling never takes a published adventure offline. Printed signs keep working; what stops is publishing anything new.' })));

  mount(root, page);
}

function currentPlanCard(billing, session, page) {
  const card = el('div', { class: 'card' });

  card.append(el('div', { class: 'row', style: { marginBottom: '14px' } },
    el('div', {},
      el('h2', { text: billing.label, style: { marginBottom: '4px' } }),
      el('span', { class: 'small muted', text: renewalText(billing) ?? '' })),
    statusPill(billing.status)));

  const e = billing.entitlements;
  card.append(detailRow('Published adventures',
    `${billing.usage?.published_adventures ?? 0} of ${limitText(e.adventures)}`));
  card.append(detailRow('Stops per adventure', limitText(e.stops)));
  card.append(detailRow('Custom branding', e.custom_branding ? 'Included' : 'Not included'));
  card.append(detailRow('Invite codes and printable QR', e.invite_codes ? 'Included' : 'Not included'));
  card.append(detailRow('CSV export', e.csv_export ? 'Included' : 'Not included'));
  card.append(detailRow('Assistant drafts', e.assist_calls_per_day == null ? '—' : `${e.assist_calls_per_day} a day`));
  if (billing.seats != null) card.append(detailRow('Seats', String(billing.seats)));

  if (billing.configured && session.isOwner) {
    card.append(el('div', { style: { marginTop: '16px' } },
      el('button', {
        class: 'btn ghost',
        text: 'Manage billing on Stripe',
        onClick: () => openPortal(session, page),
      })));
  }
  return card;
}

function tierCard(tier, billing, session, page) {
  const isCurrent = tier.id === billing.tier;
  const card = el('div', { class: `tier${isCurrent ? ' current' : ''}` });

  card.append(el('h3', {}, el('span', { text: tier.label }),
    isCurrent ? statusPill('active') : el('span')));
  card.append(el('p', { class: 'small muted', text: tier.blurb }));
  card.append(el('ul', {}, ...tier.features.map((feature) => el('li', { text: feature }))));

  if (!isCurrent && session.isOwner) {
    const status = el('div', { style: { marginTop: '12px' } });
    const button = el('button', {
      class: 'btn link',
      text: billing.purchasable ? `Choose ${tier.label}` : `Ask about ${tier.label}`,
      onClick: async () => {
        button.disabled = true;
        mount(status);
        try {
          const checkout = await session.backend.startCheckout(session.orgId, tier.id);
          // Opened in a new tab, not navigated to in place — losing the console mid-payment is a
          // worse experience than a second tab, and the return leg has to land somewhere.
          window.open(checkout.url, '_blank', 'noopener');
        } catch (error) {
          mount(status, error.kind === 'not-purchasable'
            ? notice('info', 'Not available for self-serve purchase yet',
                `${error.message} Get in touch and we'll set it up for your organization.`,
                { label: 'Contact us', onClick: () => window.open(config.salesContact, '_blank', 'noopener') })
            : notice('bad', 'Could not start checkout', error.message));
        }
        button.disabled = false;
      },
    });
    card.append(button, status);
  }
  return card;
}

async function openPortal(session, page) {
  try {
    const portal = await session.backend.billingPortal(session.orgId);
    window.open(portal.url, '_blank', 'noopener');
  } catch (error) {
    page.prepend(notice('bad', 'Could not open the billing portal', error.message));
  }
}

function renewalText(billing) {
  const date = formatDate(billing.current_period_end);
  if (!date) return null;
  if (billing.status === 'canceled') return `Access ends ${date}`;
  if (billing.status === 'past_due') return `Period ended ${date}`;
  return `Renews ${date}`;
}

const limitText = (value) => (value == null ? 'Unlimited' : String(value));

/**
 * Feature rows only. **No prices** — they live in Stripe, are resolved at runtime, and are not
 * knowable to this console.
 */
const TIERS = [
  {
    id: 'trial',
    label: 'Trial',
    blurb: 'Take one adventure all the way through.',
    features: ['1 published adventure', '5 stops', 'Analytics', '3 assistant drafts a day'],
  },
  {
    id: 'standard',
    label: 'Standard',
    blurb: 'For a single programme or campaign.',
    features: ['5 published adventures', '15 stops', 'Analytics', 'Custom branding',
               'Invite codes and printable QR', '20 assistant drafts a day'],
  },
  {
    id: 'institutional',
    label: 'Institutional',
    blurb: 'For a whole organization.',
    features: ['Unlimited adventures', 'Unlimited stops', 'Analytics', 'Custom branding',
               'Invite codes and printable QR', 'CSV export', 'Multiple admins',
               '100 assistant drafts a day'],
  },
];
