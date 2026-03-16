# FusionBiz Platform

## Project Overview
FusionBiz is a comprehensive business management SaaS platform built with React + Vite. It provides CRM, invoicing, accounting, e-commerce, marketing, analytics, and more — all behind authentication powered by the Blink SDK.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite, served on port 5000
- **Auth & DB**: Blink SDK (`@blinkdotnew/sdk`, `@blinkdotnew/react`) — project ID: `fusionbiz-platform-eqm2kch7`
- **Routing**: React Router v7
- **Styling**: Tailwind CSS 3 + shadcn/ui (Radix UI primitives)
- **State**: React context (CompanyProvider, BlinkAuthProvider)

## Key Files
- `src/main.tsx` — App entry point, Blink + Company providers
- `src/App.tsx` — Route definitions
- `src/hooks/useAuth.ts` — Auth hook (Blink)
- `src/hooks/useCompany.tsx` — Company context
- `src/lib/blink.ts` — Blink SDK client
- `vite.config.ts` — Vite configuration (port 5000, host 0.0.0.0)
- `.env.local` — Blink project ID and publishable key

## Pages / Modules
- Landing page (`/`)
- Onboarding (`/onboarding`)
- Dashboard (`/dashboard`)
- CRM, Leads, Contacts
- Invoicing, Quotes, Invoices
- Accounting, Expenses, VAT
- E-commerce (Products, Orders, Customers, Discounts)
- Storefront / CMS Pages
- Marketing & Campaigns
- Social & Media
- Analytics
- Automation
- Delivery & B2B
- Team, Billing, Settings

## Development
```bash
npm run dev   # starts Vite dev server on port 5000
npm run build # production build to dist/
```

## Environment Variables
- `VITE_BLINK_PROJECT_ID` — Blink project identifier
- `VITE_BLINK_PUBLISHABLE_KEY` — Blink publishable key

## Deployment
Configured as a **static** deployment: `npm run build` → `dist/`
