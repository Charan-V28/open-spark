# Open Spark security review

This is an implementation review of the current static MVP, not a penetration test, audit certification, or guarantee that the service is secure. It uses the saved reels as prompts for review and checks implementation choices against the OWASP Top 10 and ASVS guidance.

## Controls present in this build

- Vercel and the local preview send a Content Security Policy that disallows inline scripts, restricts connections to the same origin and the configured Supabase project, blocks framing, and disables plugins and embedded frames.
- Responses set `nosniff`, frame denial, a restrictive referrer policy, a limited Permissions Policy, and same-origin COOP/CORP. Vercel also sets HSTS because deployment is HTTPS.
- User supplied notes and generated content are escaped before HTML insertion; study documents are processed in the browser, with a 5 MB input limit and a 5,000-character working limit. The app does not upload study files.
- The Supabase publishable key is public by design. A Supabase secret/service-role key or private API credential must never be added to frontend code or committed files.
- Current app state is local to the browser. The account gate does not authorize static files or private server data; do not treat it as a security boundary.

## Before real student use or private cloud data

1. Move to a server-aware auth architecture and verify the user on every protected server/API request. Supabase documents cookie/PKCE patterns for SSR and request-scoped server clients.
2. Add a database schema with Row Level Security enabled on every student-owned table, deny-by-default policies, and tests proving one account cannot read or change another account's rows. Never use a service-role key in a browser.
3. Replace session handling with a maintained Supabase client/server integration; the current hand-written browser auth stores bearer/refresh tokens in `sessionStorage`, which JavaScript can read if an XSS bug is introduced.
4. Complete a threat model, dependency and supply-chain review (including vendored PDF.js), abuse/rate-limit monitoring, security incident process, account export/deletion, privacy/legal review for minors, and a security test of production configuration.
5. Review response headers and Supabase redirect/origin allowlists whenever domains or integrations change. Keep Vercel's deployment protection enabled until the real-account and privacy flows have been reviewed.

## Reporting

For suspected security issues, contact the project owner at `Bcharan.van@gmail.com`. Do not include student records, passwords, access tokens, or private keys in a report.

## Reference material

- OWASP [Top 10:2025](https://owasp.org/Top10/2025/)
- OWASP [Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
- Supabase [Auth server-side guidance](https://supabase.com/docs/guides/auth/server-side)
- Supabase [Auth and Row Level Security overview](https://supabase.com/docs/guides/auth)
- Vercel [Response headers](https://vercel.com/docs/headers/response-headers)
