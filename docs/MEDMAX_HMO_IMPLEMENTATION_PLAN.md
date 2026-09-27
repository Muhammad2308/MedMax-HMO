# MedMax HMO-App — Implementation Plan (Sprint 1)

**Status:** Planning document, written before implementation, per `MedMax_HMO_Implementation_Priority_and_UIUX_Plan.md`.
**Scope of this document:** what was audited, what is true about the current codebase (not assumed), and exactly what this sprint implements in the HMO-App (this repo) versus what is deferred to `IX2-App` (backend, tracked separately in `docs/IX2_APP_BACKEND_REQUIREMENTS.md`).

---

## 1. Audit summary — HMO-App (this repo)

Contrary to the master plan's framing ("do not begin by coding the dashboard"), the HMO-App frontend is **already substantially built**, not a blank slate. Confirmed by direct inspection of `src/`:

| Area | State | Evidence |
|---|---|---|
| Framework | Next.js 16.2.7 (App Router), React 19.2.4, this fork renames `middleware.ts` → `proxy.ts` (see `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`); `src/proxy.ts` already exists correctly named. | `package.json`, `src/proxy.ts` |
| Auth | Real: device-identifier flow, staff invite/OTP activation, HMO org invite, login/logout, `AuthContext` with permission checks (`hasOrgPermission`), 401 → redirect to `/landing`, 403 → toast via custom event. | `src/api/auth.ts`, `src/context/AuthContext.tsx`, `src/api/apiClient.ts` |
| Onboarding | Pages exist: `/landing`, `/register-type`, `/staff-token`, `/staff-otp`, `/staff-setpassword`, `/onboarding`, `/onboard/[token]`, `/hmo-org-complete`. | `src/app/*` |
| Shell/Nav | `AppShell` → `Shell` → `Sidebar` + `BottomNav`, route-guarded, permission-filtered nav items, responsive (desktop sidebar / mobile drawer + bottom bar). | `src/components/layout/*` |
| Enrollees | List (search, real API), register flow, photo upload. | `src/app/enrollees/*`, `src/api/enrollees.ts` |
| Call Center / P-Code | Call center page, Manage Codes (list/new/[id]/edit/assign), Vetting detail page, referrals stub. | `src/app/call-center`, `src/app/manage-codes/*`, `src/app/vetting/[id]` |
| Billing / Finance | Billing review list (code_status=2), financial report list. | `src/app/billing/*`, `src/app/reports/financial` |
| Providers | List + detail, schema linkage, schema-plan creation. | `src/app/marketing/providers/*`, `src/api/providers.ts` |
| Users/Roles/Permissions | Full CRUD UI: users, roles, permissions, role-permission checklist, user drawer, assign-role popover. | `src/app/manage-users/**` |
| Design tokens | A real token system already exists in `globals.css` (CSS variables for color/spacing/radius/motion, `.glass-card`, `.skeleton`, `.data-table`, responsive nav utilities). | `src/app/globals.css` |

**Gaps found in the frontend itself (not backend-caused):**

1. **Dashboard (`src/app/page.tsx`) is entirely fabricated.** All four stat cards (`2,847` enrollees, `143` codes, `29` pending billing, `₦4.2M` claims) and the four-item "Recent Activity" feed are hardcoded literals. A "System Health" card shows fake `API Response Time`/`Server Load`/`DB Query Time`/`Uptime` numbers with no telemetry source anywhere in the app. This directly violates the master plan's rule in §11: *"Do not invent business metrics that cannot be derived from the existing database/API."*
2. **`src/app/reports/financial/page.tsx`** fetches a real, row-level `reportData` array but then renders three top-level stat cards (`₦4.2M`, `₦3.8M`, `₦400K`) as hardcoded strings instead of aggregating the real rows it already has in memory.
3. **`SchemaEnrolleeWidget`** renders a fabricated `+12% monthly` trend badge next to real schema data; the component's own comment admits it (`// In a real app, this would be a specific grouped query`).
4. **No shared status-badge vocabulary.** `Badge` only maps 5 numeric P-Code statuses (0/1/2/3/9) plus 6 free-form color variants. The plan's §18 status system (Active/Inactive/Pending/Verified/Suspended/Approved/Rejected/Queried/Processing/Completed/Failed/Paid/Unpaid/Expired) has no component.
5. **No reusable `StatCard`, `EmptyState`, `ErrorState`, or `Skeleton` primitives** — every page hand-rolls its own pulse-div loading state and stat tiles inline, despite `globals.css` already shipping a `.skeleton` shimmer class nothing uses yet.
6. **Sidebar navigation is a flat list**, not the grouped IA (Overview / Beneficiaries / Network / Call Center / Operations / Accounts / Reports / Administration) the plan's §9.3 calls for.
7. **`src/app/reports/page.tsx`** has six `href="#"` dead links and a hardcoded "Recent Generated Reports" list of fake `.xlsx` filenames. Left as-is this sprint (see §4).

## 2. Audit summary — IX2-App backend

Full findings in `docs/IX2_APP_BACKEND_REQUIREMENTS.md`. Headline: **the `/api/v1/hmo/*` namespace the frontend already calls is mostly unbuilt.** `routes/api.php`'s `hmo` prefix group contains only org user/role/permission management; `hmo/call-center` and `hmo/finance` are empty stubs. There is no `Api\V1\HMO` controller for enrollees, code-requests, providers, schemas, vetted-claims, or financial reports — the equivalent business logic exists only in legacy Blade/web admin controllers (`Admin\CodeRequestController`, `Admin\ManageCodeController`, `Admin\CodeVettedController`, `Admin\CodeBilling`, `Admin\EnrolleeController`). Tenant isolation (plan P1) is gate-based (`AuthGates` middleware defines Laravel Gates per permission) but **not query-scoped** — no `BelongsToTenant`/global-scope trait exists, so per-controller `where('hmo_id', ...)` scoping is manual and unverified across all ~78 controllers. Installation identity and licensing (P3.2, P14) do not exist at all (zero matches for "installation" or "license" in models/controllers/migrations); only a `DeviceSession` table (device recognition) exists.

This means: **the HMO-App frontend, as it stands today, cannot function against a real IX2-App backend for enrollees/codes/providers/billing** — it was built against an assumed contract. That contract is now the de facto spec; the backend requirements doc formalizes it.

## 3. What this sprint implements in HMO-App

Per the master plan's Antigravity Execution Protocol (§31: small verifiable stages, no massive rewrite) and its explicit sequencing (P5 "HMO Dashboard Shell" is the first UI-architecture priority once the audit is done), this sprint implements the fixes identified in §1 items 1–6 above — the parts of the "reusable design system" and "operational, not decorative, dashboard" deliverables that are pure frontend work, don't require a new backend contract, and don't touch already-working screens.

**In scope, this sprint:**

1. **Design system additions** (`src/components/ui/`): `StatCard`, `EmptyState`, `ErrorState`, `Skeleton` — reusable primitives per plan §10, built on the existing `globals.css` tokens.
2. **`Badge` extended** with a semantic `label` status map (Active/Inactive/Pending/Verified/Suspended/Approved/Rejected/Queried/Processing/Completed/Failed/Paid/Unpaid/Expired) per plan §18, additive — existing numeric/variant usages untouched.
3. **`useDashboardStats` hook** (`src/hooks/`) — computes real, derivable numbers from *already-integrated* endpoints only: active enrollees (`enrolleesApi.getAll`), active providers (`providersApi.getAll`), pending P-Code requests (existing `usePendingCount`), claims awaiting vetting (`codeRequestsApi.getAll({ code_status: 2 })` — the same query `billing/page.tsx` already uses). No new backend endpoint required.
4. **Dashboard rewrite** (`src/app/page.tsx`): stat cards driven by `useDashboardStats`; four additional plan-§11 cards (Invoices Awaiting Reconciliation, Pending Settlements, Provider Wallet Exposure, Active Plans) rendered in an explicit "not available yet" state with a short reason, instead of being omitted or faked — because no `invoices`/`settlements`/`wallets`/`plans` API client exists in this app at all (confirmed by directory listing of `src/api/`). Recent Activity replaced with the most recent real code-requests. Fabricated "System Health" card removed entirely (no telemetry source exists anywhere in the codebase).
5. **`reports/financial` real aggregates**: Total Claims / Vetted Total / Savings computed via `useMemo` over the already-fetched `reportData`, formatted with `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`.
6. **`SchemaEnrolleeWidget`**: fabricated `+12% monthly` trend badge removed.
7. **Sidebar IA grouping** (`src/components/layout/Sidebar.tsx`): existing nav items regrouped under labeled sections matching plan §9.3 (Overview, Beneficiaries, Network, Call Center, Operations, Reports, Administration) — **no new nav entries for pages that don't exist yet.** Adding nav links to unbuilt pages (Dependants, Imports, Eligibility, Provider Invitations/Panels/Tariffs, Plans/Packages, Schemas/Services/Treatments/Drugs, Reconciliation/Settlements/Wallets, Installation/License/Audit Logs) would ship dead links; those stay in the backlog (§4) until their backend contract exists.

**Explicitly out of scope, this sprint** (backlog, sequenced by plan §3 priority, gated on backend work tracked in `IX2_APP_BACKEND_REQUIREMENTS.md`):

- New CRUD screens for Dependants, Imports (enrollee import wizard), Eligibility verification, Provider Invitations/Panels/Tariffs, Plans/Packages/Subscription Types/Riders, Schemas/Services/Treatments/Drugs/Prices, Reconciliation, Settlements, Provider Wallets, Installation, License, Audit Logs — none of these have a backend contract yet (confirmed absent both as `Api\V1\HMO` routes and as `src/api/*.ts` clients).
- `reports/page.tsx` dead links and fake "Recent Generated Reports" list — real report types need their own backend endpoints (plan P12) before they can be built for real; relabeling them without functionality would be cosmetic only.
- Full visual/styling unification (some pages use inline `style={}` objects — `Header`, `Sidebar`, `page.tsx`; others use the Tailwind-like utility classes in `globals.css` — `enrollees`, `manage-codes`, `billing`). Both read consistently today because they share the same CSS variables; a full rewrite to one convention is a larger, separate, lower-urgency cleanup and is not attempted here to avoid regressions across ~30 files for a cosmetic-only gain.
- P1–P4 backend foundation (tenant query-scoping, installation identity, licensing) — backend-only, tracked in the companion doc.

## 4. Definition of done — this sprint

- [ ] `StatCard`, `EmptyState`, `ErrorState`, `Skeleton` exist in `src/components/ui/` and are used by the dashboard.
- [ ] `Badge` supports semantic string statuses without breaking existing numeric/variant call sites.
- [ ] Dashboard shows zero hardcoded business numbers; every card is either real or explicitly marked unavailable with a stated reason.
- [ ] `reports/financial` stat cards are computed from real fetched data.
- [ ] `SchemaEnrolleeWidget` shows no fabricated trend figure.
- [ ] Sidebar is grouped per plan §9.3 using only existing, working routes.
- [ ] `npm run lint` passes on all touched files.
- [ ] This document and `docs/IX2_APP_BACKEND_REQUIREMENTS.md` exist and reflect the audited, not assumed, state of both codebases.

## 5. Next sprint candidates (not started)

In backend-dependency order, once the corresponding IX2-App endpoints exist (see companion doc §2 for the priority list):

1. Enrollee import wizard (plan §12) — needs a batch-import endpoint.
2. Provider invitation flow (plan §14) — `SchemaProviderController`'s invite-token pattern already exists for Schema↔Provider; the same pattern needs an HMO↔Provider equivalent.
3. Tariff/Schema selection UI for HMO-initiated uploads (plan §13).
4. Accounts module (Reconciliation, Settlements, Wallets) — HCP-side billing tables (`provider_invoices`, `provider_settlements`, `provider_wallets`) already exist in the DB; an HMO-facing read/approval API is the missing piece.
5. Installation/License administration screens — fully greenfield on both ends.
