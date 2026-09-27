# HMO-App — First-Use Onboarding & Local SQLite Implementation Plan

**Status:** Planning document, written before implementation, per the established pattern in this repo (`docs/MEDMAX_HMO_IMPLEMENTATION_PLAN.md`).
**Source spec:** `MedMax_HMO_Onboarding_ClaudeCode_Implementation_v2.md` (repo root) — this plan scopes that spec's Phases 0–4 (repository audit, local SQLite foundation, startup state machine, API service layer, onboarding UI) to what's actually needed for first-use onboarding in *this* codebase. Phases 5–8 of that spec (full operational bootstrap, HMO interface modules, HCP relationship workflow) are already covered at a higher level by `docs/MEDMAX_HMO_IMPLEMENTATION_PLAN.md` and are out of scope here.
**Decision this plan is built on:** self-service "Register a New HMO" is being revived as the primary first-run path (confirmed with you directly — see §1). This reverses a decision documented in `IX2_HMO_ONBOARDING_AUTH_FLOW.md`; §1 explains exactly what that means in practice so the reversal is deliberate, not accidental.

---

## 1. What's actually in the codebase today (audited, not assumed)

Two onboarding architectures already exist in this repo, and they conflict:

| | Schema-invited (currently live) | Self-service (currently dead code) |
|---|---|---|
| How an HMO is created | A Schema admin creates the HMO record and sends the first admin an SMS token | The HMO's own admin fills a form and creates the org themselves |
| Entry point | `/landing` → `/register-type` → `/staff-token` → `/hmo-org-complete` or `/staff-otp`→`/staff-setpassword` | `/onboarding` (2-step form: org details, then admin + device) |
| Linked in nav? | Yes — the only path currently reachable from `/landing` | No — unlinked, unreachable except by typing the URL |
| Backend endpoint | `POST /auth/hmo-invite/{token}` (`SchemaHmoController::verifyInvite`), staff-request/lookup/activate | `POST /auth/register-hmo` (`Api\V1\Auth\AuthController::registerHmo`) |
| Backend status | Real, working (confirmed in earlier session audits) | **Re-verified this session, still real and working** — see §1.1 |
| Documented as canonical? | Yes, explicitly, in `IX2_HMO_ONBOARDING_AUTH_FLOW.md`: *"The existing `/onboarding` and `/onboard/*` routes remain accessible as fallbacks but are no longer linked from the UI."* | No |

**Decision:** self-service registration becomes the primary, linked, first-run path again. The Schema-invited path is **not removed** — it's still how a *second and subsequent* staff member joins an *already-existing* HMO (`IX2_HMO_ONBOARDING_AUTH_FLOW.md`'s "Path B"), and it's kept as an alternate entry for HMOs that do come from a Schema partnership. What changes is which path is primary/default on first launch, and that `/onboarding` becomes a first-class, linked, multi-step wizard instead of dead code.

### 1.1 Verified: `POST /auth/register-hmo` is ready to build on

Read `Api\V1\Auth\AuthController::registerHmo` directly (not the doc) before relying on it, consistent with how every other backend claim has been checked this session:

- Validates `hmo_name`, `hmo_email` (unique), `hmo_phone`/`state`/`city`/`address` (optional), admin `name`/`email` (unique), `password`, `device_identifier`.
- Runs inside a DB transaction: creates the `HMO`, seeds exactly the four permissions the rest of the app now expects (`call_center_access`, `operations_access`, `accounts_access`, plus `create_users`/`manage_users`/`manage_roles`/`manage_permissions`/`admin_access`), creates the four standard roles (HMO Admin gets all of them), creates the admin `User` with `is_org_admin: true, is_approved: true`, records the device via `DeviceSession::updateOrCreate`, and issues a Sanctum token.
- This is consistent with the RBAC fix verified in `docs/IX2_APP_CRITICAL_FIXES_REQUIRED.md` — an HMO created through this endpoint gets an admin who can immediately use every `Api\V1\HMO\*` endpoint. No backend change needed here.
- **Duplicate-submission safety**: the `unique:hmos,email` / `unique:users,email` validation means a retried request with the same data fails with a 422 instead of silently creating a second HMO — this satisfies the spec's §58 idempotency concern well enough for v1 *if the frontend handles that 422 correctly* (see §5.3). No new idempotency-key endpoint is needed to get this working; it's a frontend response-handling requirement, not a backend gap.

### 1.2 Confirmed gap: "installation" and "license" still don't exist on the backend

Re-confirmed (this is the third time this has been checked across this session, including the two-pass verification of the `Api\V1\HMO` delivery): there is still no `installation`, `license`, or `feature_entitlement` concept anywhere in the Laravel backend — no model, no migration, no route. The only server-side identity primitive is `DeviceSession` (`device_identifier`, `device_name`, `ip_address`, `last_active_at`, `is_recognized`), which `registerHmo` and `loginApi` already use. This plan's local SQLite `installation` table is therefore a **local-only concept for this phase** — it has nothing to validate against on the server yet, beyond the device/session check that already exists. §7 covers exactly what that means for the startup state machine, and §9 lists what would need to be built server-side to make "server-authoritative installation validation" (spec §9/§26) real.

---

## 2. Why "SQLite" needs a specific technical decision here

The v2 spec's local-database sections (§10–§14, §24) are written as if this were a native app with filesystem access. It isn't — this is a Next.js 16 app that runs in a browser tab (with `next-pwa` present in `package.json` but **not currently configured** in `next.config.ts` — confirmed by reading it; it's an unused dependency right now, not an active service worker). A browser has no raw filesystem SQLite. "Use SQLite" in this context has to mean a WASM build of SQLite persisted through a browser storage API, not a `.sqlite` file on disk.

**Decision:** use `@sqlite.org/sqlite-wasm` (the official SQLite WASM distribution) with its OPFS (Origin Private File System) persistence backend, which is the SQLite project's own recommended browser deployment path and gives real durable storage, not an in-memory database that resets on reload.

**Consequence that has to be designed for, not discovered later:** OPFS's synchronous file access API is only available inside a Web Worker, not the main thread. This means the SQLite instance has to live in a dedicated worker, and the rest of the app talks to it through a small message-passing client (`postMessage` request/response, or `Comlink` to make it feel like a normal async function call) rather than importing a database object directly into React components. This is a real architectural piece — budget for it explicitly rather than treating "add SQLite" as a drop-in library install.

**Fallback needed:** OPFS isn't available in every context (older browsers, some in-app webviews, and it behaves differently across private-browsing modes). `@sqlite.org/sqlite-wasm` supports an IndexedDB-backed VFS as a fallback when OPFS isn't available — plan to detect and fall back rather than hard-failing onboarding on unsupported browsers. If a browser supports neither, the app should still function using the existing `localStorage` token/device-id approach (which is not going away — see §4) with in-memory-only SQLite for that session; local caching just won't survive a refresh on that specific browser.

**What this deliberately does NOT change:** the current `hmo_token`/`hmo_user`/`hmo_device_id` `localStorage` keys (`AuthContext.tsx`, `useDeviceId.ts`, `apiClient.ts`'s 401 handler) keep working exactly as they do today. SQLite is additive — a local cache/installation-identity layer — not a replacement for how auth tokens are stored or how the API client authenticates. Don't migrate token storage into SQLite; that adds risk (SQLite init failures would then block login) for no benefit at this stage.

---

## 3. Local SQLite schema — Phase 1 scope only

Per the spec's own phasing (§47: *"Do not implement every operational table yet"*), this phase implements exactly three tables — enough for installation identity and a local HMO profile cache, nothing more:

### 3.1 `installation`
```
id                    (local PK)
installation_uuid     (generated once client-side via crypto.randomUUID(), persisted forever)
hmo_id                (server HMO id, once known)
hmo_public_id
hmo_name
api_base_url          (from env config — see §8)
app_version            (from package.json at build time)
installation_status    ('pending' | 'active' | 'unverified')
registered_at
last_verified_at
last_seen_at
created_at
updated_at
```
`license_status`/`license_type`/`license_expires_at` from the spec's §10.1 are **deliberately omitted** — there is nothing server-side to populate them with yet (§1.2), and adding empty/fake license fields would just be more invented data, which this codebase has spent this whole session removing rather than adding. Add them back in the phase where a real license backend exists.

### 3.2 `hmo_profile`
```
id                  (local PK)
server_hmo_id
name
state
city
address
email
phone
is_verified
is_active
server_updated_at
created_at
updated_at
```
A cache of the authoritative HMO record, refreshed on login/bootstrap — not a second source of truth.

### 3.3 `app_settings`
```
id
key
value
value_type
updated_at
```
Generic local key/value store (e.g. "last selected theme", "dismissed onboarding tips") — small, low-risk, useful scaffolding for later phases. Per spec §10.3: no passwords, no API secrets.

**Explicitly deferred to a later phase** (matches the spec's own phase 6+ sequencing and this repo's existing `docs/MEDMAX_HMO_IMPLEMENTATION_PLAN.md` priority order): `local_users`/`local_roles`/`local_permissions`/`local_role_permissions`/`local_user_roles`, `local_devices`, `schemas` cache, provider/enrollee/tariff local tables, `sync_state`/`sync_queue`. None of these are needed to get first-run onboarding working, and building them now would be exactly the "massive rewrite in one operation" this repo's own execution protocol (§31 of the master plan) warns against.

---

## 4. What does NOT change

- `AuthContext.tsx`, `apiClient.ts`, `useDeviceId.ts` — unchanged. Auth token handling stays in `localStorage` as it is today (§2).
- The Schema-invited activation path (`/register-type`, `/staff-token`, `/staff-otp`, `/staff-setpassword`, `/hmo-org-complete`) — unchanged in behavior, still fully functional for staff joining an existing HMO.
- `/onboard/[token]` — stays as-is; it's a different, older token-completion flow, superseded by `/hmo-org-complete` per the existing auth-flow doc, and out of scope for this plan.
- Every already-working operational screen (enrollees, manage-codes, billing, reports, manage-users, etc.) — untouched.

---

## 5. The multi-step registration wizard

`src/app/onboarding/page.tsx` already exists and already does most of this — it just needs to become a proper linked, stepped wizard instead of dead code, and gain the review step the spec asks for. Current state (confirmed by reading it): a single page with `Step1Fields` (`hmo_name`, `hmo_email`, `hmo_phone`, `hmo_state`, `hmo_city`, `hmo_address`) and `Step2Fields` (`name`, `email`, `password`, `password_confirmation`, `device_name`), a login form variant, a password-strength helper, and calls to `registerHmo`/`loginApi`/`verifyDevice`/`getDeviceId`. It needs restructuring into distinct, navigable steps rather than rebuilding from scratch.

> **Built (2026-09-19).** `/onboarding` is now a 3-step wizard (HMO Details → Administrator Account → Review & Confirm) using a new `OnboardingStepper` component (`src/components/ui/OnboardingStepper.tsx`), with a working Review step (edit-links back to each prior step, no password shown), the §5.2 submission progress sequence, and §5.3's duplicate-email handling (a dedicated banner + "try signing in" link, detected from the 422 response rather than shown as a generic field error). The embedded sign-in tab was removed — `/login` already exists as its own page, so keeping a second login form here was pure duplication; a "Sign in" link at the bottom replaces it. `src/app/landing/page.tsx` now leads with "Register a New HMO" as the featured, directly-clickable primary action (§6), with the activation-token and sign-in paths demoted to secondary options below it.
>
> **Installation identity, built lighter than §2/§3's full plan.** Rather than building the Web Worker + WASM SQLite + OPFS stack up front, `src/hooks/useInstallationId.ts` generates and persists an `installation_uuid` in `localStorage` (mirroring the existing `useDeviceId.ts` pattern) and sends it — along with `APP_VERSION` — to `registerHmo()`, which the backend now accepts and writes (verified in §12a/§12b). This is a deliberate, scoped substitution: it satisfies "the backend can now track this installation" today without the larger architectural commitment §2 describes, and nothing about it needs to be thrown away when the full SQLite layer is eventually built — that phase would replace the storage mechanism, not the `installation_uuid` concept or its wire format. Verified with `tsc --noEmit`, lint (same 63-error pre-existing baseline, zero new issues), and a full `npm run build` (both `/onboarding` and `/landing` still statically prerender).

### 5.1 Step sequence
Mapped from the spec's §8 "New HMO" flow, trimmed to what's actually buildable against the real backend today (no "Initial Configuration" step — there's no backend concept for it yet; no separate "Installation Registration" step — folded into submission, see §5.2):

```
1. Welcome            — "Register a New HMO" vs "I have an activation token" vs "Sign in"
                         (this is the landing-page-level choice — see §6)
2. Organization        — hmo_name, hmo_email, hmo_phone, hmo_state, hmo_city, hmo_address
3. Administrator        — name, email, password, confirm password (strength bar — already built)
4. Review               — read-only summary of steps 2–3, Edit links back to each step
5. Submit               — POST /auth/register-hmo, with the progress/error handling in §5.2–§5.3
6. Success              — store token/user, initialize local installation record (§7), redirect to dashboard
```

Use a shared `OnboardingStepper` component (new, small — a labeled progress indicator, not a router) rather than the ad hoc step-tracking already in the page, so step state and back/forward navigation are consistent and testable.

### 5.2 Submission behavior
Per spec §36 — don't freeze the screen, show real progress, and make failure recoverable:
```
Creating organization...
Creating administrator account...
Registering device...
```
These three sub-steps map directly to what `registerHmo` actually does server-side in one transaction (§1.1) — the frontend can show them as a short animated sequence rather than genuinely polling three separate calls, since the backend already does this atomically. Don't build a fake multi-request flow where a single-request one already exists correctly.

### 5.3 Failure handling
- Network failure before a response: show "Registration paused — your information has not been duplicated" (per spec §36) with a Retry button that resubmits the same payload. Because of the unique-email validation (§1.1), a resubmit either succeeds (if the first attempt never reached the server) or returns 422 (if it did) — handle the 422 case specifically with: *"An HMO with this email may already be registered. Try signing in instead."* plus a link to `/login`, rather than showing a generic validation error.
- Validation errors (422, non-duplicate): inline field errors on the relevant step, not a dead-end toast — the user needs to be taken back to the step with the bad field.

---

## 6. Landing page changes

`src/app/landing/page.tsx` currently offers exactly two choices: "Register" (→ `/staff-token`) and "Sign In" (→ `/login`). Add a third, and make the primary registration path the self-service one:

```
Register a New HMO      → /onboarding            (NEW — primary)
I have an activation token → /register-type → /staff-token   (existing Path B, relabeled for clarity)
Sign In                  → /login             (existing, unchanged)
```
Update `AppShell.tsx`'s `AUTH_ROUTES` list — `/onboarding` is already in it, no change needed there.

---

## 7. Startup state machine (first-use detection)

This is the actual "first onboarding strategy at first use" the request asked for. Scoped to what's real today (no server-side installation validation endpoint exists — §1.2):

```
App loads
   ↓
Initialize local SQLite (open/create DB in the worker — §2)
   ↓
Query local `installation` table
   ↓
   ├── Row exists AND hmo_token present in localStorage
   │        ↓
   │     GET /auth/user (existing call, already used by AuthContext)
   │        ├── 200 → update installation.last_seen_at, hydrate, go to Dashboard
   │        └── 401 → clear localStorage auth (existing behavior) AND clear the
   │                   local `installation` row (a 401 here means this device's
   │                   session is gone — don't leave a stale installation record
   │                   claiming to be associated with an HMO the token no longer
   │                   authenticates for) → Landing
   │
   ├── Row exists BUT no hmo_token in localStorage
   │        (SQLite survived, browser storage/session was cleared independently —
   │         a real scenario since these are two different browser storage areas)
   │        → Landing, but recognize the device: prefill nothing sensitive,
   │          just skip straight to "Sign In" as the suggested default rather
   │          than presenting "Register a New HMO" first, since this device has
   │          local history of already belonging to an HMO)
   │
   └── No local `installation` row at all
            → first run → Landing, all three choices shown per §6
```

On successful registration (§5) or successful login of a session with no existing local `installation` row, create/update the `installation` row from the authenticated response (`hmo` object on register, or the `GET /auth/user` response's `hmo_id` on login — note `getCurrentUser()` in `api/auth.ts` doesn't currently return the nested `hmo` object, only `user`; check whether that's sufficient or whether `hmo_profile` needs a separate fetch — likely `GET /auth/user` needs to also return the HMO record, or a follow-up call is needed. Confirm against the actual controller response shape before implementing, the same way every other backend claim in this session has been checked, rather than assuming the existing `AuthResponse` type in `api/auth.ts` already covers it — it currently types `hmo?: { id, name, email }` only on the *register* response, not on `getCurrentUser()`).

**What this deliberately does not attempt:** the spec's fuller state machine (§26) includes "suspended," "license blocked," and "revoked, start recovery" branches. None of those are reachable today because nothing server-side reports any of those states (§1.2) — building UI for states the server can never actually return would be exactly the kind of invented functionality this session has been correcting elsewhere. Add those branches when the backend work in §9 exists.

---

## 8. Environment configuration

The spec's §56 asks for `API_BASE_URL` to be environment-configurable rather than hard-coded. Current state: `apiClient.ts` hard-codes `baseURL: '/api/v1'` (a relative path, implying a proxy/rewrite handles the actual host — check `next.config.ts`/hosting config for how `/api/v1` currently resolves in dev vs. prod before changing this, since "hard-coded" here might already be handled at the infra layer rather than needing a code change). If it isn't already handled at the infra layer, move it to `NEXT_PUBLIC_API_BASE_URL` (Next.js's standard client-exposed env var convention), defaulting to the current relative path for dev. This is a small, low-risk, high-value fix regardless of the onboarding work and can be done as its own first step.

> **Resolved (2026-09-19) — confirmed there was no infra-layer proxy.** `next.config.ts` has no `rewrites()`, and no `.env*` file existed at all, so `/api/v1` was resolving against the Next.js dev server itself — every API call was failing with a network error, which surfaced as the onboarding wizard's "Registration paused" message when actually tested end to end against a running Laravel server. Fixed: `apiClient.ts` now reads `process.env.NEXT_PUBLIC_API_BASE_URL`, falling back to the old relative path only if it's unset. Added `.env.local` (gitignored, already covered by the existing `.env*` rule) pointing at `http://127.0.0.1:8000/api/v1` — the default `php artisan serve` address — and a tracked `.env.example` documenting it for anyone else setting this up. **The dev server needs a restart to pick up the new env var** (`NEXT_PUBLIC_*` values are read at server start, not per-request). If requests still fail after restarting, the next thing to check is CORS on the Laravel side (`config/cors.php`) — the frontend (`localhost:3000`) and backend (`127.0.0.1:8000`) are different origins, and this hasn't been verified to allow that origin.

---

## 9. Backend work this introduces (append to `docs/IX2_APP_BACKEND_REQUIREMENTS.md`)

Nothing here blocks Phase 1 (§3/§5/§7 work entirely against endpoints confirmed already working), but for the fuller startup state machine (§7's deferred branches) to become real rather than aspirational:

1. **An installation validation endpoint** — something like `GET /auth/installation/{installation_uuid}` or folded into `GET /auth/user`, returning enough for the client to detect suspended/revoked states server-side instead of only inferring from a 401.
2. **`GET /auth/user` should return the associated `hmo` object**, not just `user` — needed for §7's local `hmo_profile` bootstrap on login (confirmed gap: `getCurrentUser()`'s typed response in `api/auth.ts` only has `user`, no `hmo`).
3. **License concept** (§1.2) — genuinely greenfield, no existing table/model to extend. Lowest priority of the three; nothing in this plan's scope depends on it.

None of these are required to ship §3/§5/§6/§7 as scoped — they're what's needed to close the gap between this plan's Phase 1 and the spec's fuller vision.

---

## 10. Definition of done — this phase

- [ ] `@sqlite.org/sqlite-wasm` integrated behind a Web Worker + message-passing client; OPFS with IndexedDB fallback; graceful degradation (in-memory only) when neither is available.
- [ ] `installation`, `hmo_profile`, `app_settings` tables created and exercised by real app flows (not just migrated and left empty).
- [ ] `/onboarding` restructured into the 6-step wizard in §5.1, reachable from `/landing`.
- [ ] Landing page offers all three choices from §6.
- [ ] Startup state machine from §7 implemented for the branches that have real backend support today; deferred branches explicitly not built (not stubbed with fake states).
- [ ] Duplicate-registration retry handled per §5.3 (422 → "try signing in" messaging, not a raw validation error).
- [ ] `API_BASE_URL` confirmed or fixed to be environment-configurable (§8).
- [ ] No existing screen or flow regresses — Schema-invited activation path, login, and every operational module continue to work unchanged.
- [ ] `npm run lint` / `tsc --noEmit` / `npm run build` all clean, consistent with how every change this session has been verified.

---

## 11. Open items to confirm before/while implementing

- §7's note on `GET /auth/user` not returning `hmo` — needs either a backend change (§9.2) or a documented decision to make a second call on login specifically to fetch the HMO profile. Don't guess which; check the actual response once this phase starts, the same way every other assumption in this plan was checked against real code rather than the spec's pseudocode.
- Whether `next-pwa` should actually be configured (it's an unused dependency right now — §2). Out of scope for this plan since nothing here requires an active service worker, but worth a deliberate decision rather than leaving it as silent dead weight in `package.json` indefinitely.

---

# Addendum — Installation/License backend design, the invitation flow, and local-DB resilience

Three follow-up questions, answered in order. Each is grounded in the actual current backend code (`Api\V1\Schema\SchemaHmoController`, re-read in full for this addendum), not the v2 spec's pseudocode.

## 12a. Verification (2026-09-19) — first backend delivery against §12

A backend walkthrough claimed §12 was fully implemented. Re-read every file it named directly before treating any of it as usable.

| Claim | Status | Notes |
|---|---|---|
| `installations`/`licenses` migrations + models | ✅ **Real.** | `database/migrations/2026_09_18_234923_create_installations_table.php` and `..._234931_create_licenses_table.php` exist and match this plan's §12.1 schema closely (status enums `pending/active/unverified/suspended/revoked` and `active/expired/suspended/blocked` respectively). |
| `AuthController@user` now returns `hmo` | ✅ **Real, verified.** | `if ($user->hmo_id) { $response['hmo'] = HMO::find($user->hmo_id); }` — this closes the exact gap flagged in §9.2/§11 of the base plan. No frontend blocker remains on this point. |
| `GET /api/v1/auth/installation/{uuid}` | ✅ **Real, correctly public.** | Registered outside the `auth:sanctum` group (confirmed by reading `routes/api.php` directly, not just the route list), returns `{valid, status, hmo_id}` or 404 `{valid: false, status: 'not_found'}`. Shape and placement are both right for a pre-login startup check. |
| `licenses()`/`license()`/`installations()` relations on `HMO` | ✅ **Real.** | `license()` uses `latestOfMany()` — a good, idiomatic match for this plan's "keep history, most recent counts" suggestion (§12.1). |
| *(Not claimed, found by checking anyway)* **Nothing ever creates an `Installation` row.** | ❌ **Missing — this is the one piece that matters most.** | Searched the entire `app/` tree for `Installation::` usage: the only hit is the `where(...)->first()` read in `validateInstallation` itself. `registerHmo`, `verifyInvite`, and `login` were not touched — none of them accept an `installation_uuid` parameter, and none of them write an `Installation` row (unlike `DeviceSession`, which all three already do via `updateOrCreate`). **Consequence: `GET /auth/installation/{uuid}` will return 404 `not_found` for every real installation the frontend ever generates, permanently, until a write path exists.** The read endpoint is real and correctly built, but there's currently no way for a row to ever exist for it to read. This is not a minor gap — it's the difference between "the validation endpoint works" and "the validation endpoint always says no." |
| *(Not claimed, found by checking anyway)* `Installation`/`License` models have no `$fillable`. | ⚠️ **Landmine for whoever adds the write path.** | Both model files are bare (`class Installation extends Model { use HasFactory; }`, same for `License`) — no `$fillable` declared. Laravel's default is to guard all attributes when neither `$fillable` nor `$guarded` is set, so the first `Installation::create([...])` or `updateOrCreate([...], [...])` written anywhere will throw `MassAssignmentException`, not silently work. Flagging now so whoever writes the registration-side code doesn't lose time to a confusing runtime error — add `$fillable = ['installation_uuid', 'hmo_id', 'app_version', 'status', 'last_verified_at']` (and the equivalent for `License`) as part of that work, not after hitting the exception. |
| License enforcement / auto-issued license on registration | Not claimed, not built. | Consistent with the walkthrough's own careful phrasing ("future operational checks can validate...") — no `EnsureLicenseActive` middleware exists yet, and nothing auto-creates a license for a newly registered HMO, so `$hmo->license` is `null` for every HMO right now. This matches §12.3's design as *not yet started*, not a discrepancy — correctly scoped as foundation-only by whoever wrote it. |

**Net assessment:** this is real progress, not a repeat of the first backend document's overstatement pattern from earlier in this session — three of the four concrete claims check out exactly as described, including the trickiest one (route placement). But the walkthrough's closing line ("brings the backend into complete alignment with the frontend's required feature set") overstates it: the read side of installation validation exists with no write side to ever populate it, which means the startup state machine in §7 of the base plan **cannot be built against this yet** — it would query an endpoint that will always say "not found." Frontend work on the startup state machine should wait for §12b below, the same way frontend work waited last time until the tenant-isolation fixes were confirmed rather than built against.

## 12b. Exact next backend step

Also checked `login()` while verifying §12a (`sed -n '390,430p' app/Http/Controllers/Api/V1/Auth/AuthController.php`) — it has the same gap as `registerHmo`/`verifyInvite`, plus one more worth fixing alongside it: it doesn't return `hmo` either, even though `user()` now does (§12a). Since `login` is the far more common path (every returning user, every day) than `user` (only called once per session to hydrate), the frontend's local `hmo_profile` bootstrap (base plan §7) shouldn't have to make a second round-trip just to get the HMO object it could have gotten from the login response directly.

**1. Add `$fillable` to both models** (currently bare — confirmed in §12a):
```php
// app/Models/Installation.php
protected $fillable = ['installation_uuid', 'hmo_id', 'app_version', 'status', 'last_verified_at'];

// app/Models/License.php
protected $fillable = ['hmo_id', 'license_status', 'license_type', 'expires_at'];
```

**2. In `AuthController::registerHmo`, `SchemaHmoController::verifyInvite`, and `AuthController::login`** — add two optional validation fields and one `updateOrCreate` call each:

```php
// add to each method's $request->validate([...]):
'installation_uuid' => 'nullable|string|uuid',
'app_version'        => 'nullable|string',
```

```php
// add after the existing DeviceSession::updateOrCreate(...) block in each method,
// guarded so nothing breaks for any frontend build that hasn't started sending
// installation_uuid yet:
if ($request->filled('installation_uuid')) {
    \App\Models\Installation::updateOrCreate(
        ['installation_uuid' => $request->installation_uuid],
        [
            'hmo_id'           => $hmo->id, // $user->hmo_id inside login(), where there's no local $hmo variable
            'app_version'      => $request->app_version,
            'status'           => 'active', // not the migration's 'pending' default — a device that just
                                              // completed registration or a successful login is not "pending
                                              // approval" of anything; there's no approval step in this design
            'last_verified_at' => now(),
        ]
    );
}
```

**Do not make `installation_uuid` required.** The frontend hasn't been built against this yet (base plan §7 is still unimplemented pending this exact backend step) — making it required now would break the registration/login flows that are live in production today, for every user, immediately. `nullable` + `filled()` guard means it's a no-op until the frontend actually starts sending it, and becomes real the moment it does, with no coordinated deploy required on either side.

**3. In `login()`, add `hmo` to the response**, matching what `user()` already does:
```php
$hmo = $user->hmo_id ? \App\Models\HMO::find($user->hmo_id) : null;

return response()->json([
    'success'       => true,
    'message'       => 'Login successful',
    'token'         => $token,
    'is_recognized' => true,
    'user'          => $user->load('roles'),
    'hmo'           => $hmo,       // NEW
    'provider'      => $provider,
], 200);
```

That's the complete next step — nothing else is needed to unblock the startup state machine in the base plan's §7. `registerHmo`'s response already returns the full `hmo` object it just created (§1.1 of the base plan), so only `login()` and `user()` needed this; `user()` is already done.

## 12. How to implement `installation` and `license` on the backend

### 12.1 New tables

```
installations
    id
    installation_uuid      (client-generated UUID, unique, NOT a secret — never used for auth)
    hmo_id                 (FK → hmos; the installation belongs to exactly one HMO)
    device_identifier       (FK-ish, matches DeviceSession.device_identifier — an installation
                              is registered by a specific device the first time it's seen)
    app_version
    platform                (e.g. 'web')
    installation_status     ('active' | 'suspended' | 'revoked')
    first_registered_at
    last_verified_at
    last_seen_at
    created_at
    updated_at

licenses
    id
    hmo_id                  (FK → hmos)
    license_type            ('trial' | 'subscription' | 'annual' | 'multi_year' | 'lifetime')
    status                  ('active' | 'expired' | 'suspended' | 'revoked')
    starts_at
    expires_at               (nullable — null for lifetime)
    support_until             (nullable)
    installation_limit        (nullable = unlimited)
    user_limit                (nullable = unlimited)
    features                  (json — see §12.2)
    issued_by_user_id          (nullable — which Master Admin issued/changed it)
    notes
    created_at
    updated_at
```

**Why a `features` JSON column instead of a separate `license_features` join table** (the v2 spec's §10.2 proposes a table): a license in this system needs to answer one question — "is feature X on for this HMO" — and nothing in the current requirements needs per-feature metadata (source, server_version) beyond that boolean. A JSON column (`{"enrollees": true, "call_center": true, "claims": true, "offline_mode": false}`) is one migration, one column, trivially queryable in PHP, and avoids a join for every feature check. Normalize into a real table only if a concrete future need appears (e.g., per-feature expiry dates) — this matches the "smallest viable schema" approach the rest of this plan already takes (§3).

**Relationships:** `HMO hasMany installations`, `HMO hasOne activeLicense` (a query scope for `status = 'active'` — design for one active license per HMO at a time; keep expired/superseded rows for history rather than overwriting them, so there's an audit trail of plan changes).

### 12.2 Who issues licenses

There is no billing/subscription system in this codebase, and building one is out of scope here. Licenses should be issued manually, and the natural place is the **existing Master Admin surface** (`Api\V1\Admin\MasterAdminOrgController`, confirmed already handling cross-org administration in the earlier backend audit) — add license CRUD there rather than inventing a new admin console:

```
GET    /api/v1/admin/hmos/{hmo}/license
POST   /api/v1/admin/hmos/{hmo}/license        (issue/replace)
PUT    /api/v1/admin/hmos/{hmo}/license/{id}   (extend/modify/suspend)
```

### 12.3 Runtime enforcement

Add an `EnsureLicenseActive` middleware, applied at the same place the RBAC gates now live (`routes/api.php`'s `hmo` prefix group — the same location `docs/IX2_APP_CRITICAL_FIXES_REQUIRED.md` §3.1 confirmed was already correctly split into `operations_access`/`call_center_access`/`accounts_access`). On failure, return a response the frontend can distinguish from a permissions error:

```json
{ "success": false, "code": "LICENSE_EXPIRED", "message": "..." }
```

so the frontend routes to the dedicated License screen (already scoped in the original onboarding spec, §39) instead of a generic 403 toast. Don't reuse a bare 403 for this — a permissions problem and a billing problem need different UI, and conflating them was exactly the kind of ambiguity this session has been removing elsewhere (see the `schema_management_access` vs. granular-permission fix).

### 12.4 Registering an installation

Fold this into the existing `registerHmo` / `verifyInvite` transactions (§1.1, §13.3) using the same `updateOrCreate` idempotency pattern the codebase already uses for `DeviceSession`:

```php
Installation::updateOrCreate(
    ['installation_uuid' => $request->installation_uuid],
    ['hmo_id' => $hmo->id, 'device_identifier' => $request->device_identifier,
      'app_version' => $request->app_version, 'installation_status' => 'active',
      'last_verified_at' => now(), 'last_seen_at' => now()]
);
```

Add a lightweight validation endpoint for the startup state machine (§7 of the base plan, and §9.1 which asked for exactly this):

```
GET /api/v1/hmo/installation/validate?installation_uuid=...
→ { installation_status, license: { type, status, expires_at, features } }
```

This is what turns §7's currently-aspirational "suspended/license blocked/revoked" branches into real, checkable states instead of dead UI.

## 13a. Verification (2026-09-19) — invitation flow + §12b delivery

A second backend walkthrough claimed §12b and §13 were both fully implemented, including a new `HmoRegistrationService`, the branching `SchemaHmoController::store()`, and `NotificationController`. Read every file this named in full before treating any of it as usable.

| Claim | Status | Notes |
|---|---|---|
| §12b: `$fillable` on `Installation`/`License` | ✅ **Real, exact match.** | Both models now carry exactly the fields this plan specified. |
| §12b: `login()` writes `Installation` and returns `hmo` | ✅ **Real, exact match.** | Read the full method — `installation_uuid` is `nullable`, guarded with `filled()`, status set to `'active'`, and `'hmo' => $hmo` is in the response. No notes. |
| New `HmoRegistrationService::createHmoWithAdmin()` | ✅ **Real, well done.** | Genuinely consolidates the permission/role/user/device seeding that was previously duplicated between `registerHmo` and `verifyInvite`, exactly as §13.3 asked for. Handles the optional `installation_uuid` correctly (`!empty()` guard, `updateOrCreate`, `status: 'active'`). |
| `registerHmo`/`verifyInvite` refactored to use the service | ✅ **Real.** | Both now call `$registrationService->createHmoWithAdmin(...)` instead of inlining the seeding block. |
| `HmoInvitation`/`Notification` models | ✅ **Real, `$fillable` present on both.** | No repeat of the §12a mass-assignment landmine this time — both models were built with `$fillable` from the start. |
| `SchemaHmoController::store()` branches existing vs. new HMO | ✅ **Real, logic is sound.** | Existing-email path creates an `HmoInvitation` + `Notification` and returns without touching `hmos`; not-found path creates an `HmoInvitation` with a token and an `/onboarding?invite_token=` link. Matches §13.2's design. |
| `NotificationController` index/accept/decline | ✅ **Real, registered.** | `index()` correctly scopes to `hmo_id` plus `(user_id IS NULL OR user_id = current user)`, matching this plan's "null means any org admin" design (§13.3). |
| `registerHmo` accepts `invite_token`, links `schema_hmos` on success | ✅ **Real, present** — but see the bug below. | |

**Two real bugs found by reading the code, not claimed and not caught by the walkthrough:**

**Bug 1 — both `schema_hmos` inserts are missing a required column and will fail at runtime.** Re-checked the actual `schema_hmos` migration (`2026_09_05_020000_create_schema_hmos_table.php`) rather than trusting memory of it from earlier in this session: `added_by_user_id` is `$table->foreignId('added_by_user_id')->constrained('users')->onDelete('cascade')` — **not nullable, no default.** Both new code paths that insert into this table omit it entirely:

- `AuthController::registerHmo`, inside the `if ($invitation)` block: `DB::table('schema_hmos')->insert(['schema_id' => ..., 'hmo_id' => ..., 'created_at' => ..., 'updated_at' => ...])`.
- `NotificationController::acceptSchemaInvitation`: the identical shape, same missing column.

Both will throw `SQLSTATE[23000]: Integrity constraint violation: 1048 Column 'added_by_user_id' cannot be null` the first time either path actually runs — which means the entire feature this session was built for (a schema invitation being accepted, either by self-registration or by an existing HMO admin) currently cannot complete. **Fix, both places:** add `'added_by_user_id' => $invitation->invited_by_user_id` to the insert array. `HmoInvitation.invited_by_user_id` is populated in every case (`SchemaHmoController::store()` always sets it to `auth()->id()`), and using it — the schema admin who sent the invitation — is more semantically correct than trying to attribute the row to whoever happens to be completing/accepting it.

> **Resolved (2026-09-19).** Verified directly: `AuthController.php:196` and `NotificationController.php:38` both now set `'added_by_user_id' => $invitation->invited_by_user_id`. Confirmed by reading the actual code, not the report of the fix.

**Bug 2 (a consequence, not exactly a bug) — the previous schema-invited flow is now silently unreachable, and the frontend needs to catch up before any new invitation can complete.** `store()` no longer ever creates an `hmos` row with `verification_token` set — new-HMO invitations now only ever produce an `HmoInvitation` row. But `SchemaHmoController::previewInvite()`/`verifyInvite()` (routes `/auth/hmo-invite/{token}`, still registered, untouched) only ever look up `HMO::where('verification_token', $token)...` — a state nothing will ever put a row into again going forward. This is **the correct direction per this plan's own §13.2/§13.3** (self-service registration was always meant to become the only account-creation path), so it's not a mistake — but it has a sharp edge worth being explicit about: **right now, a schema admin inviting a brand-new HMO produces an `invite_url` pointing at `/onboarding?invite_token=...`, and nothing in the frontend reads that query parameter yet** (§13.4 of this plan, not yet built). Until the frontend ships that piece, a newly schema-invited HMO has no way to complete registration at all — the old path is dead, and the new path's frontend half doesn't exist yet. These two pieces need to land together, not the backend now and the frontend "eventually."

> **Resolved (2026-09-19), frontend side.** `src/app/onboarding/page.tsx` now reads `?invite_token=` via `useSearchParams` (wrapped in `Suspense` to keep the page statically prerenderable — confirmed with a real `npm run build`, `/onboarding` still shows as `○` static) and forwards it as `invite_token` in the `registerHmo()` payload when present. `RegisterHmoPayload` in `src/api/auth.ts` gained the matching optional field. `tsc --noEmit`, lint (no new errors — same 63-error baseline as every other check this session), and `npm run build` all verified clean. The loop is now closed end to end: a schema admin invites a new HMO → link lands on `/onboarding?invite_token=...` → registration completes → `schema_hmos` row created with a valid `added_by_user_id`.

**One access-control gap worth tightening, lower urgency than the two bugs above (no cross-tenant leak — `hmo_id` scoping is correct throughout, this is about who-within-an-HMO can act):** the three new routes (`notifications`, `schema-invitations/{id}/accept`, `schema-invitations/{id}/decline`) sit outside all three granular `can:` gates (`operations_access`/`call_center_access`/`accounts_access`) — confirmed by reading their exact position in `routes/api.php`, between the `hmo/org/*` block and the `can:operations_access` group. Any authenticated HMO staff member — a Call Center Officer, not just the org admin — can currently accept or decline a schema partnership on the HMO's behalf. Given this is an organizational-level decision comparable in weight to user management (which *is* gated behind `is_org_admin`/`manage_users` elsewhere), consider requiring the same here.

**One cross-app heads-up, outside this session's direct scope but worth flagging:** `SchemaHmoController::store()`'s request and response shape changed completely on the same URL and HTTP method (`POST /schema/hmos`) with no versioning. Old: required `name`/`phone`/`state`/`city`/`address`/`admin_email`, returned `{hmo, invite_token, invite_url: '.../onboard/{token}'}`. New: only `email` required, returns `{status, invite_url: '.../onboarding?invite_token=...'}` or `{status: 'existing_hmo_notified'}`. Any existing Schema-side ("IX2 Schema") frontend built against the old contract will break silently rather than with a version-mismatch error. Not this session's app to fix, but worth relaying.

## 13. A better Schema → HMO invitation flow

### 13.1 What's actually there today (re-read in full for this addendum)

`SchemaHmoController` currently supports exactly **one** path: `store()` always creates a brand-new, unverified `HMO` row and a token; `verifyInvite()` always creates a brand-new admin user, brand-new roles, and brand-new permissions. There is no branch anywhere for "this HMO already exists." Two concrete problems this creates for what you're asking for:

1. **No existing-HMO path exists at all** — `store()`'s validation (`'email' => 'required|email|unique:hmos,email'`) would actively *reject* an attempt to invite an HMO whose email is already registered, rather than routing to an acceptance flow.
2. **`hmos.schema_id` is a direct single column, not the `schema_hmos` pivot** — `store()` writes `'schema_id' => $this->schemaId()` straight onto the `hmos` row. The `schema_hmos` many-to-many pivot table already exists in migrations (confirmed in the earlier backend audit — `2026_09_05_020000_create_schema_hmos_table.php`) but `SchemaHmoController` doesn't use it. This is the exact same pattern that was just fixed for providers (`providers.hmo_id` direct column → `hmo_providers` pivot, in `docs/IX2_APP_CRITICAL_FIXES_REQUIRED.md` §1.1) — an HMO, per the pivot table's own existence, is meant to be able to relate to multiple schemas, but the code currently hard-codes one. This has to be fixed as part of building the flow you're asking for, because "an already-registered HMO accepts a new schema relationship" is structurally impossible on a single-FK column — accepting a second schema invite would silently overwrite the first.

### 13.2 Proposed flow

```
Schema admin enters an HMO's email/name to invite
        ↓
Backend checks: does an HMO with this email already exist?
        ↓
   ┌────────────────┴────────────────┐
   ▼ YES (registered)                 ▼ NO (unregistered)
Create HmoInvitation                 Create HmoInvitation
  (hmo_id = existing, status=pending)  (hmo_id = null, status=pending,
Notify that HMO's admin(s) in-app       target_email/name/phone captured,
        ↓                               invite_token generated)
HMO admin logs in, sees notification   Send SMS/email with a registration
        ↓                               link: {HMO_APP_URL}/onboarding
Accept → create schema_hmos row         ?invite_token={token}
  (server + triggers local cache            ↓
   refresh on next bootstrap)          HMO admin opens link → lands on the
        ↓                              SAME self-service wizard from §5,
Decline → mark declined, no            pre-filled with nothing sensitive,
  relationship created                 but carrying the invite_token
                                             ↓
                                        Wizard completes → POST /auth/register-hmo
                                        (now accepting an optional invite_token)
                                             ↓
                                        HMO + admin created (existing logic,
                                        unchanged) AND schema_hmos row created
                                        AND HmoInvitation marked accepted
```

### 13.3 Concrete backend changes

**New table:**
```
hmo_invitations
    id
    schema_id
    hmo_id                  (nullable — set once matched/created)
    target_email             (used to match an existing HMO, or to invite a new one)
    target_admin_name        (nullable — only meaningful for the unregistered path)
    target_admin_phone       (nullable)
    invite_token              (nullable — only generated for the unregistered path)
    token_expires_at
    status                    ('pending' | 'accepted' | 'declined' | 'expired')
    invited_by_user_id
    created_at
    updated_at
```

**New endpoint** — replaces the "always create a new HMO" assumption in `store()` with a branch:
```php
// POST /api/v1/schema/hmos/invite
$existing = HMO::where('email', $request->target_email)->first();

if ($existing) {
    $invitation = HmoInvitation::create([
        'schema_id' => $this->schemaId(), 'hmo_id' => $existing->id,
        'target_email' => $request->target_email, 'status' => 'pending',
        'invited_by_user_id' => auth()->id(),
    ]);
    Notification::create([
        'hmo_id' => $existing->id, 'type' => 'schema_invitation',
        'title' => "Invitation from {$schemaName}",
        'data' => ['schema_id' => $this->schemaId(), 'invitation_id' => $invitation->id],
    ]);
    return response()->json(['status' => 'existing_hmo_notified']);
}

$token = Str::uuid()->toString();
$invitation = HmoInvitation::create([
    'schema_id' => $this->schemaId(), 'hmo_id' => null,
    'target_email' => $request->target_email,
    'target_admin_name' => $request->admin_name, 'target_admin_phone' => $request->admin_phone,
    'invite_token' => $token, 'token_expires_at' => now()->addHours(72), 'status' => 'pending',
    'invited_by_user_id' => auth()->id(),
]);
// TODO: send SMS/email with {HMO_APP_URL}/onboarding?invite_token={$token}
return response()->json(['status' => 'invite_sent_for_registration', 'invite_url' => ...]);
```

**Acceptance endpoints** (authenticated, for the already-registered path):
```
GET  /api/v1/hmo/notifications                          list, includes pending schema invitations
POST /api/v1/hmo/schema-invitations/{id}/accept          creates schema_hmos row, marks accepted
POST /api/v1/hmo/schema-invitations/{id}/decline          marks declined
```

**`POST /auth/register-hmo` gains one optional field**, `invite_token`. If present and valid against `hmo_invitations`, after the existing transaction creates the HMO/admin/roles (§1.1 — unchanged), additionally create the `schema_hmos` row and mark the invitation `accepted`.

**`SchemaHmoController::verifyInvite()` should stop duplicating `registerHmo`'s account-creation logic.** Right now the two methods independently reimplement the identical "seed 4 permissions, seed 4 roles, create admin user, create device session, issue token" block — a maintenance hazard (already visible: both blocks are near-identical, and a future permission-seeding fix would need to be applied twice, exactly the class of bug already caught once this session for `schema_management_access`). Extract that block into a shared `HmoRegistrationService::createHmoWithAdmin(...)` and have both call it. This isn't scope creep — it's a direct prerequisite for the unified flow in §13.2, since the self-service wizard is now meant to be the *only* account-creation code path, whether initiated by the HMO or arrived at via a schema invite link.

**New `notifications` table** (minimal, matches the plan's existing "smallest viable" pattern):
```
notifications
    id
    hmo_id          (which HMO's admins can see this)
    user_id          (nullable — null means "any org admin of this hmo_id")
    type
    title
    body
    data             (json)
    read_at
    created_at
```

### 13.4 Frontend changes this requires (planning only — not built yet)

- `/onboarding` (§5 of the base plan) needs to read an optional `?invite_token=` query param, show a small "You're joining via an invitation from {schema_name}" banner (a new lightweight preview call, `GET /schema-invitations/preview/{token}`, mirroring the existing `previewInvite` pattern), and pass the token through to the final `register-hmo` submission.
- A new, small "Schema Invitations" panel for HMO admins — reads `GET /hmo/notifications`, filtered to `type = schema_invitation`, with Accept/Decline actions. This does not require building the full generic `NotificationCenter` design-system component from `docs/MEDMAX_HMO_IMPLEMENTATION_PLAN.md` §10 right now — a small dedicated panel is enough for this feature, and it naturally becomes the first real consumer of that component later rather than needing to build the general abstraction speculatively now.
- On acceptance, the local SQLite cache (per your phrasing, "the local schema_hmo table") gets refreshed on next bootstrap from the server's `schema_hmos` data — this is exactly the `hmo_schema_relationships` local table the base plan (§13, "SCHEMA Cache") explicitly deferred pending confirmation the backend relationship existed. It now does (§13.3), so this table moves from "deferred, unconfirmed" to "in scope once §13's backend work ships" — still not Phase 1, but no longer blocked on an open question.

## 14. Local database resilience, recovery, and protection

### 14.1 The governing fact that makes this simple: nothing authoritative ever lives only in SQLite

Restating §2/§4 of the base plan plainly, because it's the answer to all three parts of this question: MySQL, via the Laravel API, is the **only** authoritative store for HMO, user, role, permission, enrollee, provider, and claims data. The local SQLite tables scoped for this phase (§3: `installation`, `hmo_profile`, `app_settings`) are a cache and a local identity marker — never the sole copy of anything. Login (`loginApi` → Sanctum token → `localStorage`) is completely independent of SQLite's existence or condition. **This means: if the local database is broken, deleted, or was never created (fresh browser, cleared site data, new device), every user — admin or staff — can still log in and reach their account normally, because authentication was never routed through it.** The scenario you're describing (local DB gone, but the admin's and staff's accounts still exist server-side) already can't lock anyone out, by construction, not by a recovery feature bolted on afterward.

### 14.2 What actually happens when it's gone

This is already the "no local `installation` row" branch of the startup state machine in §7 of the base plan — restated here to answer the recovery question directly:

```
User opens the app on a device with no local SQLite data (deleted, corrupted, or new)
        ↓
Local `installation` table query returns nothing
        ↓
Landing page shown (same as any first visit)
        ↓
User signs in with their existing email/password — this works regardless of
local DB state, per §14.1
        ↓
GET /auth/user succeeds
        ↓
App detects: authenticated, but no local `installation` row
        ↓
Generate a NEW installation_uuid client-side (the old one, if any, is
unrecoverably gone — and that's fine, see §14.3) and call
POST /api/v1/hmo/installation (§12.4) to register it against their HMO
        ↓
Recreate local `hmo_profile` cache from the server response
        ↓
Dashboard — fully recovered, no data lost, because none was ever only local
```

No dedicated "Recovery Wizard" UI (the v2 spec's §31/§37 component) is needed for this phase — the existing login screen already *is* the recovery path, because recovery here just means "log in again and let the app re-establish its local cache," not "restore lost data." A dedicated recovery UI becomes worth building only once there's something to recover that isn't trivially re-derivable from a normal login — see §14.4.

### 14.3 Why regenerating `installation_uuid` on loss is safe

The original spec is explicit that `installation_uuid` "must not be used as a secret" (its own §7.2), and this plan has followed that throughout — it's an identifier, not a credential. Regenerating it when local storage is lost is exactly equivalent to what happens when any app is reinstalled on a new phone: a new installation identity is created and associated with the still-existing account. The server-side `installations` table (§12.1) keeps a history of every installation a device has ever registered for that HMO — old ones just age out as `last_seen_at` stops updating, they don't need to be explicitly deleted or reconciled.

### 14.4 Should SQLite be hidden so users can't delete or damage it?

No — and it isn't really possible to, which is worth being direct about rather than implying a security boundary that doesn't exist. Browser-based storage (OPFS or its IndexedDB fallback, per §2) is always ultimately under the end user's control on their own device: DevTools → Application → Clear Storage, browser settings → "Clear site data," or OS-level profile deletion will always be able to remove it, for any web app, regardless of how it's built. There is no client-side technique that changes this — anything claiming otherwise would be misleading rather than actually protective.

The correct posture — and the one this plan already has by construction (§14.1) — is **don't make anything depend on it surviving**, rather than trying to prevent it from being touched:

- Nothing is ever written to local SQLite in this phase that doesn't already exist on the server first (no offline drafts, no queued mutations — those are explicitly deferred, §3). So there's currently no scenario where deleting the local DB loses *data*, only the minor convenience of not having to re-authenticate the installation marker.
- The one thing worth actively protecting against is a **shared-device privacy leak**, not deletion: if a future phase adds any per-user local cache (`local_users`, cached role/permission data — still deferred per §3) on a device multiple staff share (e.g., a front-desk terminal), that cache should be scoped to the currently logged-in user and cleared on logout, so the next person who logs in on the same device doesn't see the previous user's cached data. Flagging this now so it's designed in from the start of whichever future phase adds those tables, rather than retrofitted after a real incident.
- When a genuine offline-mutation/sync-queue phase is eventually built (`sync_state`/`sync_queue`, explicitly deferred in §3 and in the base spec's own later phases), *that* is the point where real protection matters — because at that point local SQLite would briefly hold data (e.g., a drafted, not-yet-submitted enrollee import row) that doesn't exist anywhere else yet. The mitigation there is architectural, not "hide the database": keep the window between a local write and a successful server sync as short as possible, surface sync status visibly (per the base spec's own §42 status-indicator guidance — "Synced / Pending Sync / Sync Failed"), and never treat a local-only mutation as final until the server confirms it. That's a future-phase design concern, not something Phase 1 needs to solve, since Phase 1 has no local-only writes at all.

### 14.5 One assumption worth confirming

Your phrasing — "we will install this HMO interface project in HMO's domain" — reads as if each HMO might get its own dedicated deployment (their own subdomain or on-prem instance) rather than all HMOs sharing one central web app. This plan has been assuming the latter (one multi-tenant deployment, tenant resolved via the authenticated user, exactly as the master architecture doc requires — "No client application should connect directly to MySQL," which implies even a per-HMO-deployed frontend still talks to the same central IX2-App API, never its own database). Everything in §14.1–§14.4 holds either way, since it only depends on "the server is authoritative, the browser cache is not" — but if a genuinely separate per-HMO deployment is intended, say so explicitly, since it would change §8's `API_BASE_URL` story (each deployment would need its own build-time config pointing at the same shared backend) and would be worth its own short planning note rather than an assumption buried in this addendum.
