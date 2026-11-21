# Codex Project Memory — IX2 HMO / MEDiX / MedMax

> Persistent working context for Codex. Read this file together with `AGENTS.md` before making project changes. This memory summarizes product intent, verified frontend behavior, important API contracts, and unresolved risks. It does not replace the source specifications or a fresh code audit.

## Product and system context

This repository is the HMO web client for a multi-tenant health-insurance management platform. The product specifications use **MedMax** for the broader platform/technical blueprint and **MEDiX** for the commercial product identity. The client serves HMO administrators, call-center staff, operations staff, and accounts/claims staff. Related HCP/provider and SCHEMA/regulator applications and the Laravel IX2 backend are separate system components; this repository is only the HMO client.

The client is an API consumer. The Laravel API and its central MySQL/MariaDB database own authoritative business state. The browser must not connect directly to the database. Treat client-supplied tenant IDs, roles, permissions, status, prices, and approval data as untrusted; the backend must derive and enforce tenant and authorization context.

## Business and data ownership rules

- HMOs, SCHEMAs, HCP/providers, users, roles, enrollees, plans, tariffs, P-Code authorizations, claims, vetting, invoices, settlements, licensing, installations, and audit history belong to the central service.
- An HMO may directly manage/import its own enrollees; it must not depend on a SCHEMA upload to begin operating. Duplicate people must be handled using stable server identifiers and enrolment identity rather than silently duplicated.
- A provider is independent and may be linked to multiple HMOs and SCHEMAs. Model provider access through relationships such as `hmo_providers`; do not assume `providers.hmo_id` or one-HMO ownership. Older specs and database snapshots may describe a prior provider schema.
- **Clarified product rule (2026-11-03):** each HMO private plan is created with a corresponding private `Schema` during HMO registration/setup. The HCP/provider is the default provider/panel member for that Schema; provider and Schema remain distinct entities linked by `schema_providers`. Private services, tariffs, and enrollees follow the Schema's `schema_id`. An HMO may also have government/externally linked Schemas; their coverage remains distinguishable from the HMO-owned private Schema.
- HMO tariff imports are intended to be associated with an explicitly selected, permitted SCHEMA when tariff data is schema-specific. The HMO tariff UI/client exists, but its backend controller contract is marked proposed/greenfield in `docs/TARIFF_UPLOAD_API_CONTRACT.md`; verify actual backend support before relying on it.
- The standalone `hmo_plans` design must be reconciled with the clarified Schema-centered private coverage rule before implementation. Do not add it as a competing coverage identity or switch enrollee import to `hmo_plan_id` unless its relationship to the canonical private Schema is explicitly defined. See `docs/HMO_PRIVATE_PLAN_RECONCILIATION.md`.
- Numeric code-request status is part of the current API/UI vocabulary: `0` pending/default, `1` granted/issued, `2` submitted/awaiting billing or vetting, `3` vetted, `9` declined. Check individual workflows and current backend contract before changing semantics; older documents differ on some labels.

## Architecture and security

- API base URL is centralized in `NEXT_PUBLIC_API_BASE_URL`, including `/api/v1`. `.env.example` documents local `http://127.0.0.1:8000/api/v1` and production `https://api.cybernetsystems.ng/api/v1`. If unset, the client falls back to `/api/v1`, but `next.config.ts` has no proxy/rewrite configured, so this fallback targets the Next.js server and will not reach Laravel by itself.
- Axios API client attaches `Authorization: Bearer <hmo_token>` from browser `localStorage` and, when present, `X-MEDiX-Activation-Context` from `sessionStorage` key `medix_activation_context`.
- A 401 clears `hmo_token` and `hmo_user` and redirects to `/landing` only when a token existed; login/activation errors without a session are passed to the caller. A 403 emits `hmo:forbidden`, which `AppShell` converts into an error toast.
- Auth context restores a token through `/auth/user`, clears React Query data when identity changes/logs out, and exposes `hasOrgPermission`. Org-admin users pass client-side permission checks; server enforcement remains mandatory.
- `AppShell` protects application routes, leaves onboarding/auth routes public, requires successful deployment bootstrap for protected screens, and offers a sign-out route when deployment context is missing/unavailable.
- Do not use frontend HMO IDs as security boundaries. Never put passwords, API secrets, or database credentials in persistent browser storage. Current app stores bearer token and serialized user in localStorage; treat this as existing behavior, not proof of an ideal security model.
- Local SQLite/OPFS, offline synchronization queues, installation/licensing enforcement, and full local operational caching are future architecture in the specs, not implemented foundations in this frontend. `useInstallationId` and `useDeviceId` currently provide browser-persisted UUIDs; they do not themselves implement a server-authoritative installation/licensing system.

## White-label deployment and onboarding

`DeploymentContext` calls `GET /client/bootstrap`. On shared hosts (`localhost`, `127.0.0.1`, configured `NEXT_PUBLIC_SHARED_APP_HOST`, default `med-max-hmo.vercel.app`), it skips bootstrap without an activation context and moves to `needs_activation`. The API client sends the activation context header when available. A successful bootstrap updates document title, favicon, and the first valid organization color as `--accent`; therefore branding is partly dynamic, though generic product branding may remain in metadata and some UI.

The app has two registration concepts that must not be conflated:

1. The commercial self-service HMO wizard at `/onboarding` uses server registration drafts: create draft, CAC verification with explicit consent, applicant confirmation, then final submission/provisioning. The password is entered and held in the wizard flow to support subsequent login; never log or persist it unnecessarily. Draft progress uses local storage for resumability. Successful provisioning returns an activation context which is stored for later bootstrap/API calls.
2. Existing staff/HMO invitation activation includes staff access request, token lookup, OTP, password setup, HMO organization invitation completion, and email invitations. Schema-invited first-admin flows and subsequent HMO staff flows are distinct from commercial self-service registration. `src/api/auth.ts` includes legacy `register-hmo` and invite paths alongside newer draft registration methods; verify which live UI path and backend route are authoritative before modifying onboarding.

The detailed frontend/backend contract and known deployment risks are in `docs/MEDiX_HMO_BACKEND_FRONTEND_ALIGNMENT_PROMPT.md`. In particular, shared-host tenant resolution, trusted Origin/CORS handling, activation-context lifecycle, draft idempotency, duplicate registration handoff, generic login failures, safe JSON errors, deployment migrations, and cross-tenant tests require backend verification. The frontend contract does not prove the remote backend is currently healthy or aligned.

## API conventions and integrations

`src/api/apiClient.ts` documents a dual response style:

- New HMO operational API resources generally return `{ success, message, data, meta }`; call `unwrapEnvelope` where the API module expects that envelope.
- Older org administration endpoints and deployment/auth registration endpoints may return direct or endpoint-specific JSON shapes. Do not unwrap them indiscriminately or change response contracts without coordinating backend and frontend.

API modules cover authentication/deployment, enrollees, code requests, providers/schema-plan operations, claims/financial reports, tariffs, and organization users/roles/permissions/invitations. React Query hooks wrap user/role/permission/invitation operations and dashboard data.

The direct code-request contract is documented as implemented in `docs/CODE_REQUEST_DIRECT_API_CONTRACT.md`: treatment catalog is enrollee-aware; direct request submission accepts enrollee, diagnosis, treatment/service IDs, and an optional referral provider/treatment pair; server generates P-Codes and persists child records transactionally. Client-supplied `p_code`, `code_status`, `hmo_id`, and `user_id` must not be trusted. Referral providers must be connected to the HMO and exclude the enrollee's current provider. Read-only enrollee/provider lookup may allow either operations or call-center permission, while writes remain permission-scoped. The call-center quick-create `AddRequestPanel` is separately identified as unresolved/misaligned; prefer the complete `/manage-codes/new` flow until verified.

## Current application capabilities

The Next.js App Router client contains public landing/login/register-type routes; commercial onboarding; staff token/OTP/password and invitation routes; and authenticated areas for dashboard, enrollees (list/register/import), call center, code requests, vetting, billing and financial reports, provider marketing/details, tariffs/schemes, settings, and user/role/permission/invitation administration.

The application shell uses `AuthContext`, `DeploymentContext`, `ToastContext`, React Query, responsive layout/navigation, and shared UI components. Dashboard statistics are fetched from existing APIs through `useDashboardStats`; financial report aggregates are calculated from fetched data where implemented. Do not assume all pages or backend integrations are fully functional simply because a screen exists.

## Project tooling and code constraints

- Stack: Next.js `16.2.7` App Router, React `19.2.4`, TypeScript strict mode, Axios, TanStack Query, React Hook Form, Zod, date-fns, lucide-react, ESLint 9.
- Next.js in this repository has breaking changes relative to common examples. **Before writing Next.js code, read the relevant version-specific guide under `node_modules/next/dist/docs/` as required by `AGENTS.md`.** The repository uses `src/proxy.ts`; do not introduce `middleware.ts` based on older conventions.
- Keep API calls in `src/api`, shared behavior in contexts/hooks/components, and use established CSS variables/components in `src/app/globals.css` where practical. Preserve existing route/API contracts unless a coordinated change is intended.
- Do not invent financial or operational metrics. If no integrated source exists, show a clear unavailable state rather than fabricated values.
- Do not add navigation to nonexistent routes or treat planning documents as implementation evidence.
- `CLAUDE.md` contains only `@AGENTS.md`; `README.md` is the default create-next-app starter and is not a complete project guide.

## Source documents and precedence

Use the Markdown specs as project context, but check dates/status and code before acting. These documents overlap and some earlier proposals are superseded by later audits or implementation notes:

- `MedMax_Master_Technical_Blueprint.md`: broad future multi-application, data ownership, local storage/offline, licensing, synchronization, tariff/enrollee, and migration architecture.
- `MedMax_HMO_Onboarding_ClaudeCode_Implementation_v2.md`: detailed onboarding, local SQLite, provider relationship, HMO bootstrap, and interface proposal.
- `MedMax_HMO_Implementation_Priority_and_UIUX_Plan.md`: implementation sequencing and UI/UX goals; it explicitly requires auditing existing code and backend first.
- `IX2_HMO_ONBOARDING_AUTH_FLOW.md`: older auth proposal; compare with current frontend and newer registration plan because onboarding direction has evolved.
- `docs/HMO_ONBOARDING_AND_LOCAL_DB_PLAN.md`: scoped first-use plan and addenda; SQLite phase 1 is a plan, and the doc records backend verification findings and unresolved invitation/installation work.
- `docs/MEDMAX_HMO_IMPLEMENTATION_PLAN.md`: audit-based Sprint 1 scope/state, backend dependency list, and implemented-versus-deferred distinction.
- `docs/IX2_APP_BACKEND_REQUIREMENTS.md` and `docs/IX2_APP_CRITICAL_FIXES_REQUIRED.md`: backend audit/gap snapshots, including tenant scoping, route/controller, status, claims, and reporting issues. They describe backend work outside this repository and may be time-sensitive; verify current backend before acting.
- `docs/TARIFF_UPLOAD_API_CONTRACT.md`: proposed backend tariff contract; frontend support does not mean backend implementation exists.
- `docs/CODE_REQUEST_DIRECT_API_CONTRACT.md`: direct code-request flow marked implemented and verified at time of writing.
- `docs/HMO_PRIVATE_PLAN_INTEGRATION_PROMPT.md`: unresolved private-plan/product-model question.
- `docs/HMO_PRIVATE_PLAN_RECONCILIATION.md`: frontend and SQL-dump evidence plus the clarified Schema-centered private coverage rule; backend runtime/production state still needs verification.
- `docs/IX2_HMO_White_Label_Client_Architecture.md`, `docs/MEDiX_HMO_Interface_Commercial_Deployment_Prompt_Consolidated.md`, and the MEDiX frontend/backend/alignment prompts: white-label, commercial deployment, registration/CAC, API security and contract guidance; these contain proposed requirements and later verified-gap updates.

When requirements conflict, prefer the user's latest instruction, repository `AGENTS.md`, current source code and current API contract, then the most recent audit/implementation notes. Treat aspirational plans as design intent, not shipped facts. Do not assert that backend code or production infrastructure was inspected unless it was actually available and read in the current work.

## Known caveats to re-check before related changes

- Backend audit docs reported historical tenant-scoping and HMO endpoint gaps, including provider and vetted-claim isolation, code-request action/status behavior, financial-report stubs, and missing tariff endpoints. These are important security/availability questions, but snapshots may be stale; verify live backend routes/controllers/migrations and tests before changing integration assumptions.
- `docs/TARIFF_UPLOAD_API_CONTRACT.md` explicitly labels the proposed HMO tariff controller as not built at the time of its audit.
- Financial export and other reports may be placeholders; inspect the API implementation and page before representing them as complete.
- Provider schema/HMO foreign-key assumptions in old specs are stale where replaced by pivot relationships.
- P-Code status labels differ between some planning materials; use endpoint-specific behavior and tests.
- Commercial deployment security is server-dependent. A client-side activation context/header or bootstrap check is not tenant isolation by itself.

## Working approach for future Codex tasks

First inspect the relevant current source and its API module, read `AGENTS.md` and the applicable Next.js 16 docs before Next.js edits, and consult the relevant contract/spec. Keep changes scoped, preserve neighboring workflows, distinguish planned work from verified behavior, and report any backend dependency plainly. Run checks only when requested or otherwise required by the user/task instructions.
