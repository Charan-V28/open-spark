# Open Spark demo

A dependency-free web prototype for Open Spark, a student opportunity and study platform. Email/password registration and sign-in use the configured Supabase Auth project. The local preview uses a clearly marked local-only demo identity. This is not yet a production service.

## Run locally

Requires Node.js 20 or newer. No package installation is needed.

```powershell
npm start
```

Then open `http://127.0.0.1:4173`.

Run the automated structural checks with:

```powershell
npm test
```

## What's included

- Responsive home screen with low-pressure private missions and path cards.
- Searchable category filters, beginner toggle, opportunity discovery links, detail panels, and save/status tracking.
- Twenty curated opportunity and source starting points, with high-school-only filtering for internship listings, randomized ordering, and a refresh button. The cards link to providers; these are not live job listings, and random ordering does not create new offers.
- Eight beginner project guides with steps and safety notes, plus a separate independent-research area with eight ethical, beginner-friendly research plans.
- A certificates and badges directory that distinguishes issuer-awarded learning badges from paid industry exams.
- Local file extraction for selectable text in PDF, DOCX, PPTX, XLSX, EPUB, ODT, RTF, and common text/code formats, plus term/definition-aware flashcards and quizzes when the source has that structure. PDF text is extracted locally with vendored Mozilla PDF.js (Apache-2.0); Office and other document files are also processed in-browser and never uploaded. A study set uses up to 5,000 extracted characters. Scanned PDFs, images/OCR, legacy binary Office files, encrypted files, and malformed documents may not extract.
- Profile settings for a local display name, a retakeable interests check-in that reorders discovery, dark/light mode, and local data controls. The home date uses the device's current locale and updates on its own.
- A public feedback link to the contact address supplied by the project owner: `Bcharan.van@gmail.com`.
- 12 original SAT-aligned Reading and Writing questions and 12 original Math questions across a range of skills, with filtering, explanations, and direct links to official College Board and Khan Academy resources. This is a starter bank, not the large adaptive question library envisioned for a later production release.
- Local browser save controls and a clear-local-data action.
- Visible create-account/sign-in switch backed by Supabase Auth's public auth endpoints when configured; email confirmation should be enabled in the Supabase project. The create-account form remains visible while auth is unconfigured and explains what setup is missing.
- Locally scoped saved state, account settings, sign-out, and preview legal notices.
- Vercel static deployment configuration and security headers.
- Live discovery links that open Indeed, LinkedIn, VolunteerMatch, and AmeriCorps at the source.

## Supabase Auth setup

1. The supplied Supabase project URL and publishable key are in `auth-config.js`. They are public browser settings; **never put a Supabase secret/service-role key in this file or in the browser**.
2. Supabase's public Auth settings currently report email/password enabled, sign-ups allowed, and email confirmation required.
3. In Supabase Auth > URL Configuration, set the Site URL to `https://launchpad-site-rho.vercel.app` and allow these redirect patterns: `http://localhost:4173/**`, `http://127.0.0.1:4173/**`, `https://launchpad-site-rho.vercel.app/**`, and Vercel previews `https://*-bcharanvan-4576s-projects.vercel.app/**`. Supabase rejects confirmation/reset redirects that are not on this list. The production alias currently retains its older `launchpad-site` name after the Vercel project was renamed to `open-spark`.
4. `enableAccountCreation` is enabled for the Vercel-protected test deployment so a test user can register, confirm email, then sign in. The browser flow returns newly registered users to sign in instead of silently signing them in.
5. `allowLocalPreview: true` is only for local development; its bypass button is hidden on Vercel/non-local hosts.
6. Before making the site public to students, replace the draft Terms and Privacy Notice with reviewed documents, finish age/guardian and support decisions, and implement account deletion and server-side authorization/data policies.

The current account gate is client-side, and the app data is still local to each browser. Supabase handles credentials; Open Spark never stores passwords. This is a working sign-in prototype, not a security boundary for private server data. Do not add private cloud data or uploads until server-side session verification and per-user Row Level Security (RLS) are implemented and tested.

See [SECURITY.md](./SECURITY.md) for the current security review, implemented response protections, and requirements before real student accounts or private cloud data.

## Indeed and LinkedIn data

The app does not scrape or copy either service. Indeed's documented APIs are partner-integrated and primarily support employer/job-posting and related workflows; a job-retrieval service can require explicit access. LinkedIn API permissions and partner access are restricted, and LinkedIn's User Agreement prohibits scraping/copying service content without permission. The current MVP therefore opens the providers directly so students can see current listings on the source sites. A future in-app feed requires written/API access and approved scopes from each provider. VolunteerMatch and AmeriCorps are also linked at the source rather than mirrored.

## Important limitations

- Opportunity cards are discovery starting points, not a verified, exhaustive, or live directory. Recheck eligibility, deadlines, costs, and availability with the linked provider.
- Study generation is deterministic demo behavior, not AI. Only `.txt` files up to 1 MB are supported; extracted notes are limited to 5,000 characters.
- There is no database, backend upload, admin console, live moderation, or production deletion/export workflow. Saved state uses this browser's `localStorage`; clear it on shared devices.
- Account creation is enabled for the protected preview and requires email/password, age/notice consent, and email confirmation when Supabase is configured as described above. The Supabase redirect allowlist must include the URL being tested. Do not expose the deployment publicly until the draft policies and privacy review are complete. The local preview identity is not a real account and only appears on localhost or `file://`.
- Although Supabase accounts can be real when configured, saved opportunities and progress are not synced to a server, account deletion is not implemented, and the browser-only gate is not server-side authorization.
- The app is not affiliated with College Board. Its SAT practice items are original examples and are not official SAT questions.
- The source directory and credential links are not automatically refreshed or endorsed. Verify every deadline, price, age/grade rule, and current availability at the issuer before applying.
- Before real student accounts, document uploads, or school use, complete the legal, privacy, security, content-review, and operational work described in the product plan.

## Name and deployment

The product and Vercel project are named **Open Spark**. The connected GitHub repository is [Charan-V28/open-spark](https://github.com/Charan-V28/open-spark). Vercel's existing production alias is still `https://launchpad-site-rho.vercel.app`; the current preview URL is shared separately because each preview deployment gets its own URL. Vercel authentication currently protects deployment URLs.

## Vercel

Set this folder (`outputs/launchpad-site`) as the Vercel project root and deploy it as a static site. The included `vercel.json` adds baseline response security headers. The current Vercel deployment is protected by Vercel authentication while account flows are tested. Public student use still requires a server-aware auth/data architecture and legal/privacy review; the static client-side gate is not access control for private backend resources.

## Automated opportunity updates

The current cards are a locally curated source directory. The page can shuffle them, but it does not fetch new openings or remove expired deadlines. A reliable automated feed needs a server-side scheduled job, licensed/official source connectors, a database, review rules, and expiry handling. Google Custom Search JSON API is closed to new customers, and Google says it will be discontinued on January 1, 2027; it is not a good new integration to build around. A Google API key alone would return search results, not verified high-school internship records. Do not paste a key into chat or browser code. If a future connector needs a secret, store it in a local `.env` for local development and Vercel Environment Variables for deployment; keep it server-only and out of `NEXT_PUBLIC_*` variables and Git.

For high-school-only internships, ingest explicit education-level and grade/age eligibility from each provider, preserve the provider URL and checked date, and exclude records unless the high-school rule is verified. A text classifier can assist staff but must not decide eligibility by itself. The scheduled job should mark a listing expired when its deadline passes, hide records with unknown/stale status from “open now,” and keep historical records for audit. Do not scrape LinkedIn or Indeed; use only their approved partner APIs or licensed feeds. See the product plan for a proposed ingestion schema and Vercel/Supabase architecture.

## Tasks & Focus prototype

The authenticated app now includes a local task-planning view. It supports All Tasks, My Day, Upcoming, Inbox, Work, Personal, Starred, and Completed lists; task search; natural-language dates (`today`, `tomorrow`, `next monday`, `in 3 days`); priorities (`!p1` / `!high`, `!p2`, `!p3`); tags (`#work`); and estimates (`30m`, `1h`). Tasks can be completed, starred, edited, deleted, ordered by drag and drop or move buttons, split into subtasks, and selected for a 25-minute focus timer. Analytics summarize completions recorded in this browser.

Task data is stored in localStorage under the current account ID, so it stays in this browser and is not yet synchronized across devices. The Gmail inbox card, Google account/workspace switcher, and Drive attachment label are explicitly sample UI; they do not call Google APIs, access email, or read Drive files. Real integration requires Google OAuth consent, narrowly scoped Gmail/Drive APIs, secure server-side token handling, and a separate privacy/security review before student use.
