# MedRise Medical Centre

A full-stack healthcare facility management web app for MedRise Medical Centre, Wakiso District, Uganda.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000/8080)
- `pnpm --filter @workspace/medrise run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v3, import from `"zod"` not `"zod/v4"`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind + shadcn/ui + Wouter + React Query

## Where things live

- `artifacts/medrise/` — React frontend
- `artifacts/api-server/` — Express API backend
- `lib/db/src/schema/` — Drizzle ORM schema files (source of truth for DB)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Orval-generated React Query hooks

## Architecture decisions

- Contract-first API: all endpoints defined in OpenAPI spec, then hooks/schemas generated via Orval codegen
- Orval mutation hooks expect `{ data: ... }` wrapper (not flat params) — always wrap create/update payloads
- Patient portal uses `sessionStorage` for patient session (phone + DOB auth against patient records)
- Zod is v3 — always import from `"zod"`, never `"zod/v4"`
- Tab navigation in dashboard uses `mainTab` state with conditional rendering (no React Router nested routes)

## Product

**Admin Dashboard** (`/admin/dashboard`) — 10 tabs:
1. **Appointments** — manage, confirm, complete appointments
2. **Patient Database** — full CRUD with medical notes
3. **Staff Accounts** — role-based staff management (admin/doctor/nurse/receptionist/staff)
4. **Attendance** — daily/monthly attendance tracking
5. **EHR** — electronic health records (consultations + vital signs)
6. **Billing** — invoices, line items, payment recording (cash/MTN/Airtel/bank/NHIS)
7. **Pharmacy** — drug inventory, stock levels, expiry alerts, dispensing
8. **Lab** — lab order management, result recording, test tracking
9. **Schedules** — shift assignment + leave request management with approval workflow
10. **Reports** — HMIS monthly summary with key performance indicators

**Patient Portal** (`/patient/login`, `/patient/portal`) — self-service access to consultations, vitals, lab results, invoices, and appointments using phone + DOB authentication.

**Public Website** — Home, Services, About, Contact, Appointment booking form.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Zod imports**: use `import { z } from "zod"`, never `"zod/v4"` (workspace uses Zod v3.x)
- **Orval mutations**: always pass `{ data: yourPayload }`, never flat params
- **Codegen**: run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- **DB push**: run `pnpm --filter @workspace/db run push` after any schema change

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
