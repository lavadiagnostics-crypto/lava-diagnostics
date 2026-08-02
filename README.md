# LAVA Diagnostics

**Independent Third-Party Laboratory Testing** — a production-ready platform for
an analytical laboratory that tests research peptides and issues Certificates of
Analysis that anyone holding one can independently verify.

Built with Next.js 15 (App Router), TypeScript, Tailwind, Prisma, PostgreSQL and
Auth.js.

---

## Contents

- [What this is](#what-this-is)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [The security model](#the-security-model) ← **read before changing verification**
- [Architecture](#architecture)
- [Deploying to Vercel](#deploying-to-vercel)
- [Supabase Storage setup](#supabase-storage-setup)
- [Operational runbook](#operational-runbook)
- [Known gaps](#known-gaps)

---

## What this is

| Area | Routes |
| --- | --- |
| **Marketing** | `/`, `/about`, `/services`, `/pricing`, `/knowledge-base`, `/contact`, `/legal/*` |
| **Submission** | `/submit` — 3-step form, unlimited samples, live pricing, `/submit/confirmation` |
| **Verification** | `/verify` — search; `/verify/[token]` — the only page that renders a certificate |
| **Client portal** | `/dashboard` — orders, tracking, certificates, invoices, notifications, settings |
| **Admin** | `/admin` — dashboard, orders, COA library, customers, invoices, analytics, messages, audit log, settings |
| **Auth** | `/login`, `/register` |

---

## Quick start

You need **Node 20+** and a **PostgreSQL 14+** database.

```bash
npm install
```

```bash
cp .env.example .env
```

Generate the two secrets and paste them into `.env`:

```bash
echo "AUTH_SECRET=$(openssl rand -base64 32)"; echo "CERTIFICATE_HASH_SECRET=$(openssl rand -base64 32)"
```

Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` to your Postgres instance, then:

```bash
npm run db:push && npm run db:seed
```

```bash
npm run dev
```

The seed prints sign-in credentials and a set of real certificate numbers to try
on `/verify`.

**Default development credentials** (change them via `SEED_ADMIN_PASSWORD` /
`SEED_CUSTOMER_PASSWORD`, and never use them anywhere real):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@lavadiagnostics.com` | `ChangeMe!2026` |
| Client | `research@nordpeak.example` | `ChangeMe!2026` |

### No Postgres locally?

Fastest path is a free hosted database — [Neon](https://neon.tech) or
[Supabase](https://supabase.com) both work and take about a minute. Or with
Docker:

```bash
docker run --name lava-db -e POSTGRES_PASSWORD=lava -e POSTGRES_DB=lava -p 5432:5432 -d postgres:16
```

Then set both URLs to `postgresql://postgres:lava@localhost:5432/lava`.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync schema without migrations (development) |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations (production/CI) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

---

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Pooled connection used at runtime |
| `DATABASE_URL_UNPOOLED` | Migrations | Direct (non-pooled) connection for `prisma migrate`. The Neon/Vercel integration injects this automatically |
| `AUTH_SECRET` | Yes | 32-byte random. Session signing |
| `CERTIFICATE_HASH_SECRET` | Yes | 32-byte random, **separate from `AUTH_SECRET`**. Keys certificate hashes and PDF access grants |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical origin. Baked into QR codes — must match production exactly |
| `STORAGE_DRIVER` | Yes | `supabase` in production, `local` in development |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | If `supabase` | Service-role key is server-only |
| `SUPABASE_STORAGE_BUCKET` | If `supabase` | Bucket must be **private** |
| `EMAIL_DRIVER` | Yes | `resend` in production, `console` in development |
| `RESEND_API_KEY` | If `resend` | |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` / `EMAIL_INTERNAL_INBOX` | Yes | `EMAIL_INTERNAL_INBOX` receives new-order and contact notifications |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Recommended | Rate limiting. Falls back to Postgres if absent |
| `REQUIRE_CODE_WITH_NUMBER` | No | `true` forces certificate number **+** code. See below |

> **Rotating `CERTIFICATE_HASH_SECRET` invalidates every previously issued
> certificate hash.** The hashes printed on existing PDFs will no longer match
> what the verification page displays. Do not rotate it without re-hashing.

---

## The security model

This is the part that matters. Read it before touching
`src/lib/certificates/verify.ts` or the PDF route.

### Certificates are private by default

A newly uploaded certificate has `status = PRIVATE`. In that state verification
reports **"Certificate Not Found"** — to everyone, including the client who owns
it. An accidental upload is therefore not a disclosure. Releasing is a separate,
deliberate, audited action.

| Status | Verification behaviour |
| --- | --- |
| `PRIVATE` | Reported as not found |
| `VERIFIED` | Resolves — this is the released state |
| `REVOKED` | Resolves, and reports itself as withdrawn with the reason |
| `ARCHIVED` | Reported as not found |

`REVOKED` deliberately discloses itself. Someone holding a void document needs to
learn it is void, not be told it never existed.

### There is no browsable directory — by construction, not by policy

Every lookup function resolves to **at most one row**. There is no list endpoint,
no wildcard, no pagination, no sitemap entry, and no autocomplete backed by real
certificate numbers. The only place certificates are listed is `/admin/certificates`,
behind an administrator session.

Three independent layers keep certificates out of search indexes:

1. `metadata.robots` — site-wide `noindex` default; marketing pages opt back in.
2. `X-Robots-Tag` response headers in `next.config.ts` for `/verify/*`, `/api/certificates/*`, `/dashboard/*`, `/admin/*`.
3. `robots.txt` disallowing those prefixes, plus an explicit block on AI crawlers.

### How a certificate is reached

**A. Verification token (QR scan).** 160 bits of CSPRNG randomness in a URL-safe
alphabet. This is the real bearer credential and what the QR code encodes.

**B. Certificate number.** `LAVA-2026-000184`. Readable and sequential-looking by
design, because clients quote it on paperwork and a downstream buyer holding only
a printed label needs it to work.

This creates a genuine tension with *"prevent sequential guessing of IDs"*, and
it is worth being explicit about how it is resolved rather than pretending it
away. Three controls, in ascending order of importance:

1. **Two rate-limit windows** (12/min and 80/hour per hashed IP).
2. **A failure-ratio lockout** — this is the control that actually defeats
   enumeration. Walking the number space necessarily produces a high proportion
   of misses (gaps in the sequence, unreleased certificates). 15 failures within
   an hour locks that address out for 3 hours. A human mistyping a number once
   never approaches it.
3. **Nothing enumerable is ever returned**, per the previous section.

If you would rather trade the UX for strictness, set `REQUIRE_CODE_WITH_NUMBER=true`.
Path B then requires the number **and** its verification code together. QR scans
are unaffected. Nothing else in the application changes — the flag is read in one
place (`VERIFY_POLICY` in `src/lib/certificates/verify.ts`) and surfaced on
`/admin/settings`.

### Failures are indistinguishable

Wrong number, wrong code, unreleased, archived, and never-existed all produce the
identical `NOT_FOUND` result. The paired lookup compares in constant time.

### PDFs never leave private storage as URLs

Object storage is private and there is deliberately **no `getPublicUrl`** on the
`StorageDriver` interface. Bytes reach a browser through exactly one route —
`/api/certificates/[id]/pdf` — which streams them after checking one of:

1. A signed, HttpOnly, `SameSite=Strict` **grant cookie** scoped to that one
   certificate, minted by the verification Server Action, 15-minute TTL.
2. The **verification token** as `?t=`. This covers the QR-scan path: Next 15
   forbids setting cookies during a page render, so `/verify/[token]` has no
   grant yet. The token is already in the visitor's address bar, so accepting it
   here discloses nothing new.
3. A **session** — the owning customer, or an administrator.

Certificate status is re-checked on every request, so revoking a certificate cuts
off in-flight grants immediately. A missing grant returns **404, not 403** — a
403 would confirm the certificate exists.

### Everything else

- **Tenancy.** Customer queries are scoped by the `customerId` resolved from the
  session, never from a URL or form field. `/dashboard/orders/[id]` filters on
  `{ id, customerId }` together.
- **Prices.** Recomputed server-side from the submitted test selections. Any
  total in the client payload is ignored.
- **Roles.** `registerAction` hard-codes `role: CUSTOMER`. No request can ask for
  `ADMIN`. `requireAdmin()` re-reads the user row rather than trusting the JWT,
  so revoking an admin takes effect immediately.
- **Passwords.** bcrypt cost 12. Login compares against a dummy hash when the
  account is absent so response time does not reveal account existence.
- **Uploads.** PDF magic-number sniffing (not just MIME), 20 MB cap, filename
  sanitisation, path-traversal rejection in the local driver.
- **IP addresses** are stored only as keyed, truncated HMACs — enough to
  correlate abuse, not a record of who viewed what.
- **Audit log** is append-only; never updated or deleted by application code.

---

## Architecture

```
src/
├── app/
│   ├── (marketing)/          Public site
│   ├── (auth)/               Login, register
│   ├── submit/               3-step submission + confirmation
│   ├── verify/               Search, QR scanner, [token] result page
│   ├── dashboard/            Client portal
│   ├── admin/                Admin area
│   ├── actions/              Server actions (all mutations)
│   └── api/certificates/     The only PDF stream route
├── components/
│   ├── ui/                   shadcn-style primitives
│   └── shared/               Header, footer, portal shell, motion, status
├── lib/
│   ├── certificates/verify.ts    ← the security-critical lookup
│   ├── storage/                  Driver abstraction: index / local / supabase / limits
│   ├── email/                    send, layout, templates
│   ├── pricing.ts                Single source of truth for money
│   ├── crypto.ts                 Hashing + access grants
│   ├── rate-limit.ts             Redis → Postgres → in-memory
│   └── validations/              Zod schemas shared client + server
└── middleware.ts             Edge route guard (defence in depth only)
```

**Design decisions worth knowing:**

- **`lib/pricing.ts` is imported by both the browser and the server.** The form
  renders the live estimate from it; the server action recomputes the invoice
  from it. Change a price once and all three surfaces (form, `/pricing`,
  invoicing) move together.
- **`lib/storage/limits.ts` exists separately** because the storage barrel imports
  `node:fs`. Client upload forms import limits from `limits`, never from the
  barrel — otherwise the browser bundle pulls in Node built-ins and the build
  fails.
- **Emails never throw.** A mail outage must not roll back a legitimate status
  change. Sends return `{ ok: false }` and the result is recorded on the
  `OrderEvent` so it can be retried.
- **Auth uses JWT sessions**, so middleware authorises without a database
  round-trip. The trade-off is that role changes lag by one token refresh, which
  is why `requireAdmin()` re-reads the user row for privileged operations.
- **PDF viewing uses an iframe**, not a JS PDF library. No worker bundle, no CDN
  dependency, and the bytes never enter JavaScript. Native viewers also handle
  search, print and accessibility better than a canvas re-implementation.

---

## Deploying to Vercel

1. Push to GitHub and import the repository into Vercel.
2. Provision Postgres (Neon, Supabase, or Vercel Postgres).
3. Set every variable from [Environment variables](#environment-variables) in
   Vercel → Settings → Environment Variables. In particular:
   - `NEXT_PUBLIC_APP_URL` = your real production origin (QR codes bake this in)
   - `STORAGE_DRIVER=supabase`
   - `EMAIL_DRIVER=resend`
4. Deploy. The build script runs `prisma generate && prisma migrate deploy`
   before `next build`, so the schema is created and kept current automatically
   on every deploy — you do not need to run migrations by hand.

   Note that this means **the build will fail if `DATABASE_URL` is unreachable**.
   That is deliberate: a green deploy against a missing database would only fail
   later, at the first request from a real client.
6. Create your first administrator — either run the seed once with production
   `SEED_ADMIN_*` values, or promote an existing user:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@yourdomain.com';
   ```

**Before going live**, confirm:

- [ ] `STORAGE_DRIVER=supabase` and the bucket is **private**
- [ ] `EMAIL_DRIVER=resend` with a verified sending domain
- [ ] `NEXT_PUBLIC_APP_URL` matches production exactly
- [ ] `AUTH_SECRET` and `CERTIFICATE_HASH_SECRET` are distinct and freshly generated
- [ ] Seed passwords changed or seed data removed
- [ ] Upstash configured (rate limiting works without it, but Postgres-backed)
- [ ] `/admin/settings` shows no configuration warnings
- [ ] `/robots.txt` disallows `/verify`, `/admin`, `/dashboard`, `/api/`
- [ ] The legal pages have been reviewed by a lawyer (see [Known gaps](#known-gaps))

---

## Supabase Storage setup

1. Create a bucket named `lava-certificates`.
2. **Set it to Private.** This is the whole point — a public bucket defeats the
   access model entirely.
3. Do **not** add any RLS policy granting `select` to `anon` or `authenticated`.
   The app uses the service-role key server-side and needs no client policy.
4. Copy the project URL and the **service role** key (not the anon key) into
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Verify it is actually private — this must fail:

```bash
curl -I "https://<project>.supabase.co/storage/v1/object/public/lava-certificates/certificates/test.pdf"
```

---

## Operational runbook

**Issuing a certificate**

1. `/admin/certificates/new` → drag the PDF in, pick the client, fill metadata.
2. Save as **Private**. Certificate number, verification token, QR code and
   integrity hash are generated automatically.
3. Review the rendered PDF on the detail page.
4. **Release.** This emails the client a link and makes it verifiable.

**Correcting a mistake**

| Situation | Action |
| --- | --- |
| Uploaded against the wrong client, never released | **Delete** |
| Released prematurely, no copies circulating | **Make private** |
| Document is wrong and copies may be in circulation | **Revoke** with a reason |
| Same results, corrected document | **Replace PDF** — bumps revision, keeps the QR working |

Released certificates cannot be deleted. That is enforced in
`deleteCertificate()`, not just in the UI.

**Investigating a suspected enumeration attempt**

`/admin/analytics` shows the 30-day verification failure rate. A sustained high
rate means either a scanner (the lockout will already be biting) or a certificate
number misprinted on physical documentation — check recent releases before
assuming abuse. Per-certificate lookup history is on each certificate's detail
page.

---

## Known gaps

Being straight about what is not finished:

- **Partially exercised at runtime.** The project typechecks, lints and builds
  cleanly (41 routes), and the schema validates. The marketing pages, the
  verification search page, auth screens and **all three submission steps** have
  been driven in a real browser — that pass caught two blocking bugs, both since
  fixed (a Radix Select silently falling back to uncontrolled, and a Zod
  `.partial()` rejecting the empty strings the billing block is seeded with).
  What has **not** run is anything requiring a database: the seed, order
  persistence, certificate verification against real records, the portals, and
  email. No PostgreSQL was available where this was written. Run
  `npm run db:seed` and walk those flows before trusting them.
- **Payment is not integrated.** The submission form captures a payment *method*
  and the platform issues invoices, but no card is charged. `CARD` currently
  means "we will email a payment link". Wire up Stripe if you need real
  collection.
- **Legal pages are unreviewed templates.** `/legal/terms`, `/legal/privacy` and
  `/legal/research-use` are a drafting starting point and say so prominently on
  the page. Have a lawyer in your jurisdiction review them before taking real
  clients.
- **No password reset flow.** Users can change a password while signed in;
  there is no forgotten-password email yet. The `VerificationToken` table is in
  the schema ready for it.
- **PDF thumbnails are not generated.** `Certificate.thumbnailPath` exists and is
  wired through storage, but nothing populates it — that needs a rendering
  library or an external service.
- **Invoice PDFs are not rendered.** Invoices are structured data with frozen
  line items; `Invoice.pdfPath` is unused.
- **QR scanning needs `BarcodeDetector`.** Chrome and Edge have it; Safari and
  Firefox do not at time of writing. Those browsers get a clear explanation and
  the manual-entry fallback rather than a broken viewfinder.
- **No automated tests.** The pricing engine, `verifyCertificate` and the grant
  signing in `lib/crypto.ts` are the three things most worth covering first.
- **Prisma deprecation warning.** `package.json#prisma` for the seed config is
  deprecated ahead of Prisma 7; harmless on v6, migrate to `prisma.config.ts`
  when you upgrade.
- **The build fetches fonts from Google.** `next/font/google` downloads Inter and
  JetBrains Mono at build time and self-hosts them in the output. If a build
  fails with `NextFontError: Failed to fetch 'Inter'`, that is a network or
  rate-limit blip — retry it. For fully offline or air-gapped builds, download
  the WOFF2 files into `src/app/fonts/` and switch `src/app/layout.tsx` to
  `next/font/local`.

---

## Licence

Proprietary. All rights reserved.

*All analytical services described in this application are for research use only
and are not intended for human or veterinary use.*
