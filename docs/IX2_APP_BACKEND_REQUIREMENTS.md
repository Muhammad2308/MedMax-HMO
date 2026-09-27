# IX2-App Backend Requirements — HMO-App Gap Analysis

**Backend location:** `C:\Users\DELL\Desktop\IX2 App\IX2 App\IX2 App` (Laravel root — the folder is nested three deep on disk; this is the innermost one, containing `artisan`, `composer.json`, `app/`, `routes/`, `database/`).
**This document does not implement backend code.** It records what a code-level audit of the Laravel app found, so `IX2-App` work can be planned and executed as its own tracked effort. All findings below are from reading actual routes/controllers/models/migrations, not from the pre-existing planning docs already in that folder (those are cross-checked in §4).

---

## 0. Update (2026-09-18) — verification of the first `Api\V1\HMO` delivery

A "Backend API Updates" note claimed the §1/§2 gap below was closed: the five missing controllers built, tenant scoping automatic, response envelope standardized. Re-read every new controller directly (not just the route registrations) before updating the frontend on the strength of that claim, per this document's own rule of verifying against code. Result: **partially true, with two serious regressions the note didn't mention.**

**Confirmed true, and the frontend (`src/api/apiClient.ts`, `enrollees.ts`, `codeRequests.ts`, `providers.ts`, `claims.ts`) has been updated to match:**
- The five routes/controllers genuinely exist and are registered (`routes/api.php`, `hmo` prefix group, lines ~133–186).
- The `{success, message, data, meta}` envelope is real — `app/Traits/ApiResponse.php::successResponse()` — and only applies to this new controller group; `hmo/org/*` (users/roles/permissions) still returns its old ad hoc shapes (`{users: [...]}` etc.) and was deliberately left untouched.
- `EnrolleeController` and `CodeRequestController` (index/show/store/assign/decline/vet/referrals) genuinely scope every query by `where('hmo_id', $request->user()->hmo_id)`.

**False or incomplete — not fixed on the frontend, because these are backend bugs, not a contract the frontend can work around:**

1. **Cross-tenant data leak, confirmed by reading the code.** `ProviderController@index/show/update/schemas` run `Provider::all()`, `Provider::findOrFail($id)`, `Schema::all()` with **no `hmo_id` filter at all** — the code even has an inline comment admitting it ("For simplicity, retrieving providers directly. Ideally they are linked via a pivot or hmo_id."). `ClaimsController@vettedClaims` runs `CodeVetted::all()`, same issue. Right now, any HMO's staff can list, view, and **edit** every other HMO's providers, and can see every other HMO's vetted claim amounts. This directly contradicts the update note's claim ("automatically filters all database queries... you do not need to pass hmo_id") for 2 of the 5 controllers, and is exactly the "HMO A user → HMO B resource" case this document's §2 P1 and the master plan's §30 call out as the thing to test for. **This needs to be fixed on the backend before any of `ProviderController` or `ClaimsController@vettedClaims` is used against real data** — add `where('hmo_id', ...)` (or the relevant Schema↔HMO/Provider↔HMO pivot join, since providers aren't owned by a single HMO — see `schema_hmos`/`schema_providers` from §3) to every query in both controllers.
2. **`CodeRequestController@assign/decline/vet` write to the wrong field and don't implement the actual action.** Each does `$codeRequest->update(['status' => 'assigned'])` (a string) with a comment placeholder ("// Implement assign logic") — but every frontend consumer (`Badge`, dashboard, billing, manage-codes, call-center, vetting) reads a **numeric** `code_status` column (0/1/2/3/9), not `status`. `assign()` also never persists the submitted `p_code`. As shipped, calling assign/decline/vet from the HMO-App will silently write to a column the rest of the system doesn't read, and P-Code assignment won't actually record a P-Code. Needs the real field name and the real assignment logic, not a placeholder.
3. **`ClaimsController@financialReport` is a stub** — always returns `[]`. The frontend's Financial Report page (already fixed this sprint to compute real aggregates instead of hardcoded ones) will now correctly show ₦0 across the board, which is an honest reflection of a stub, not a frontend bug — but it means no real financial reporting exists yet.
4. **Two routes the frontend already calls are not registered:** `GET /hmo/vetted-claims/{id}` and `GET /hmo/reports/financial/export`. Both will 404. Left the frontend calls in place (harmless — they only fire if a screen calls them, and none currently do) rather than removing working-looking code for routes that may simply not be built yet.
5. **`MarketingController@createSchemaPlan`** creates a `SchemaPlan` without attaching any HMO/tenant attribution — the plan isn't linked back to the requesting HMO at all, so it's unclear what "HMO uploads a schema plan" is supposed to persist here. Needs clarification + a real column/relation.
6. **Permission-seeding mismatch (functional, not a leak).** The whole new route group requires `can:schema_management_access`. But the *only* place that permission is granted is `is_org_admin` (bypasses all gates) or a manual grant — it is **not** one of the permissions seeded to the default HMO staff roles. `AuthController.php`/`SchemaHmoController.php` seed `Call Center Officer → call_center_access`, `Operations Officer → operations_access`, `Accounts Officer → accounts_access` (matching this plan's own §19 Phase C default roles) — none of which is `schema_management_access`. As it stands, a freshly-onboarded Call Center Officer, Operations Officer, or Accounts Officer **cannot call any of these five new controllers**, only an org admin can. This wasn't flagged in the update note. Needs a decision: either grant `schema_management_access` as part of default role seeding, or (better fit for the existing route comments, which already group enrollees/providers/code-requests/claims logically) split the single gate into the three granular ones that already exist and are already seeded, matching each route sub-group to the role that should use it. The HMO-App's `Sidebar.tsx` was deliberately **not** changed to route around this — it still checks the granular permissions, which is what should actually govern access once the backend grants them correctly; changing the frontend to check `schema_management_access` instead would just mask this gap rather than fix it.

None of items 1–6 were addressed on the frontend, because none of them are things a frontend contract change can fix — they need backend changes. Re-verify with the same method (read the controller, not the route list) before trusting the next "this is now implemented" note.

---

## 1. Critical finding: the HMO-App frontend calls routes that don't exist yet

The Next.js HMO-App (`src/api/*.ts`) already calls a full `/api/v1/hmo/*` contract:

| Frontend call | Expected route | Backend status |
|---|---|---|
| `enrolleesApi.getAll/getById/register/updatePhoto/export` | `GET/POST /hmo/enrollees*` | **Missing.** No `Api\V1\HMO` enrollee controller. Equivalent logic exists only in `Api\V1\Schema\EnrolleeController` (schema-scoped) and legacy `Admin\EnrolleeController` (Blade). |
| `codeRequestsApi.getAll/getById/create/assign/decline/vet`, `getReferrals` | `GET/POST /hmo/code-requests*`, `GET /hmo/referrals` | **Missing.** `routes/api.php`'s `hmo/call-center` prefix is an empty stub (one commented-out route). Equivalent logic exists only in legacy `Admin\CodeRequestController`, `Admin\ManageCodeController`, `Admin\CRequestController` (Blade, `routes/web.php`). |
| `providersApi.getAll/getById/create/update/getSchemas/createSchemaPlan` | `GET/POST/PUT /hmo/providers*`, `GET /hmo/schemas`, `POST /hmo/marketing/schema-plans/create` | **Missing** as HMO-namespace routes. `Provider`, `Schema`, `SchemaPlan` models and `Api\V1\Schema\SchemaProviderController`/`SchemaHmoController` exist, but nothing exposes provider/schema data under the `hmo` prefix. |
| `claimsApi.getVetted/getVettedById/getFinancialReport/exportReport` | `GET /hmo/vetted-claims*`, `GET /hmo/reports/financial*` | **Missing.** `CodeVetted` model and migrations exist; only legacy `Admin\CodeVettedController`/`Admin\CodeBilling` (Blade) read them. `routes/api.php`'s `hmo/finance` prefix is an empty stub. |
| `orgUsers.ts` / `orgRoles.ts` / `orgPermissions.ts` (already working per `manage-users/**`) | `hmo` org user/role/permission management | **Exists.** `Api\V1\HMO\OrgUserController`/`OrgRoleController`/`OrgPermissionController` are real and this is why `manage-users` works today. |

**Conclusion:** the HMO-App's enrollee, call-center/P-Code, provider, and billing/vetting screens cannot work against a live backend right now. This is the single highest-priority backend gap — higher than any greenfield feature in the master plan — because it blocks functionality that the frontend already assumes is done.

## 2. Required work, in priority order

### P2/P5 — Build the missing `Api\V1\HMO` controllers (blocks everything else)

For each, the business logic to port already exists in a legacy Blade controller — this is a port-and-scope job, not new logic from scratch:

| New controller | Routes | Port from |
|---|---|---|
| `Api\V1\HMO\EnrolleeController` | `GET /hmo/enrollees`, `GET /hmo/enrollees/{id}`, `POST /hmo/enrollees/register`, `POST /hmo/enrollees/{id}/photo`, `GET /hmo/enrollees/export` | `Admin\EnrolleeController`, `Admin\EnrolleeSchemaController` |
| `Api\V1\HMO\CodeRequestController` | `GET/POST /hmo/code-requests`, `GET /hmo/code-requests/{id}`, `POST /hmo/code-requests/{id}/assign`, `POST /hmo/code-requests/{id}/decline`, `POST /hmo/code-requests/{id}/vet`, `GET /hmo/referrals` | `Admin\CodeRequestController`, `Admin\ManageCodeController`, `Admin\CRequestController` |
| `Api\V1\HMO\ProviderController` | `GET/POST/PUT /hmo/providers*`, `GET /hmo/schemas` | `Provider` model directly; mirror read patterns from `Api\V1\Schema\SchemaProviderController` |
| `Api\V1\HMO\MarketingController` (or fold into ProviderController) | `POST /hmo/marketing/schema-plans/create` | `SchemaPlan` model; no existing controller — new, but the model/migrations already exist |
| `Api\V1\HMO\ClaimsController` | `GET /hmo/vetted-claims*`, `GET /hmo/reports/financial*` | `Admin\CodeVettedController`, `Admin\CodeBilling` |

Every one of these **must** apply explicit `where('hmo_id', $request->user()->hmo_id)` (or equivalent) tenant scoping on every query — see §3, this is not optional and is not currently guaranteed by any framework-level mechanism.

Also verify (flagged, not confirmed): migration `2026_06_23_100010_create_hmo_claims_table.php` creates an `hmo_claims` table with no corresponding `HmoClaim` Eloquent model found in `app/Models`. Read that migration and decide whether `ClaimsController` above should use a new `HmoClaim` model or reuse `CodeVetted` — do not assume.

### P1 — Tenant query-scoping (security-critical, not just the new HMO controllers)

Current state: `AuthGates` middleware (registered in both `web` and `api` groups, `app/Http/Kernel.php`) resolves the user's org id and defines per-permission Laravel Gates — this governs **authorization** (can this user perform this action), not **row-level scoping** (which rows can this user see). No `BelongsToTenant` trait or global scope exists anywhere in `app/`. Each of the ~78 existing controllers must remember to manually `where()` by the tenant column, and this has not been verified consistent. Concretely:

- Add a reusable tenant-scoping mechanism (global scope on tenant-owned models, or a base controller/trait applied consistently) rather than relying on every new/existing controller remembering it by hand.
- Audit existing HMO-adjacent controllers (`OrgUserController`, `OrgRoleController`, `OrgPermissionController`, and the new ones from §2) specifically for `hmo_id` leakage — a user from HMO A must not retrieve HMO B's enrollees/code-requests/providers by ID substitution. Write the explicit cross-tenant tests the master plan calls for in its §30 ("HMO A user → HMO B resource" etc.) against these endpoints once built.

### P20 — API response envelope

No `{success, message, data, meta}` structure exists anywhere (confirmed: no `app/Http/Resources` directory, controllers return ad hoc `response()->json([...])` shapes that differ per endpoint). Two consequences for planning:

1. New `Api\V1\HMO\*` controllers from §2 should adopt the standard envelope from the start (master plan §20) rather than copying the legacy ad hoc shapes.
2. The current frontend API client (`src/api/*.ts`) expects raw arrays/objects in `response.data` (e.g. `enrolleesApi.getAll()` is consumed as `res.data` directly, an array). If the backend adopts the `{success, data, meta}` envelope, the frontend API layer needs a corresponding small update (`res.data.data` instead of `res.data`) — sequence this as one coordinated change, not independently, to avoid breaking the working `manage-users` screens that already consume the current ad hoc shapes from `OrgUserController` etc.

### P3.2/P14 — Installation identity and licensing (confirmed greenfield)

Zero matches for "installation" or "license" across `app/Models`, `app/Http/Controllers`, `database/migrations`. Only `DeviceSession` (`device_identifier`, `device_name`, `ip_address`, `last_active_at`, `is_recognized`) exists, which covers device recognition but not the plan's fuller `Installation → Devices/App Version/License/Feature Entitlements` hierarchy. This is new work with no existing code to port, and is lower priority than §2/§1 since nothing in the current frontend depends on it yet.

## 3. What already exists and should NOT be re-planned or re-built

Confirmed working, do not duplicate:

- **Auth**: Laravel Sanctum, device-identifier recognition, staff invite/OTP activation, HMO org invite-token flow — matches `IX2_HMO_AUTH_USERMGMT_PROMPT.md` and is why HMO-App's login/onboarding pages work today.
- **Org user/role/permission management**: `Api\V1\HMO\OrgUserController/OrgRoleController/OrgPermissionController` — real, working, this is why `manage-users/**` functions in the frontend.
- **Enrollee OTP self-service app** (separate from the HMO admin portal): `Api\V1\Enrollee\AuthController` (`enrollee/auth/schemas|lookup|verify-otp`, `enrollee/me|providers|change-provider`) — matches `IX2_ENROLLEE_INTEGRATION_PLAN.md`/`IX2_ENROLLEE_FRONTEND_PROMPT.md` exactly.
- **Schema↔HMO / Schema↔Provider network**: `schema_hmos` / `schema_providers` pivot tables and `SchemaHmoController`/`SchemaProviderController` with invite-token flows — this is exactly what `IX2_INDEPENDENT_ORG_NETWORK_DESIGN.md` and `Implementing_the_Schemas_Hmos_Providers_plan` describe as needed, and it is already built. Treat those two docs as historical, not a backlog.
- **HCP-side billing**: `provider_invoices`, `invoice_line_items`, `provider_wallets`, `provider_settlements` tables + `Api\V1\HCP\BillingController` — real, but provider-facing only. The HMO-facing view/approval side of the same data (master plan §17 Accounts UI) is what's missing, not the underlying tables.
- **`public_id` UUID rollout** across code-request sub-tables — matches `IX2_SECURITY_AND_SCHEMA_CHANGES.md`, already done.

## 4. Cross-check against existing planning docs in the backend folder

The backend root already contains ~20 planning/prompt markdown files. Before doing further planning work there, note:

- `IX2_HMO_FRONTEND_PROMPT.md`, `IX2_HMO_SYSTEM_FLOW_PROMPT.md`, `IX2_HMO_ONBOARDING_FLOW_PROMPT.md` describe intended Call Center/Vetting/Accounts screens and in places assert onboarding-adjacent work is "already implemented, do not touch." That claim checks out for auth/onboarding (§3 above) but **does not** check out for Call Center/Finance — those API namespaces are empty stubs despite the frontend screens existing. Don't trust "already done" language in these docs for anything outside auth/org-management without re-verifying against actual routes, as done in this audit.
- `IX2_HMO_PRIVATE_PLAN_DESIGN.md` describes private (non-government-scheme) HMO plans; no corresponding migration/model exists — still fully pending, no conflict.
- `IX2_ENROLLEE_INTEGRATION_PLAN.md` is implemented as described (§3) — no further action needed on that doc.
- `IX2_INDEPENDENT_ORG_NETWORK_DESIGN.md` / `Implementing_the_Schemas_Hmos_Providers_plan` are implemented as described (§3) — no further action needed on either doc.

## 5. Suggested sequencing

1. §2 P2/P5 — the five missing `Api\V1\HMO` controllers, ported from legacy Blade logic. Unblocks the frontend screens that already exist and are already coded against this exact contract.
2. §2 P1 — tenant query-scoping mechanism, applied to the new controllers from step 1 and retrofitted to existing HMO-adjacent ones.
3. §2 P20 — response envelope, coordinated with a matching small frontend update.
4. §2 P3.2/P14 — installation identity and licensing, greenfield, once the above is stable.
