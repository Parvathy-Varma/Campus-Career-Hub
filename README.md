# University Placement Portal

A full-stack three-sided placement management portal for universities. Companies post roles, students browse and apply, and the placement cell admin approves postings and tracks analytics — all in one system.

---
## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS, shadcn/ui, Recharts, Wouter |
| Backend | Express 5, express-session (cookie auth) |
| Database | PostgreSQL + Drizzle ORM |
| API contract | OpenAPI 3 spec → Orval codegen (React Query hooks + Zod schemas) |
| Monorepo | pnpm workspaces, TypeScript 5.9 |
| Build | esbuild (API server CJS bundle) |

## Project Structure

```
/
├── artifacts/
│   ├── api-server/          # Express API (port from $PORT env)
│   │   └── src/routes/
│   │       ├── auth.ts          # Login, logout, /me
│   │       ├── postings.ts      # CRUD + approve/reject/close/bulk actions
│   │       ├── applications.ts  # Apply, list, update status
│   │       ├── analytics.ts     # Overview, companies, timeline, summary
│   │       ├── notifications.ts # List, mark read
│   │       └── users.ts         # PATCH /users/me (profile update)
│   └── placement-portal/    # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── admin/       # Dashboard, Postings, PostingDetail, Companies, Applications
│           │   ├── company/     # Dashboard, NewPosting, PostingDetail
│           │   └── student/     # Dashboard, Postings, Applications, Profile
│           ├── components/
│           │   └── layout/AppLayout.tsx   # Role-aware sidebar + notification bell
│           └── context/AuthContext.tsx    # Session context (login/logout/me)
├── lib/
│   ├── api-spec/openapi.yaml    # Single source of truth for all API contracts
│   ├── api-client-react/        # Generated React Query hooks (do not edit)
│   ├── api-zod/                 # Generated Zod schemas (do not edit)
│   └── db/src/schema/           # Drizzle ORM table definitions
```
### Install & start

```bash
# Install all workspace dependencies
pnpm install

# Push the database schema (first time only)
pnpm --filter @workspace/db run push

# Seed demo data (first time only)
pnpm --filter @workspace/db run seed

# Start the API server (dev mode with rebuild on save)
pnpm --filter @workspace/api-server run dev

# In a separate terminal — start the frontend
pnpm --filter @workspace/placement-portal run dev
```

The frontend is served on `http://localhost:5173` and proxies `/api` requests to the API server.

### After changing the OpenAPI spec

```bash
# Regenerate React Query hooks and Zod schemas
pnpm --filter @workspace/api-spec run codegen
```

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@university.edu` | `admin123` |
| Company | `hr@techcorp.com` | `company123` |
| Company | `recruit@innovatesoft.com` | `company123` |
| Company | `careers@datadriven.com` | `company123` |
| Student | `aanya@students.edu` | `student123` |
| Student | `rohan@students.edu` | `student123` |
| Student | `priya@students.edu` | `student123` |

The seed includes 7 postings (across pending / approved / rejected / closed states), 11 applications in various stages, and 9 notifications.

---

## Data Flow & Workflows

### Posting lifecycle
```
Company creates → pending → Admin approves → approved (visible to students)
                          → Admin rejects  → rejected (company notified with reason)
Company closes  → closed
```

### Application lifecycle
```
Student applies → applied → Company shortlists → shortlisted → Company selects → selected
                                               → Company rejects → rejected
```

Every state transition fires an in-app notification to the relevant party.

---
