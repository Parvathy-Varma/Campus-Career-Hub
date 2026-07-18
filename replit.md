# University Placement Portal

A three-sided placement management portal where companies post roles, students apply, and university placement cell admins approve postings and track analytics.

## Run & Operate

- `pnpm --filter @workspace/placement-portal run dev` — run the frontend (root `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (`/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — session signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Recharts + Wouter
- API: Express 5 + express-session (cookie-based sessions)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, postings, applications, notifications)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, postings, applications, analytics, notifications)
- `artifacts/placement-portal/src/` — React frontend
  - `pages/admin/` — Admin analytics dashboard, postings approval table, company analytics
  - `pages/company/` — Company dashboard, posting creation form, applicant tracking
  - `pages/student/` — Student dashboard, browse roles, application history
  - `context/AuthContext.tsx` — session management via cookie
  - `components/layout/AppLayout.tsx` — role-aware sidebar + notification bell

## Demo accounts

| Role    | Email                        | Password    |
|---------|------------------------------|-------------|
| Admin   | admin@university.edu         | admin123    |
| Company | hr@techcorp.com              | company123  |
| Company | recruit@innovatesoft.com     | company123  |
| Company | careers@datadriven.com       | company123  |
| Student | aanya@students.edu           | student123  |
| Student | priya@students.edu           | student123  |

## Product

**Three user roles with distinct experiences:**

- **Companies** — create job postings (title, description, eligibility, CGPA cutoff, branches, CTC, location, deadline, slots). Postings start as `pending` until admin approves. Track applicants and move them through shortlisted → selected / rejected pipeline.
- **Students** — browse approved postings filtered by criteria. Apply with an optional cover letter. Track all application statuses in a personal history view.
- **Admins** — review pending postings and approve or reject with a reason. Full analytics dashboard: KPI cards, bar charts (applications per company), line chart (monthly trends), donut chart (posting status breakdown). Per-company conversion rate table.

**Posting lifecycle:** `pending → approved → closed` (or `rejected`)

**Application lifecycle:** `applied → shortlisted → selected / rejected`

In-app notifications fire on every major state transition (approval, rejection, application received, status change).

## Architecture decisions

- Cookie-based sessions (express-session) — simple, stateless from the client, works across page reloads without token management
- Plain-text passwords — deliberately simple for hackathon demo; replace with bcrypt in production
- OpenAPI-first — all contracts live in `lib/api-spec/openapi.yaml`; frontend hooks and server Zod schemas are generated from it
- Recharts for all analytics visualizations — already bundled in the scaffold
- Role-based access enforced server-side via `requireRole()` middleware; students never receive pending/rejected postings from the API

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always re-run codegen after changing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- The `format: email` OpenAPI annotation causes `zod.email()` codegen which fails — use plain `type: string` for email fields
- Session cookie requires `credentials: 'include'` on client fetches — handled by the generated `custom-fetch.ts`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
