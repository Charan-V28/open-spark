# Launchpad demo

A dependency-free web prototype for the student opportunity and study platform. The sign-in screen supports Supabase Auth when configured; the default local preview uses an explicitly local-only demo identity. This is not yet a production service.

## Run locally

Requires Node.js 20 or newer. No package install is needed.

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
- Four beginner project guides with steps and safety notes.
- Local-only `.txt` notes preview and sentence-based flashcard/quiz demo. Files are read in the browser and never uploaded.
- Original SAT-aligned example questions, skill filtering, explanations, and direct links to official College Board and Khan Academy resources.
- Local browser save controls and a clear-local-data action.
- Sign-up/sign-in screen backed by Supabase Auth's public auth endpoints when configured; email confirmation should be enabled in the Supabase project.
- Locally scoped saved state, account settings, sign-out, and preview legal notices.
- Vercel static deployment configuration and security headers.
- Live discovery links that open Indeed, LinkedIn, VolunteerMatch, and AmeriCorps at the source.

## Connect Supabase Auth

1. Create a Supabase project and configure its Auth email/password provider.
2. In Auth URL Configuration, add your local and future Vercel URLs to the allowed redirect URL list and set the production site URL.
3. Copy the project URL and publishable key (formerly anon key) into `auth-config.js` as `supabaseUrl` and `supabasePublishableKey`. These values are intentionally public browser configuration. **Never put a Supabase service-role key in this file.**
4. Keep `allowLocalPreview: true` only for local development; the preview control is hidden on Vercel/non-local hosts. Set `enableAccountCreation: true` only after final Terms/Privacy review, age/consent decisions, and support details are complete. It is false by default.
5. Before public student use, replace the draft Terms and Privacy Notice with reviewed documents and add server-side authorization, account deletion, and database policies.

The current account gate is client-side and the app data is still local to each browser. It is a working sign-in prototype, not a security boundary for private server data. Do not add private cloud data or uploads until server-side session verification and per-user Row Level Security (RLS) are implemented and tested.

## Indeed and LinkedIn data

The app does not scrape or copy either service. Indeed's documented APIs are partner-integrated and primarily support employer/job-posting and related workflows; a job-retrieval service can require explicit access. LinkedIn API permissions and partner access are restricted, and LinkedIn's User Agreement prohibits scraping/copying service content without permission. The current MVP therefore opens the providers directly so students can see current listings on the source sites. A future in-app feed requires written/API access and approved scopes from each provider. VolunteerMatch and AmeriCorps are also linked at the source rather than mirrored.

## Important limitations

- Opportunity cards are discovery starting points, not a verified, exhaustive, or live directory. Recheck eligibility, deadlines, costs, and availability with the linked provider.
- Study generation is deterministic demo behavior, not AI. Only `.txt` files up to 1 MB are supported; extracted notes are limited to 5,000 characters.
- There is no database, backend upload, admin console, live moderation, or production deletion/export workflow. Saved state uses this browser's `localStorage`; clear it on shared devices.
- Supabase authentication must be configured before real sign-up/sign-in works. The local preview identity is not a real account and only appears on localhost or `file://`.
- Although Supabase accounts can be real when configured, saved opportunities and progress are not synced to a server, account deletion is not implemented, and the browser-only gate is not server-side authorization.
- The app is not affiliated with College Board. Its SAT practice items are original examples and are not official SAT questions.
- Before real student accounts, document uploads, or school use, complete the legal, privacy, security, content-review, and operational work described in the product plan.

## Vercel

Set this folder (`outputs/launchpad-site`) as the Vercel project root and deploy it as a static site. The included `vercel.json` adds baseline response security headers. Configure Supabase Auth allowed redirect URLs and `auth-config.js` before enabling account creation. Public student use still requires a server-aware auth/data architecture and legal/privacy review; the static client-side gate is not access control for private backend resources.
