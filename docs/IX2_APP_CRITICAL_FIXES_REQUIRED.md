# IX2-App — Critical Fixes Required (HMO API, `Api\V1\HMO\*`)

**Audience:** whoever is working on the Laravel backend (`C:\Users\DELL\Desktop\IX2 App\IX2 App\IX2 App`).
**Purpose:** a standalone, fix-it list for the problems found while verifying the first `Api\V1\HMO` delivery against the actual controller code (not just the route list). The top issue is a real cross-tenant data leak — every HMO can currently see and edit every other HMO's providers, and see every other HMO's claims. Everything below is confirmed by reading the file, not inferred from documentation.
**Related:** `docs/IX2_APP_BACKEND_REQUIREMENTS.md` §0 has the same findings folded into the broader gap-analysis doc; this file exists as a focused, standalone fix list.

---

## Status update (2026-09-18, second verification pass)

A second round of backend work claimed all of the below was fixed. Re-verified against the actual controller/migration/model code again (not the description) before updating anything on the frontend. Result this time: **the tenant-isolation and RBAC fixes are real and correctly implemented.** One new, smaller gap was found and partly fixed on the frontend side; one item is still an unimplemented stub.

| Item | Status | Notes |
|---|---|---|
| §1.1 Provider cross-tenant leak | ✅ **Fixed, verified.** | Better than the interim fix this doc originally suggested — the backend did the real many-to-many redesign: new `hmo_providers` pivot table, `providers.hmo_id`/`schema_id` columns dropped entirely, `Provider::hmos()` added, and `ProviderController` now uses `whereHas('hmos', fn($q) => $q->where('hmos.id', $request->user()->hmo_id))` on every method including `store()` (which now does `$provider->hmos()->attach(...)`). This correctly matches the master plan's "provider may work with multiple HMOs" model, resolving the open design question this doc raised rather than dodging it. |
| §1.2 Claims cross-tenant leak | ✅ **Fixed, verified.** | `ClaimsController@vettedClaims`/`financialReport`/`showVettedClaim` all now use `CodeVetted::whereHas('codeRequest', fn($q) => $q->where('hmo_id', $hmoId))`, exactly the join this doc recommended (the `code_vetteds` table still has no `hmo_id` column, so the join is required, not optional — confirmed still correct). |
| §2.1 `code_status` field mismatch | ✅ **Fixed, verified.** | `assign`/`decline`/`vet` now write `code_status` (1/3/9) instead of the unused string `status` column, and `assign` persists `p_code`. Matches `Badge.tsx`'s numeric map exactly. |
| §2.3 Missing routes | ✅ **Fixed.** | `GET /hmo/vetted-claims/{id}` (→ `showVettedClaim`) and `GET /hmo/reports/financial/export` (→ `exportFinancialReport`) are now registered. |
| §3.1 Permission seeding | ✅ **Fixed, verified.** | The route file no longer has one blanket `can:schema_management_access` gate — it's genuinely split into three groups matching the seeded roles: `can:operations_access` (enrollees, providers, marketing), `can:call_center_access` (code-requests, referrals), `can:accounts_access` (vetted-claims, reports/financial). This lines up exactly with `Sidebar.tsx`'s existing permission checks, which were deliberately left unchanged for this reason — confirmed no frontend change was needed. |
| **New: claims response is missing provider data** | ⚠️ **Found this pass, partially fixed on frontend.** | `ClaimsController`'s `.with('codeRequest', 'enrollee')` does not eager-load `codeRequest.provider`, so no vetted-claim/financial-report response currently includes provider info at any depth — not top-level, not nested. Also, `p_code` lives on the nested `code_request` object, not top-level on the vetted claim, which the original frontend row-rendering code assumed. **Frontend fixed:** `src/app/reports/financial/page.tsx` now reads `row.code_request?.p_code` instead of `row.p_code` (fixes the P-Code column). **Not fixable from the frontend:** the Provider column will stay blank until the backend adds `.with('codeRequest.provider', 'enrollee')` (or equivalent) to `vettedClaims`/`financialReport`/`showVettedClaim` — there is currently no field path, nested or otherwise, that contains it. |
| §2.2 `financialReport` was a stub | ✅ **Fixed** (real, tenant-scoped query, no longer `[]`) — see provider caveat above. |
| §2.4 `exportFinancialReport` | ⚠️ **Still a stub.** | `return response()->json(['message' => 'Export initiated.']);` — no file is generated, and it doesn't use the `ApiResponse` envelope like the rest of this controller. The frontend's `claimsApi.exportReport()` (blob request) will receive a small JSON message, not a spreadsheet, if wired to a button. Left unwired on the frontend for this reason — do not treat the route's existence as meaning the Export button can be built yet. |

The rest of this document is kept as-is below for the original reasoning/evidence trail (useful if similar issues recur elsewhere in the API).

---

## Severity 1 — Cross-tenant data leak (fix before this touches real data)

### 1.1 `ProviderController` has no tenant scoping at all

**File:** `app/Http/Controllers/Api/V1/HMO/ProviderController.php`

Every method queries the whole table, with no filter by the requesting user's HMO:

```php
public function index(Request $request)
{
    // For simplicity, retrieving providers directly. Ideally they are linked via a pivot or hmo_id.
    $providers = Provider::all();
    return $this->successResponse($providers, 'Providers retrieved successfully.');
}

public function show(Request $request, $id)
{
    $provider = Provider::findOrFail($id);
    return $this->successResponse($provider, 'Provider retrieved successfully.');
}

public function update(Request $request, $id)
{
    $provider = Provider::findOrFail($id);
    $provider->update($request->all());
    return $this->successResponse($provider, 'Provider updated successfully.');
}

public function schemas(Request $request)
{
    $schemas = Schema::all();
    return $this->successResponse($schemas, 'Schemas retrieved successfully.');
}
```

**Impact:** any authenticated HMO staff member (with `schema_management_access`) can list every provider in the system regardless of which HMO it belongs to, fetch any provider by guessing/incrementing `id`, and — worse — **update** any other HMO's provider record (`$provider->update($request->all())` on an unscoped `findOrFail`). Same for `schemas()` — every HMO currently sees every schema in the database, not just the ones it's associated with.

**Fix.** `Provider` (`app/Models/Provider.php`) already has an `hmo_id` column and a `hmo()` relation, so the minimal correct fix is:

```php
public function index(Request $request)
{
    $providers = Provider::where('hmo_id', $request->user()->hmo_id)->get();
    return $this->successResponse($providers, 'Providers retrieved successfully.');
}

public function show(Request $request, $id)
{
    $provider = Provider::where('hmo_id', $request->user()->hmo_id)->findOrFail($id);
    return $this->successResponse($provider, 'Provider retrieved successfully.');
}

public function update(Request $request, $id)
{
    $provider = Provider::where('hmo_id', $request->user()->hmo_id)->findOrFail($id);
    $provider->update($request->all());
    return $this->successResponse($provider, 'Provider updated successfully.');
}
```

**Open design question — don't guess, decide explicitly.** The master plan (`MedMax_HMO_Implementation_Priority_and_UIUX_Plan.md` §14) says a provider is *not* meant to belong exclusively to one HMO ("A provider may work with multiple HMOs"). The database already has a many-to-many path for this: `schema_providers` (provider↔schema) and `schema_hmos` (HMO↔schema) — a provider is visible to an HMO if they share a schema. The `providers.hmo_id` column looks like it represents something narrower (maybe "which HMO directly onboarded this provider record"). Right now the codebase has **both** a direct `hmo_id` column and the schema-mediated network, and nothing reconciles them. The `where('hmo_id', ...)` fix above closes the leak immediately using the column that's actually there today, but someone needs to decide: should `ProviderController@index` return (a) providers this HMO directly owns (`hmo_id` column), (b) providers this HMO's schema network gives it access to (`schema_hmos` ⋈ `schema_providers`), or (c) the union of both? Pick one and document it — don't ship the direct-`hmo_id` version as a permanent design decision without confirming it's actually correct for the multi-HMO-provider model the plan describes.

`schemas()` needs the equivalent fix — scope to schemas reachable via `schema_hmos` for this HMO, e.g.:

```php
public function schemas(Request $request)
{
    $schemas = Schema::whereHas('hmos', fn ($q) => $q->where('hmos.id', $request->user()->hmo_id))->get();
    return $this->successResponse($schemas, 'Schemas retrieved successfully.');
}
```
(adjust the relation name to whatever `Schema` actually exposes for `schema_hmos` — check the model before copying this verbatim.)

### 1.2 `ClaimsController@vettedClaims` has no tenant scoping — and `code_vetteds` has no `hmo_id` column to filter by directly

**File:** `app/Http/Controllers/Api/V1/HMO/ClaimsController.php`

```php
public function vettedClaims(Request $request)
{
    // Retrieve vetted claims for the HMO
    $claims = CodeVetted::all();
    return $this->successResponse($claims, 'Vetted claims retrieved successfully.');
}
```

**Impact:** every HMO can currently see every other HMO's vetted claims — diagnosis, claim amount, vetted amount, enrollee, provider — everything. This is the exact thing you said you don't want.

**Why the obvious fix (`where('hmo_id', ...)`) will throw a SQL error:** checked the migration (`database/migrations/2025_04_05_205930_create_code_vetteds_table.php`) and the model (`app/Models/CodeVetted.php`) — `code_vetteds` has **no `hmo_id` column**. It only has `code_request_id`, `enrollee_id`, `diagnose`, `claim_amount`, `vetted_amount`, `remarks`, `payment_status`. The tenant ownership lives one hop away, on `code_requests.hmo_id` (confirmed working in `CodeRequestController`), reachable through `CodeVetted::codeRequest()`.

**Correct fix** — scope through the relationship:

```php
public function vettedClaims(Request $request)
{
    $hmoId = $request->user()->hmo_id;
    $claims = CodeVetted::whereHas('codeRequest', fn ($q) => $q->where('hmo_id', $hmoId))
        ->with('codeRequest', 'enrollee')
        ->get();
    return $this->successResponse($claims, 'Vetted claims retrieved successfully.');
}
```

(`->with(...)` is optional but likely wanted — the frontend's Financial Report page reads `row.provider?.name` per claim, which will need either an eager-loaded relation chain or a resource transformer; check what `CodeRequest` exposes for provider before finalizing this.)

If claims are frequently queried by HMO, consider adding an `hmo_id` column directly to `code_vetteds` (denormalized from `code_requests.hmo_id` at creation time) instead of a `whereHas` join on every read — faster, and makes future scoping mistakes (like this one) impossible to make by omission. Either approach is acceptable; don't ship neither.

---

## Severity 2 — Broken functionality (not a leak, but currently non-functional)

### 2.1 `CodeRequestController@assign/decline/vet` write to the wrong column and don't implement the action

**File:** `app/Http/Controllers/Api/V1/HMO/CodeRequestController.php`

```php
public function assign(Request $request, $id)
{
    $codeRequest = CodeRequest::where('hmo_id', $request->user()->hmo_id)->findOrFail($id);
    // Implement assign logic
    $codeRequest->update(['status' => 'assigned']);
    return $this->successResponse($codeRequest, 'Code request assigned successfully.');
}
```
(`decline`/`vet` follow the same pattern, writing `'status' => 'declined'` / `'status' => 'vetted'`.)

**Problem:** every consumer of this data in the frontend (`Badge`, the dashboard, `billing/page.tsx`, `manage-codes/page.tsx`, `call-center/page.tsx`, `vetting/[id]/page.tsx`) reads a **numeric** `code_status` column (0 = Pending, 1 = Granted, 2 = Details Added, 3 = Vetted, 9 = Declined) — not a string `status` column. As written, `assign`/`decline`/`vet` update a field nothing reads, so from the HMO-App's point of view calling these endpoints does nothing visible. `assign()` also never persists the `p_code` value the frontend sends in the request body (`{ p_code, comments }`) — the "// Implement assign logic" comment is a placeholder, not an implementation.

**Fix** — use the real column and actually implement each action, e.g.:

```php
public function assign(Request $request, $id)
{
    $data = $request->validate([
        'p_code' => 'required|string',
        'comments' => 'nullable|string',
    ]);
    $codeRequest = CodeRequest::where('hmo_id', $request->user()->hmo_id)->findOrFail($id);
    $codeRequest->update([
        'p_code' => $data['p_code'],
        'code_status' => 1, // Granted — confirm this against whatever the legacy Admin\ManageCodeController used
        'comments' => $data['comments'] ?? null,
    ]);
    return $this->successResponse($codeRequest, 'Code request assigned successfully.');
}
```

Check `app/Http/Controllers/Admin/ManageCodeController.php` (the legacy controller this was ported from) for the exact `code_status` values and any other fields (vetting amounts, decline reasons) it sets on assign/decline/vet, and mirror that — don't guess the numeric codes independent of what's already established (the frontend's numeric map is in `src/components/ui/Badge.tsx`: 0/1/2/3/9 as above).

### 2.2 `ClaimsController@financialReport` is an unimplemented stub

```php
public function financialReport(Request $request)
{
    // Placeholder for financial report generation logic
    $reportData = [];
    return $this->successResponse($reportData, 'Financial report retrieved successfully.');
}
```

Always returns an empty array. The frontend's Financial Report page will correctly show ₦0 for every aggregate (it computes totals from whatever rows come back — zero rows in, zero out, which is honest, not broken). But there's no real report yet. Needs the actual query (tenant-scoped, same `whereHas('codeRequest', ...)` pattern as §1.2, or via the denormalized column if you add one) before this is usable.

### 2.3 Two routes the frontend already calls are not registered

- `GET /hmo/vetted-claims/{id}` — no route exists for a single vetted claim; only the unscoped list route (`vetted-claims`) is registered.
- `GET /hmo/reports/financial/export` — no export route exists.

Both will 404 today. Neither is called by any currently-live frontend screen, so this isn't urgent, but they should either be built or the corresponding frontend functions (`claimsApi.getVettedById`, `claimsApi.exportReport`) should be removed if they're not planned.

### 2.4 `MarketingController@createSchemaPlan` doesn't attribute the plan to an HMO

```php
public function createSchemaPlan(Request $request)
{
    $data = $request->validate([
        'schema_id' => 'required|exists:schemas,id',
        'name' => 'required|string|max:255',
    ]);
    $schemaPlan = SchemaPlan::create($data);
    return $this->successResponse($schemaPlan, 'Schema plan created successfully.', 201);
}
```

Nothing ties the created `SchemaPlan` back to the requesting HMO. Clarify what this endpoint is actually meant to persist (is a `SchemaPlan` HMO-specific, or shared across the schema's whole network?) before treating this as done.

---

## Severity 3 — Access-control gap (nobody but org admins can use this yet)

### 3.1 `can:schema_management_access` isn't granted to any of the seeded default HMO staff roles

All five new controllers sit behind `Route::middleware('can:schema_management_access')` (`routes/api.php`, `hmo` prefix group). That gate is satisfied by `is_org_admin` (bypasses all gates via `Gate::before`) or an explicit grant — but the default roles seeded at HMO registration/invite time (`app/Http/Controllers/Api/V1/Auth/AuthController.php`, `app/Http/Controllers/Api/V1/Schema/SchemaHmoController.php`) are:

```php
'Call Center Officer' => ['call_center_access'],
'Operations Officer'  => ['operations_access'],
'Accounts Officer'    => ['accounts_access'],
```

None of these include `schema_management_access`. Right now, a freshly onboarded Call Center Officer, Operations Officer, or Accounts Officer cannot call any of the five new controllers — only the org admin can. Two ways to fix, pick one:

1. **Add `schema_management_access` to the seeded permission set** for all three roles (or whichever subset should have it).
2. **Split the single gate into the three that already exist and are already seeded**, matching each route sub-group to the role that should use it — e.g. `code-requests`/`referrals` behind `call_center_access`, `enrollees`/`providers` behind `operations_access`, `vetted-claims`/`reports/financial` behind `accounts_access`. This fits the route file's own grouping comments (`// Call Center / Code Requests`, `// Finance / Claims`) better than one blanket gate.

The HMO-App frontend (`src/components/layout/Sidebar.tsx`) already checks the three granular permissions (`call_center_access`, `operations_access`, `accounts_access`) to decide nav visibility — it was deliberately **not** changed to check `schema_management_access` instead, because that would just hide the problem rather than fix it. Once this is resolved on the backend (via option 1 or 2), the frontend's existing checks should already be correct without further changes — confirm that assumption once the fix lands, rather than assuming it.

---

## Priority order to fix

1. §1.1 and §1.2 (cross-tenant leaks) — before any real HMO data goes anywhere near this backend.
2. §2.1 (`code_status` field mismatch) — blocks the entire P-Code assign/decline/vet workflow from doing anything visible.
3. §3.1 (permission seeding) — blocks non-admin staff from using any of this at all.
4. §2.2–§2.4 — real but lower urgency; each is an isolated, already-scoped-down feature gap rather than a leak or a blocker.
