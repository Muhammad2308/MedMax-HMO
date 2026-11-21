# Direct Code Request — API Contract & Implementation Notes

**Status:** implemented and verified on both sides (frontend in this repo; backend in `C:\Users\DELL\Desktop\IX2 App\IX2 App\IX2 App`). 15 new backend feature tests pass against a real MySQL database (58 assertions); `tsc`/`eslint` clean on the frontend.
**Scope:** `Api\V1\HMO\CodeRequestController@store` (`POST /hmo/code-requests`) and the new `@treatmentCatalog` (`GET /hmo/code-requests/treatment-catalog`), plus the HMO-App's `/manage-codes/new` screen (the existing route serving as `IX2_HMO_FRONTEND_PROMPT.md`'s documented Screen 2.8, `/code-requests/new`).

---

## 1. What existed before

- **Frontend:** `manage-codes/new/page.tsx` and `components/AddRequestPanel.tsx` (a separate quick-create slideover used from `call-center/page.tsx`) both called `codeRequestsApi.create()` with a payload of `{ enrollee_id, diagnoses, service_ids, hmo_id: 1 /* hardcoded */ }`, and `AddRequestPanel` additionally let the user type a free-text `p_code`. Neither built against treatments (the actual authorization unit — see §3) or supported a referral.
- **Backend:** `CodeRequestController@store` was `CodeRequest::create($request->all())` — no validation, no child records (`CodeTreatment`/`CodeService`/`ReferralTreatment` never created), `hmo_id` overwritten server-side (safe) but every other field, including `code_status` and `p_code`, mass-assigned straight from the client (not safe).
- **Legacy reference implementation:** `app/Livewire/Code/RequestCodeDirect.php` (HCP-side Livewire, not currently wired into the HMO-App) has real, working business logic — code generation, treatment eligibility by scheme/plan, transactional create of a primary request plus an optional separate referral request — but assumes an HCP-provider-side authenticated user (`Auth::user()->provider_id`), which doesn't hold for HMO staff (see §2's referral-provider note).

## 2. What the new `store()` does, and where it deliberately departs from the legacy Livewire

Preserved exactly from `RequestCodeDirect`:
- p_code format: `{package_code}-{enrollment_id}/MDX{Y}{j}{n}/{first 2 treatment title codes}/S{random 6 digits}`.
- Referral p_code format: same, prefixed `REF-`.
- `code_status = 1` on creation (not the numeric-status-per-workflow-stage system used elsewhere — this matches the legacy convention exactly, per the master plan's instruction to preserve it unless the contract requires otherwise).
- `is_reference` / `referral_id` semantics: the **primary** request gets `is_reference = 1` and `referral_id = <referral provider id>` when a referral exists; the **referral** request itself gets `is_reference = 1` but `referral_id` stays `null` (it doesn't self-reference) — copied verbatim from `RequestCodeDirect::submitRequest`.
- Treatment eligibility split: scheme-wide (`schema_treatments` where `schema_id` matches) for ordinary enrollees, plan-specific (`schema_plan_treatments` joined to `schema_treatments`) for `is_private` enrollees with a `plan_id` — same branch `RequestCodeDirect::initTreatment` uses.

Deliberately different:
- **Referral-provider eligibility.** Legacy filters `Provider::where('id', '!=', Auth::user()->provider_id)->where('schema_id', $enrollee->schema_id)`. Neither clause is meaningful for an HMO-App caller: `Auth::user()->provider_id` is null for HMO staff (making the `!=` comparison `NULL`-valued in SQL — every row fails the filter, so this exact query would return **zero** providers for any HMO user), and `providers.schema_id` doesn't exist any more (dropped by `2026_09_18_194417_remove_hmo_and_schema_from_providers_table` — providers are HMO-linked via the `hmo_providers` pivot now, not schema-linked). The new implementation instead requires the referral provider to be linked to the requesting HMO (`Provider::whereHas('hmos', ...)`) and excludes only the **enrollee's own current provider** — this is the actually-intended check, not a literal port of code that would silently break for this caller.
- **Server-generated code, never client-trusted.** `p_code`/`code_status`/`hmo_id`/`user_id` are not in the `$request->validate()` allowlist at all — anything the client sends for these is discarded before the controller ever sees it (verified in `test_primary_only_submission_creates_one_request_with_its_child_records`, which deliberately sends forged values and asserts they have zero effect).
- **Row-level treatment/referral validation happens before the transaction opens**, not inside it — an invalid id fails the whole request with a 422 and persists nothing (verified in `test_no_records_are_persisted_when_referral_treatment_validation_fails`).

## 3. Permission boundary — `can_any:operations_access,call_center_access`

The workflow needs to search enrollees and list providers, but those are Operations-owned (write) endpoints; `code-requests` itself is Call-Center-owned. Rather than either (a) granting Call Center full Operations access (too broad — that would also grant provider/enrollee **write** access it shouldn't have) or (b) duplicating enrollee/provider read logic into new endpoints, a small new middleware (`App\Http\Middleware\EnsureAnyPermission`, aliased `can_any`) widens exactly the three read-only GETs this workflow needs (`GET enrollees`, `GET enrollees/{id}`, `GET providers`) to either permission, while every write route (`register`, `import`, `photo`, `providers POST/PUT`, `schemas`) stays under `operations_access` alone. Verified in `test_call_center_only_role_can_still_look_up_enrollees_and_providers` and `test_operations_only_role_cannot_create_a_direct_code_request` (the reverse boundary — Operations still can't POST a code request).

## 4. Request / response contract

`GET /hmo/code-requests/treatment-catalog?enrollee_id={id}` → `{ success, message, data: TreatmentCatalogItem[] }`
```
TreatmentCatalogItem { id, treatment_code, treatment_title, price }
```
`price` is the plan-specific override (`schema_plan_treatments.price`) when the enrollee is on a private plan and one exists, else the scheme's `schema_treatments.treatment_price`, else `null`.

`POST /hmo/code-requests`
```json
{
  "enrollee_id": 123,
  "diagnosis": "Malaria with fever",
  "treatment_ids": [45, 46],
  "service_ids": [7],
  "referral_provider_id": 88,
  "referral_treatment_ids": [50]
}
```
`service_ids` is accepted (creates `CodeService` rows) but has no dedicated UI control in this slice — the prompt's 5-step spec for this screen doesn't include a services step, only treatments; adding one wasn't in scope. `referral_provider_id`/`referral_treatment_ids` are optional together; at least one of `treatment_ids` or a complete referral pair is required (422 otherwise).

Success (201): `{ success, message, data: { code_request: {...with codeTreatments.treatment, codeServices.service} | null, referral_request: {...with codeTreatments.treatment, referralTreatments} | null } }`.

## 5. Real-table findings along the way (backend)

Auditing the actual schema (not assumptions) surfaced several pre-existing gaps, all now fixed with additive, `hasColumn`/`hasTable`-guarded migrations that are no-ops against the real dev database (`ixhealt1_dbase`) and only take effect on a fresh install:

- `schemas.package_code`, `enrollees.user_id`, `code_requests.user_id` all exist on the real database but have **no migration that creates them** — they were added outside migration history at some point. A fresh `migrate:fresh` failed on all three before these repair migrations were added.
- `2024_03_19_000001_add_location_and_next_of_kin_to_enrollees_table` is dated *before* `create_enrollees_table` (2024_10_28) — a filename mistake that crashes a fresh install. Guarded with `hasTable`; a same-purpose, `hasColumn`-guarded migration dated correctly after table creation covers fresh installs.
- `2026_09_18_194417_remove_hmo_and_schema_from_providers_table` dropped columns without dropping their FKs first (MySQL error 1553) — fixed to drop FKs first, guarded.
- `2025_02_18_114547_add_comments_field_to_code_treatments_table` created `comments` as `NOT NULL` with no default — every `CodeTreatment::create()` that doesn't set it (which is most of them, including this feature's own) would fail on a fresh database. Added `->nullable()` (the real database already has it nullable, patched outside migration history like the others above).

None of these edits change behavior on `ixhealt1_dbase` — the two edited pre-existing files never re-run there (Laravel tracks migrations by filename, already recorded as run), and the new files are `hasColumn`-guarded no-ops against a database that already has the columns. They were necessary to get **any** `RefreshDatabase`-based feature test running at all in this repo (a fresh `migrate:fresh` failed outright before these fixes) — a `.env.testing` was also added pointing to an isolated `ixhealt1_dbase_test` database created for this purpose, so tests never touch the real dev data.

**Not fixed, flagged only** (found adjacent to this work, out of scope for this feature):
- `Api\V1\HMO\CodeRequestController@referrals` filters `where('is_referral', true)` — the real column is `is_reference`. This route isn't used by the direct-request workflow; left as found.
- `Api\V1\Schema\DrugPricingController@upload` references `drugs.strength`/`drugs.presentation`/`drug_prices.code` — all dropped by the v2 migrations (`2026_05_28_200000`/`_200001`). Unrelated to code requests; noted in `docs/TARIFF_UPLOAD_API_CONTRACT.md` §0 already.
- `App\Models\TreatmentPrice::treatment()` points at a `Treatment` model whose table (`treatments`) has no migration and doesn't exist — appears to be dead code; the working treatment-pricing path is `schema_treatments.treatment_price` directly.

## 6. Known impact on `AddRequestPanel.tsx` (Call Center quick-create) — unresolved, flagged rather than silently patched

`components/AddRequestPanel.tsx` (used only from `call-center/page.tsx`, distinct from this screen) also posts to `POST /hmo/code-requests`, with the **old** payload shape (`diagnoses`, `service_ids` only, a free-typed `p_code`, hardcoded `hmo_id: 1`). That endpoint's contract has now changed to require `diagnosis` + at least one `treatment_id` (or a referral pair) — `AddRequestPanel`'s submissions will now fail with a 422 instead of silently creating an insecure record (previously: client-chosen `p_code`, wrong hardcoded `hmo_id`). This is a net safety improvement, not a regression of working functionality — that panel was never a safe path to begin with. Per the task's explicit scope ("do not rebuild adjacent code-request screens"), `AddRequestPanel.tsx` was left untouched; it needs its own pass to either adopt the same contract (swap `ServiceMultiSelect` for `TreatmentMultiSelect`, drop the manual `p_code` field) or be retired in favor of linking to `/manage-codes/new`.

## 7. Files changed

**Backend:**
- `routes/api.php` — `can_any` read group; `treatment-catalog` route.
- `app/Http/Middleware/EnsureAnyPermission.php` (new), registered in `app/Http/Kernel.php`.
- `app/Http/Controllers/Api/V1/HMO/CodeRequestController.php` — `store()` rewritten; `treatmentCatalog()` added.
- `app/Http/Controllers/Api/V1/HMO/EnrolleeController.php` — `index()` search support (was accepted but silently ignored) + eager-loaded `provider`; `show()` eager-loads `provider`/`schema`.
- `tests/Feature/DirectCodeRequestTest.php` (new, 15 tests).
- `.env.testing` (new) + 5 migration fixes/additions (§5).

**Frontend (this repo):**
- `src/api/codeRequests.ts` — new contract types, `getTreatmentCatalog`.
- `src/components/TreatmentMultiSelect.tsx` (new).
- `src/components/EnrolleeSearchInput.tsx` — richer result rows (provider name), typed `Enrollee` export.
- `src/app/manage-codes/new/page.tsx` — full 5-step rewrite.

## 8. Verification

- Backend: `php artisan test tests/Feature/DirectCodeRequestTest.php` — 15 passed, 58 assertions. Full suite: pre-existing Jetstream scaffolding tests (`AuthenticationTest`, `UpdatePasswordTest`, etc.) fail on an unrelated, pre-existing gap (`users.current_team_id` referenced by Fortify test factories, no migration for it) — unrelated to this change, not touched.
- Frontend: `npx tsc --noEmit` clean; `npx eslint` clean on all new/changed files. `/manage-codes/new` compiles and mounts via the dev server.
