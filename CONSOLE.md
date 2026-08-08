# Nostia Orgs — Console

The desktop surface for organization **owners**: billing and analytics.

Lives at [`public/console/`](public/console) in this repo and deploys to **https://nostia.io/console/**
with the rest of the site — CRA copies `public/` into the build untouched, so the console needs no
build step of its own and no second pipeline.

It talks to the org backend at **https://org.nostia.io/api** (Azure VM). That is a different host
from `api.nostia.io`, which is the consumer backend on the DigitalOcean droplet and serves none of
these routes. Console and API therefore sit on different origins, which is why the backend carries
an allowlist CORS middleware naming `https://nostia.io`.

Both environment-dependent values live in
[`public/console/src/config.js`](public/console/src/config.js).

---

## Run it

Native ES modules, no build step, no dependencies. It needs to be *served* (module imports are
blocked on `file://`), not opened from disk:

```bash
npm start              # CRA dev server serves public/ too — open /console/
npm run smoke          # 52 contract assertions, no DOM, no network
```

`?backend=mock` flips it to the built-in sample data — any email and password will do, and every
figure is invented. That is the demo path; the default is now the real backend.

## Accounts

There is no self-serve signup. Provision an owner on the backend host:

```bash
sudo -u nostia env DB_PATH=/var/data/nostia/nostia_pivot.db \
  node /srv/nostia/scripts/create_org_admin.js \
  --email owner@example.org --org "Their Organization" --password-stdin < secret.txt
```

---

## Scope, and why it stops there

Four pages: **Overview**, **Analytics**, **Distribution**, **Plan and billing**.

Authoring is *not* here, and that is a decision rather than a gap. Anchoring a stop means standing
at it with a camera — a geofence dropped from a desk chair is how you end up with a pin in the wrong
courtyard and a tour that fails verification for everyone. The two things that genuinely happen at a
desk are *is this working* and *what are we paying for it*, and those are what this console does.

**Owner-only.** Billing routes are owner-only server-side, so an admin would land on a dashboard
whose primary action 403s. The console checks the role and explains, rather than showing a broken
screen — a UX gate, not a security one. The server stays the authority.

---

## Pointing it at a backend

Every page talks to one object; no page calls `fetch`.

```js
// src/config.js
backend: 'rest',
apiBaseURL: 'https://your-host/api',
```

| Your backend… | Change |
|---|---|
| speaks `docs/BACKEND_CONTRACT.md` | nothing else |
| same operations, different URLs | [src/api/routes.js](src/api/routes.js) — every path, one file |
| different payload shapes | [src/api/rest.js](src/api/rest.js) |
| isn't HTTP (GraphQL, Firebase, …) | write a third object with the methods listed in [src/api/backend.js](src/api/backend.js) |

[`MockBackend`](src/api/mock.js) is a full second implementation and proves the seam is real — the
pages cannot tell which one they are running on.

---

## Things that look like bugs and are not

**"Needs 5+" instead of a number.** Figures covering fewer than five distinct people are suppressed
server-side; an aggregate over three people on a small campus is a name. Rendering that as `0` would
tell an organization their tour is broken when it is merely new — same data, opposite conclusion,
so the two never share a rendering.

**Percentages always show their denominator.** "100%" over two runs is not a completion rate.

**No prices anywhere.** Price and interval live in Stripe, resolved at runtime from a lookup key.
When a tier has no price configured, checkout returns 501 and the page says so — a placeholder
number is a claim about what someone is agreeing to pay.

**Checkout opens a new tab and grants nothing.** Subscription state is written by the Stripe webhook
and nothing else. Returning re-reads status; a client-reported "success" means nothing.

**A failed payment takes nothing offline.** The banner says so explicitly, because it changes how
urgently an org treats it. Printed QR codes keep working; what pauses is publishing something new.

**The sample data has an organization whose numbers are all hidden.** That's the state a brand-new
tour is in for its first weeks. If the console is illegible there, the customer concludes the product
is broken before it has had a chance to work.

---

## Layout

```
index.html            no framework, no bundler
styles.css            light + dark, desktop-first
src/
  config.js           backend switch, base URL, required role
  api/
    backend.js        the seam — the method list both implementations satisfy
    routes.js         every path template
    rest.js           HTTP, with refresh-once-then-sign-out
    mock.js           in-memory second implementation
    errors.js         ApiError; 402 and 501 are never flattened
  state/session.js    identity, owner gate, selected organization
  ui/                 el() builder, components, funnel
  pages/              signin · overview · analytics · distribution · billing
```

Tokens live in `sessionStorage`, not `localStorage`: a billing console on a shared machine should
not leave a usable token behind after the tab closes.
