# AGENTS.md — Mise (for Codex and other AI agents)

## Project
Mise is an impossible reservations platform — tracks the world's 50 hardest-to-book restaurants and alerts users when tables open. Revenue: subscription + slot marketplace + featured placement.

## Stack
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind 4 + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Scrapers:** Node.js + Playwright (in `/scraper/` directory)
- **Hosting:** Vercel (auto-deploy from GitHub `elhetki/Mise` main branch)
- **Prod URL:** https://mise-app-sooty.vercel.app

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build (next build)
- `npm run lint` — ESLint
- **Always run `npx next build` before committing — zero errors required**

## Key Rules
1. **DO NOT touch `globals.css`** — "The Sommelier" design system is final and approved
2. Use existing CSS classes (.card, .btn, .btn-primary, .badge, .font-serif, etc.)
3. Restaurant static data lives in `src/lib/restaurants.ts` only
4. `Restaurant` type = static display data, `DbRestaurant` = Supabase queries
5. This is App Router (Next.js) — no Pages Router patterns
6. Light mode only — no dark mode

## Current Gaps (for context)
- Resy scraper not built (covers 22/50 restaurants — priority #1)
- Tock scraper not built (covers 9/50)
- `scraper/config.ts` has old DACH mappings — needs update for new 50 restaurants
- Availability data is static — scrapers needed for live status
