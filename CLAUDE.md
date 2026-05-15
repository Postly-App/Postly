# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server on localhost:3000
npm run build     # production build
npm run lint      # ESLint

npx prisma migrate dev   # create and apply a new migration
npx prisma db push       # push schema without migration file (prototyping)
npx prisma generate      # regenerate Prisma client after schema changes
npx prisma studio        # open local DB GUI
```

Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32`

Copy `.env.local.example` → `.env.local` and fill in all values before running locally.

## Design system

**Brand:** `--brand: #7C5CFC` (purple), background `#0A0A0F`, font **Plus Jakarta Sans**.

Key palette used throughout the UI:
- Background layers: `#0A0A0F` → `#111118` → `#18181F`
- Brand purple: `#7C5CFC` / hover `#9B82FD`
- Muted text: `#9B99B5` / dimmer `#5C5A75`
- Border: `white/8%` (`rgba(255,255,255,0.08)`)
- Accent pink: `#F06292`, success green: `#22D3A0`
- Gradient text utility class: `gradient-text` (purple → pink)

Components use dark cards (`bg-[#111118] border border-white/[0.08] rounded-2xl`). Buttons use `shadow-[0_0_24px_rgba(124,92,252,0.3)]` glow on the brand color. This palette is already applied in the compose page and can be used as reference for all other pages.

Target market: **francophone** — UI copy and error messages should be in French.

## Architecture

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma + Supabase (PostgreSQL), NextAuth v4, Stripe, UploadThing.

### Route layout

- `src/app/(app)/` — authenticated route group: dashboard, compose, analytics, settings, billing. Protected by middleware.
- `src/app/login/`, `signup/`, `pricing/` — public pages.
- `src/app/api/` — API routes co-located with their domain (posts, auth, billing, social, uploadthing, webhooks/stripe).

### Auth (`src/lib/auth.ts`)

NextAuth with JWT sessions. Three providers: Google, GitHub, and Credentials (email + bcrypt). The JWT callback stamps `token.id` with the user's database id; the session callback surfaces it as `session.user.id`. All app and API routes require a valid token — see `src/middleware.ts` for the matcher list.

Type augmentation for `session.user.id` lives in `src/types/next-auth.d.ts`.

### Database (`prisma/schema.prisma`)

Six models: `User`, `Account`, `Session`, `VerificationToken` (NextAuth), `Post`, `SocialAccount`, `Subscription`, `Analytics`.

- `Post.platforms` is a `String[]` (platform IDs like `"INSTAGRAM"`, `"TWITTER"`).
- `Post.status` enum: `DRAFT | SCHEDULED | PUBLISHED | FAILED`.
- `Subscription` stores Stripe customer/subscription/price IDs and maps to `Plan` enum (`FREE | PRO | AGENCY`).
- `DATABASE_URL` uses pgbouncer (transaction mode) for runtime; `DIRECT_URL` is the direct connection used only for migrations.

Post CRUD helpers are in `src/lib/db/posts.ts`. Always pass `userId` alongside `postId` to scope queries to the authenticated user.

### Social publishing (`src/lib/social/index.ts`)

`publishPost(postId, userId)` is the entry point called from `POST /api/posts/[id]/publish`. It atomically claims the post (PROCESSING lock via `claimPostForPublishing`), looks up matching `SocialAccount` rows by canonical platform, dispatches to per-platform publishers in `src/lib/social/publish/orchestrator.ts`, and updates final status to `PUBLISHED` or `FAILED`.

Per-platform publishers live in `src/lib/social/publish/providers/` — all seven implemented: Twitter, Facebook (Page), LinkedIn (Member), Instagram (Business), Threads, TikTok, YouTube. Tokens decrypted via `social-token-crypto.ts` (AES-256-GCM, key from `SOCIAL_TOKEN_ENCRYPTION_KEY`).

To add a platform: write a `publishX(account, ctx)` provider, register in `runPlatformPublish`, and add to `AUTO_PUBLISH_PLATFORMS`.

### Billing (`src/lib/stripe.ts`)

Stripe client singleton. `PRICE_TO_PLAN` maps Stripe price IDs to `Plan` values — all four price IDs (PRO monthly/yearly, AGENCY monthly/yearly) must be set in env. Webhook handler at `src/app/api/webhooks/stripe/route.ts` keeps the `Subscription` table in sync.

### Media uploads

UploadThing handles file uploads. Router defined in `src/app/api/uploadthing/core.ts`, endpoints wired in `src/app/api/uploadthing/route.ts`. The `<Upload>` component (`src/components/upload.tsx`) is used in the compose page.

### Supported platforms (compose)

Instagram, Twitter/X, LinkedIn, TikTok, YouTube, Facebook, Threads — with per-platform character limits defined in `src/app/(app)/compose/page.tsx`. The social connect API (`src/app/api/social/connect/[provider]/route.ts`) also accepts Pinterest and Bluesky.
