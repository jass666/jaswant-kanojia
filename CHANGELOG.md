# Changelog

All notable changes to this portfolio site are documented here.

## v1.2 — Admin panel, editable content, resume export (2026-09-14)

### Added
- `admin.html` — a private, Netlify Identity–gated panel to add/edit/remove
  Live Projects entries and edit resume data from a browser, committing
  straight to GitHub via a Netlify Function.
- Resume export: "Download Resume (.docx)" and "Download Resume (PDF)"
  buttons in the footer, driven by `data/resume-data.json`. DOCX is built
  client-side via the `docx` library; PDF uses a hidden print-styled view
  and the browser's native print-to-PDF — no server, no PDF library.
- `netlify/functions/projects.js` and `resume.js` — auth-checked GET/PUT
  endpoints backing the admin panel, using a repo-scoped GitHub token that
  never reaches the browser.
- `Push.ps1` / `Push_Launcher.bat` — one-click force-push of this repo
  from `D:\Projects\Websites\Jaswant` to `jass666/jaswant-kanojia`.

### Fixed
- Netlify Identity invite/recovery/confirmation emails always link to the
  site root, not `/admin.html`, so the widget never saw the token and the
  "create new password" step never appeared — only a login button did.
  `index.html` now detects `invite_token` / `recovery_token` /
  `confirmation_token` in the URL hash on load and forwards it straight to
  `/admin.html` before anything else runs.

### Changed
- The "Live right now" showcase grid no longer has hardcoded project
  cards — it now fetches and renders from `data/projects.json`, so new
  projects can be added without editing HTML.
- Reorganized static assets into `assets/css/`, `assets/js/`, and `data/`
  instead of sitting loose at the repo root.

## v1.1 — Live Projects showcase (2026-09-09)

### Added
- A "Live right now" showcase grid on the homepage linking directly to
  LeadForge, Cash Ledger, KZ Downloader, The Auction Manual, and all four
  dealership sites (LDE combined, Royal Enfield, Bajaj, Swift Trucks), each
  with a short description and a domain link.

### Removed
- Standalone changelog page (`changelog.html`) and its nav/footer links —
  replaced by this `CHANGELOG.md`.

## v1.0 — Initial portfolio launch

### Added
- Hero section with animated impact metrics (leads managed, GBP locations
  verified, assets tracked, dealership sites shipped).
- Brand scope strip covering Royal Enfield LDE, LDE Bajaj, and Swift Trucks.
- **Systems Built** section: LeadForge, Digital Asset Operations, Local
  Presence & GBP Framework, WhatsApp Campaign Infrastructure, Dealership
  Websites, and Caption Generator, each with problem/built/result framing.
- **Working Stack** section covering languages, databases, integrations,
  analytics/measurement, platforms, and content-production tools.
- **Open Source** tools table: KZ Downloader, The Auction Manual, Current
  Affairs Deck, Revision Notes Hub, shellref, Meeting Code Extractor,
  win-cache-cleaner, Cash Ledger.
- **Service Log** section covering experience, certifications, and education.
- Dark/light theme toggle with system-preference detection.
- Contact footer with email, phone, LinkedIn, GitHub, and location.
