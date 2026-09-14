# Portfolio upgrade — setup guide

This package adds three things to your portfolio:

1. **Resume export** — "Download Resume (.docx)" and "Download Resume (PDF)"
   buttons, driven by `resume-data.json`.
2. **Editable project grid** — the "Live right now" section now renders
   from `projects.json` instead of hardcoded HTML.
3. **Admin panel** (`/admin.html`) — a private, login-gated page to edit
   both of the above from a browser, with changes committed straight
   to GitHub.

Everything is wired together already: edit a field in the admin panel,
save, and both the live site *and* the resume export reflect it after
Netlify's next auto-deploy (usually 30–60 seconds).

---

## Before you start: a hosting note

Your other tools sit on Cloudflare Pages, but this portfolio
(`kzjaswan.netlify.app`, per its `sitemap.xml`) is on **Netlify**.
The admin panel's access-control is built on **Netlify Identity**
(invite-only login) and a **Netlify Function**, rather than Cloudflare
Access — Access needs your DNS proxied through Cloudflare, which
doesn't apply to a `.netlify.app` site. Functionally this gives you
the same thing: a `/admin` page only you can actually use, and a
GitHub write-credential that never reaches the browser.

Netlify Identity was briefly marked deprecated in 2025 and then
un-deprecated in Feb 2026 — it's currently a supported, no-extra-cost
feature. If you'd rather not depend on it long-term, moving this one
site to Cloudflare Pages later is a short job (same as your other
static sites), and the Cloudflare Access version of this same plan
would drop in with only the auth-check lines in the two Functions
changing.

---

## What's in this zip

```
index.html                          modified — live-projects grid + resume export buttons wired in
admin.html                          the admin panel (Netlify Identity gated)
netlify.toml                        tells Netlify where the Functions live
Jaswant_Kanojia_Resume.docx         a sample export, pre-generated and visually verified, for reference
SETUP.md                            this file

assets/
  css/
    resume-print.css                print stylesheet the PDF export uses
    admin.css                       admin panel styling
  js/
    resume-export.js                client-side DOCX + PDF export logic
    admin.js                        admin panel logic (login, forms, save)

data/
  projects.json                     content behind the Live Projects grid
  resume-data.json                  content behind the resume PDF/DOCX export

netlify/
  functions/
    _github.js                      shared GitHub Contents API helper
    projects.js                     GET/PUT data/projects.json, auth-checked
    resume.js                       GET/PUT data/resume-data.json, auth-checked
```

Only `index.html` and `admin.html` have to sit at the repo root —
everything else can move freely as long as the paths inside those two
files (and the two `PATH` constants in the Functions) move with it.

---

## Setup steps

### 1. Add the files to your repo
Copy this whole folder structure into the root of your portfolio
repo, replacing the existing `index.html`. Keep the folders as-is —
`assets/`, `data/`, and `netlify/` all sit alongside `index.html` and
`admin.html` at the repo root. Commit and push — Netlify redeploys
automatically, same as it does now.

### 2. Create a GitHub token (repo-scoped, contents only)
GitHub → Settings → Developer settings → Fine-grained tokens →
Generate new token.
- Resource owner: `jass666`
- Repository access: **Only select repositories** → your portfolio repo
- Permissions: **Contents → Read and write**. Nothing else.
- Copy the token once — you won't see it again.

### 3. Add environment variables in Netlify
Site settings → Environment variables → add:

| Key | Value |
|---|---|
| `GITHUB_TOKEN` | the token from step 2 (mark as secret) |
| `GITHUB_OWNER` | `jass666` |
| `GITHUB_REPO` | your repo name — see note below |
| `GITHUB_BRANCH` | `main` |
| `ADMIN_EMAIL` | `jaswantkanojia04@gmail.com` |

> `GITHUB_REPO` is assumed to be `jaswant-kanojia` (from the zip
> filename `jaswant-kanojia-main.zip`, which is what GitHub names a
> zip download of a repo called `jaswant-kanojia` on branch `main`).
> If that's not the actual repo name, just correct the env var —
> nothing else changes.

### 4. Turn on Netlify Identity, invite only yourself
Site settings → Identity → Enable Identity.
- Registration preferences → **Invite only** (not open — this is
  what makes `/admin` exclusive to you)
- Identity → Invite users → invite `jaswantkanojia04@gmail.com`,
  accept the invite email, set a password.

### 5. Test it
Visit `yoursite.netlify.app/admin.html`, log in, edit a project or a
resume field, hit Save. Check GitHub — a new commit should land on
the repo within seconds. Give the site ~30–60 seconds to rebuild,
then check the live page and try both resume download buttons.

---

## How the admin panel stays exclusive
- `admin.html` is technically reachable by anyone (Netlify's free
  tier has no path-level lockout), but useless without a login: no
  session, no data loads, no save button does anything.
- Even someone who found the Function URLs directly
  (`/.netlify/functions/projects`) can't use them — every request is
  checked against `context.clientContext.user`, which Netlify only
  populates from a valid Identity JWT, and only your one invited
  account has one. The `ADMIN_EMAIL` check is a second layer on top.
- The GitHub token that can actually write to your repo never reaches
  the browser — it exists only inside the Function's environment on
  Netlify's servers.

## How the resume export works
- Both buttons read the same `data/resume-data.json` — no duplicate
  content to keep in sync.
- **.docx** — built in-browser using the `docx` library (loaded from
  a CDN, no build step), then downloaded directly.
- **PDF** — no PDF library at all. The same data renders into a
  hidden, precisely-styled view (`resume-print.css`), then
  `window.print()` opens the browser's native print dialog with
  "Save as PDF" as the natural choice. Typography stays exact because
  it's real CSS, not an approximation.
- `Jaswant_Kanojia_Resume.docx` in this zip is a pre-generated sample
  from the same data/layout logic, rendered and checked page-by-page
  against your original template — useful as a reference if you ever
  want to confirm the live export still matches.

## Known gaps, worth knowing about
- **Reordering projects** — right now means remove + re-add in the
  new order. Drag-and-drop reordering is a small addition if you want
  it later.
- **Live round-trip untested** — the code is syntax-checked and both
  JSON files validate, but I couldn't stand up an actual Netlify
  deployment from here to exercise the real GET/PUT/GitHub-commit
  flow end-to-end. Worth doing the walkthrough above once and letting
  me know if anything errors.
- **Font rendering** — the sample `.docx` was rendered with
  LibreOffice for verification; Word and your browser's print engine
  may shift spacing by a pixel or two. Worth a quick look once it's
  live, though the underlying structure is identical.
