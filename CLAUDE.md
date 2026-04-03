# CLAUDE.md — Mise (Impossible Reservations Platform)

## Quick Reference
- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind 4 + Supabase + shadcn/ui
- **GitHub:** `elhetki/Mise` → push to `main` auto-deploys via Vercel
- **Prod:** https://mise-app-sooty.vercel.app
- **Supabase project:** `gzzrmjhrspbbxlytqeya`
- **Framework:** Next.js App Router (NOT Pages Router)

## Commands
```bash
npm run dev          # Local dev server
npm run build        # Production build (next build)
npm run lint         # ESLint
```

## Quality Gate (MUST pass before any push)
```bash
npx next build
```
Zero TypeScript errors required. Fix before committing.

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Landing page (hero + featured restaurants + waitlist CTA)
│   ├── layout.tsx                  # Root layout (fonts, metadata)
│   ├── globals.css                 # ⚠️ THE SOMMELIER DESIGN SYSTEM — DO NOT MODIFY
│   ├── dev-gate/page.tsx           # Password gate (duck123)
│   ├── (auth)/login/               # Login page
│   ├── (auth)/signup/              # Signup page
│   ├── (app)/layout.tsx            # App shell with sidebar
│   ├── (app)/sidebar.tsx           # Navigation
│   ├── (app)/explore/              # Browse 50 restaurants (filters: city, platform, status, search)
│   ├── (app)/restaurant/[id]/      # Restaurant detail + watch CTA
│   ├── (app)/watchlist/            # User's watched restaurants (Supabase)
│   ├── (app)/bookings/             # Booking history (Supabase)
│   ├── (app)/notifications/        # Availability alerts (Supabase)
│   └── (app)/settings/             # User settings
├── lib/
│   ├── restaurants.ts              # Static data: all 50 restaurants + helpers
│   ├── supabase/client.ts          # Supabase browser client
│   ├── supabase/server.ts          # Supabase server client
│   └── utils.ts                    # cn() utility
├── components/ui/                  # shadcn components
├── middleware.ts                   # Auth + dev-gate middleware
└── types/index.ts                  # Restaurant, DbRestaurant, Watch, Booking types

scraper/                            # Availability scrapers (Node.js + Playwright)
├── index.ts                        # Main runner
├── config.ts                       # Restaurant → scraper mapping
├── matcher.ts                      # Matches slots to user watches
├── notifier.ts                     # Sends notifications
└── scrapers/                       # Per-platform scrapers
    ├── formitable.ts               # ✅ Working
    ├── steirereck.ts               # ✅ Working (aleno.me)
    ├── opentable.ts                # Stub (needs proxy)
    └── thefork.ts                  # Stub (needs proxy)
```

## Design System — "The Sommelier"
**⚠️ DO NOT MODIFY `globals.css`** — this is the approved design system.
- **Fonts:** Fraunces (serif headings) + Inter (body)
- **Colors:** Paper (#F5F1EB), Burgundy (#6B1D2A), Ink (#1A1A1A)
- **Mode:** LIGHT only — no dark mode
- **Components:** Cards, buttons (primary/secondary/ghost), inputs, badges, status dots
- **Texture:** Paper noise overlay at 2% opacity

Use the existing CSS classes: `.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input`, `.badge`, `.status-dot`, `.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-body`, `.text-caption`, `.font-serif`

## Architecture Patterns

### Restaurant Data
- Static data lives in `src/lib/restaurants.ts` (50 restaurants)
- DB types use `DbRestaurant` (for Supabase queries in watchlist/bookings)
- Frontend display types use `Restaurant` (from static data)

### Scrapers
- Each booking platform has its own scraper in `scraper/scrapers/`
- Config maps restaurants to their scraper type in `scraper/config.ts`
- Scrapers write availability to Supabase, frontend reads from there
- **Resy scraper NOT built yet** — this covers 22/50 restaurants and is the #1 priority

### Access Control
- Dev gate password: `duck123` — no auth/signup flow active
- Middleware checks dev-gate cookie before allowing app access

## What NOT To Do
- Don't modify `globals.css` — design system is final
- Don't use Pages Router patterns — this is App Router only
- Don't add new dependencies without justification
- Don't hardcode restaurant data outside `src/lib/restaurants.ts`
- Don't mix `Restaurant` (static) and `DbRestaurant` (Supabase) types

## Environment Variables
Set in Vercel dashboard (not committed):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — For server-side/scraper operations

## Deploy
Push to `main` on `elhetki/Mise` → Vercel auto-deploys. No manual deploy needed.

## Customer Data Protection (NON-NEGOTIABLE)

These rules are absolute. No agent, no feature, no deadline overrides them:

1. **NEVER delete customer data** — soft-delete only (add `deleted_at` timestamp)
2. **NEVER modify customer settings** — read them, never overwrite on deploy or migration
3. **NEVER drop columns that have data** — add new columns, deprecate old ones
4. **NEVER change existing enum values** — add new ones, never rename or remove
5. **ALWAYS set defaults for new columns** — existing rows must not break
6. **ALWAYS verify RLS policies** — every table with customer data needs row-level security
7. **ALWAYS test with existing data** — not just empty/fresh state

If a migration touches existing data: document exactly what it changes and require explicit approval.
If in doubt: **don't touch it, ask first.**
