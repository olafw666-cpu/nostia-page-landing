# Deploying nostia.io

This repo holds the **source**. A second, **public** repo holds only the built
output, and that is what GitHub Pages serves.

## Why the split

GitHub Pages will not serve from a private repo on the free Organization plan.
Rather than pay for GitHub Team, `.github/workflows/deploy.yml` builds here and
pushes `build/` to a public repo that Pages serves.

**Be clear about what this protects.** Everything Pages serves is world-readable
either way — including the console's raw ES modules under `/console/`, which are
shipped unbundled by design. What the split makes private is:

- commit history and issues
- the un-built React source (JSX, Tailwind config, comments)
- files that are never deployed: `CONSOLE.md`, this file, the workflow itself

It is not a security boundary for anything the site actually serves. If you want
the source private *and* a simpler pipeline, GitHub Team (~$4/user/month) lets
Pages serve a private repo directly and this whole arrangement goes away.

## One-time setup

**1. Create the public repo**

Create `olafw666-cpu/nostia-site` — public, empty, no README (the first deploy
writes the tree). To use a different name, change `PUBLIC_REPO` at the top of
`.github/workflows/deploy.yml`.

**2. Create a token scoped to that repo only**

GitHub → Settings → Developer settings → **Fine-grained personal access tokens**:

| Field | Value |
|---|---|
| Resource owner | `olafw666-cpu` |
| Repository access | **Only select repositories** → `nostia-site` |
| Permissions | **Contents: Read and write** |
| Expiration | Set a real one and calendar the rotation |

Fine-grained and single-repo matters: this token can push to the published site.
A classic `repo`-scoped token would be able to write to *every* repo in the org,
including the backend.

**3. Store it here**

This repo → Settings → Secrets and variables → Actions → New repository secret:

- Name: `SITE_DEPLOY_TOKEN`
- Value: the token

**4. Point Pages at the public repo**

On `nostia-site` → Settings → Pages:

- Source: **Deploy from a branch**
- Branch: `main`, folder `/ (root)`
- Custom domain: `nostia.io`
- Enforce HTTPS: on

`CNAME` lives in `public/CNAME` so it lands in every build — the domain does not
depend on a setting someone can clear by accident.

**5. Flip this repo to private**

This repo → Settings → General → Danger Zone → Change visibility → Private.

Do this **last**, after a deploy has succeeded, so you can watch the pipeline
work before removing the fallback.

**6. Turn off Pages on this repo**

Settings → Pages → Source: **None**. Two Pages sites claiming `nostia.io` will
fight over the domain.

## Day to day

Push to `main`. The workflow builds and publishes. Nothing else to do.

The deploy fails loudly rather than publishing a broken site if any of these are
missing from the build:

| File | Why the build fails without it |
|---|---|
| `build/CNAME` | Pages drops the custom domain on the next deploy |
| `build/.well-known/apple-app-site-association` | iOS passkeys stop working — the app is no longer authorized for the `nostia.io` relying party |
| `build/console/index.html` | The Orgs console 404s |

## Rollback

The public repo keeps one commit per deploy, so a bad publish is:

```bash
git clone https://github.com/olafw666-cpu/nostia-site
cd nostia-site
git revert HEAD && git push
```

Pages redeploys from the branch automatically.

## Known issue: AASA content-type

Pages serves `/.well-known/apple-app-site-association` as
`application/octet-stream`; Apple documents `application/json`. Pages has no
content-type configuration, so this cannot be fixed from here.

It affects **iOS passkeys only** — browser WebAuthn never reads the AASA, so the
console is unaffected. If iOS enrolment fails, this is the first thing to check.
The fix is a host that can set headers: Cloudflare in front of the domain with a
Transform Rule, or serving the site from the Azure VM, where Caddy sets it
correctly.
