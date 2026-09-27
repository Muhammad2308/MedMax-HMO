# Tariff Upload API Contract — `Api\V1\HMO\TariffController` (proposed, not built)

**Audience:** whoever is working on the Laravel backend (`C:\Users\DELL\Desktop\IX2 App\IX2 App\IX2 App`).
**Status:** greenfield. Confirmed by reading `routes/api.php`'s `hmo` prefix group and `app/Http/Controllers/Api/V1/HMO/` directly — there is no tariff/service/treatment/drug controller under the `HMO` namespace today. This document is the proposed contract the frontend (`src/api/tariffs.ts`, `src/app/tariffs/`) was built against, plus everything the audit of the real schema found along the way. **This document does not implement backend code** — same rule as `docs/IX2_APP_BACKEND_REQUIREMENTS.md`.
**Plan reference:** `MedMax_HMO_Implementation_Priority_and_UIUX_Plan.md` §13 (Tariff Management), §22 (Import Architecture), §23 (Duplicate Handling).

---

## 0. What already exists and must not be duplicated or broken

Read directly (not inferred) from migrations/models/controllers:

| Table | Real columns | Notes |
|---|---|---|
| `schemas` | `id`, `title`, (+ later migrations add `package_code`, `org_token`, `acts_as_hmo`, `is_active`) | |
| `services` | `id`, `title`, `service_code`, `service_status`, `schema_id` (nullable FK) | |
| `schema_treatments` | `id`, `treatment_status`, `treatment_code`, `treatment_title`, **`treatment_price`** (decimal, lives here directly), `schema_id` FK, `service_id` FK | Despite the name, this is the live "treatments" table — the class is `App\Models\SchemaTreatment`. **`SchemaTreatment::$fillable` includes `hmo_id`, but the table has no `hmo_id` column** (it's commented out in `2024_10_20_115528_create_schema_treatment_pivot_table.php`) — mass-assigning `hmo_id` on this model will throw a SQL error. Don't copy this into the new controller. |
| `drugs` | `id`, `name`, `generic_name`, `drug_code` (unique), `dosage_form`, `unit`, `drug_status` | Global catalog, not schema-scoped. Columns `strength`/`presentation`/`status` existed in v1 and were **dropped** by `2026_05_28_200000_update_drugs_table_v2.php`. |
| `drug_prices` | `id`, `schema_id` FK, `drug_id` FK, `price`, `effective_date`, `price_status`, **unique(`drug_id`,`schema_id`)** | Column `code` existed in v1 and was **dropped** by `2026_05_28_200001_update_drug_prices_table_v2.php`. No `hmo_id` column — see §3 open question. |
| `treatment_prices` | `id`, `schema_id` FK, `service_id` FK, `treatment_id` FK → **`schema_treatments`** | Model `App\Models\TreatmentPrice::treatment()` returns `belongsTo(Treatment::class)`, and `App\Models\Treatment` has no `$table` override, so Eloquent resolves it to a `treatments` table — **which has no migration and does not exist.** This relation is broken. Combined with the fact that the one real, working upload path (`TreatmentPricingController@upload`, below) never touches `treatment_prices` at all and writes `treatment_price` straight onto `schema_treatments`, treat `treatment_prices`/`Treatment` as **dead/vestigial** — do not build the new tariff import against it. |
| `schema_services` | `id`, `service_code`, `service_title`, `service_price`, `service_id` FK (nullable), `schema_id` FK (nullable), **`hmo_id` FK (nullable)** | The one tariff-adjacent table that actually is HMO-taggable today. Not currently written to by any controller found in this audit (no `SchemaServiceController` upload logic found) — appears to be a planned-but-unused overlay. Flagging its existence for whoever designs the real fix in §3, not proposing to use it below without a decision. |

**Existing upload logic to model the new controller on (both `Api\V1\Schema\*`, scoped to the authenticated **Schema** account's own `$request->user()->package_schema_id`, not usable as-is for an HMO):**

- `TreatmentPricingController@upload` — parses a single sheet with header `SERVICE CODE | SERVICE TITLE | SERVICE PRICE`, where a row with an empty price is a *service* header and subsequent priced rows until the next blank/service row are its *treatments*. Upserts `Service` (by `service_code`) and `SchemaTreatment` (by `treatment_code`), deactivates (`*_status = 0`) anything not present in the new file. This is the real, working precedent for "Services & Treatments" below.
- `DrugPricingController@upload` — **currently broken against the current schema.** It validates headers `name_of_drug`/`price` (optional `dosage_form`, `strenth`/`strength`/`strengths`, `presentation`, `drug_code`), then calls `Drug::updateOrCreate(['name' => $name], ['dosage_form' => ..., 'strength' => ..., 'presentation' => ...])` and `DrugPrice::create([..., 'code' => $code, 'price' => $price])` — but `strength`, `presentation` (on `drugs`) and `code` (on `drug_prices`) were all dropped by the v2 migrations above. This will throw `SQLSTATE[42S22]: Column not found` the next time it actually runs against the current DB. **Flagging as a pre-existing, unrelated bug** — not something this document or the new HMO controller should inherit. Whoever picks this up should fix `DrugPricingController@upload` separately (map to `generic_name`/`drug_code`/`unit`/`drug_status`, drop the `code` write on `DrugPrice`) or confirm it's already dead and slated for removal.
- Response shape for both: raw `response()->json([...])`, **not** the `{success, message, data, meta}` envelope — see §2 for why the new controller should use the envelope instead.
- `ProviderController@schemas` (`GET /hmo/schemas`, already live) — `Schema::whereHas('hmos', fn($q) => $q->where('hmos.id', $request->user()->hmo_id))->get()`. **Reuse this route as-is** for the frontend's schema picker; no new "list my schemas" endpoint is needed.

## 1. Proposed routes

Add inside the existing `Route::prefix('hmo')->group(...)`, in the `can:operations_access` middleware group (same gate as `providers`/`schemas`/`enrollees` — chosen for consistency with where `schemas` already lives, not a new gate; **explicit decision, not a default** — reconsider if tariff upload should be restricted to a narrower role than general Operations):

```php
Route::middleware('can:operations_access')->group(function () {
    // ...existing enrollees/providers/schemas routes...

    Route::get('tariffs/summary', [App\Http\Controllers\Api\V1\HMO\TariffController::class, 'summary']);
    Route::post('tariffs/import', [App\Http\Controllers\Api\V1\HMO\TariffController::class, 'import']);
});
```

### `GET /hmo/tariffs/summary?schema_id={id}`

Validate `schema_id` is one the requesting HMO is actually linked to (`Schema::whereHas('hmos', fn($q) => $q->where('hmos.id', $request->user()->hmo_id))->findOrFail($schemaId)` — same guard as `ProviderController@schemas`, reject with 403/404 otherwise, not a silent empty result). Response (via `ApiResponse::successResponse`):

```json
{
  "success": true,
  "message": "Tariff summary retrieved successfully.",
  "data": {
    "schema_id": 4,
    "services_count": 128,
    "treatments_count": 512,
    "drugs_priced_count": 340,
    "last_imported_at": "2026-09-20T14:03:00Z"
  },
  "meta": {}
}
```

- `services_count` = `Service::where('schema_id', $schemaId)->where('service_status', 1)->count()`
- `treatments_count` = `SchemaTreatment::where('schema_id', $schemaId)->where('treatment_status', 1)->count()`
- `drugs_priced_count` = `DrugPrice::where('schema_id', $schemaId)->count()`
- `last_imported_at` — no import-batch table exists yet (see §4); until one exists, either omit this field or derive it as `max(updated_at)` across the three queries above. Frontend already renders `null` safely.

### `POST /hmo/tariffs/import` (multipart/form-data)

Request: `schema_id` (required, integer, must be HMO-linked per above), `type` (required, `in:services_treatments,drugs`), `file` (required, `mimes:xlsx,xls,csv`, `max:10240`).

Response, standard envelope, `data`:

```json
{
  "type": "services_treatments",
  "total_rows": 640,
  "created": 12,
  "updated": 601,
  "skipped": 4,
  "duplicate": 3,
  "failed": 2,
  "errors": [
    { "row": 57, "message": "Price 'N/A' is not numeric" },
    { "row": 212, "message": "Treatment row has no preceding service" }
  ]
}
```

Row categories (per plan §23 — richer than the existing `TreatmentPricingController`/`DrugPricingController` precedent's 2–3 buckets, deliberately, since neither existing controller returns row-level detail and the plan explicitly requires it, §12/§22):

- **created** — new `Service`/`SchemaTreatment`/`Drug`+`DrugPrice` row.
- **updated** — existing row (matched by code) with a changed price/title.
- **skipped** — row missing a required field (mirrors existing `skipped` semantics).
- **duplicate** — same code appears more than once *within the uploaded file itself*; first occurrence wins, rest counted here (not currently detected by either existing controller — new behavior, needed because neither existing precedent guards against a bad file listing the same code twice).
- **failed** — value present but invalid (e.g. non-numeric price after stripping currency symbols) — currently, both existing controllers silently coerce an unparseable price to `0.00` instead of rejecting it; this proposal treats that as a `failed` row with a message instead, so bad data doesn't silently become a free service. **Explicit behavior change from existing precedent — confirm before implementing**, since it changes what "successful" means compared to the two controllers above.

For `type = services_treatments`: same file shape as `TreatmentPricingController@upload` (`SERVICE CODE | SERVICE TITLE | SERVICE PRICE`, blank-price row = service header), writing to `services` + `schema_treatments.treatment_price` — **not** `treatment_prices` (see §0).

For `type = drugs`: header-driven like `DrugPricingController@upload` but against the *current* schema (`generic_name`, `drug_code`, `unit`, `drug_status` on `drugs`; no `code` column on `drug_prices`), keyed by `drug_code` when present (fall back to `name` match only when no code given, matching existing fallback intent) — **do not** reference `strength`/`presentation`/`drug_prices.code`, they don't exist.

## 2. Response envelope

Use `App\Traits\ApiResponse::successResponse()` / `errorResponse()` — the same trait `EnrolleeController`/`ProviderController`/`ClaimsController` already use — **not** the raw `response()->json([...])` shape `TreatmentPricingController`/`DrugPricingController` use. This matches `docs/IX2_APP_BACKEND_REQUIREMENTS.md` §2 P20's recommendation that new `Api\V1\HMO\*` controllers adopt the standard envelope from the start. The frontend (`src/api/tariffs.ts`) already calls `.then(unwrapEnvelope)`, i.e. it expects `response.data.data`, not a raw body.

## 3. Open design questions — do not guess, decide explicitly

1. **`drug_prices` and `schema_treatments`/`treatment_price` have no `hmo_id`.** If two different HMOs are both linked to the same schema and upload conflicting prices for the same drug/treatment, the second import silently overwrites the first (no per-HMO column to disambiguate). Given the plan's framing that a schema's tariff is the canonical price list the schema owns (HMO uploads *on behalf of* the schema, not a private price list), last-write-wins may be intentional — but this needs an explicit product decision, not an assumption, before this ships against real multi-HMO schemas. If per-HMO pricing turns out to be required, `schema_services`'s existing (currently unused) `hmo_id` column is the closest existing precedent for how that would be modeled — evaluate before adding a new column.
2. **No import-batch/audit table exists** (plan §22 "Import Batch" / "Import Rows" model — `IX2_APP_BACKEND_REQUIREMENTS.md` doesn't mention one either, and this audit found none). This proposal's `summary`/`import` endpoints work without one (stateless import, response carries the full result), but `last_imported_at` and any later "view past import history" screen will need one. Out of scope for this slice; flagging so it isn't accidentally designed twice differently later.
3. **Gate choice (`operations_access`)** is reused from where `schemas`/`providers` already live for consistency, not because tariff upload was analyzed as an Operations-team responsibility specifically — confirm this is the right role boundary (vs. a narrower new `tariff_management_access`, unseeded today the same way `schema_management_access` was found unseeded in the first HMO delivery per `IX2_APP_CRITICAL_FIXES_REQUIRED.md`).
4. **`DrugPricingController@upload`'s existing bug (§0)** is unrelated to this feature but adjacent — decide separately whether to fix it or confirm it's dead, so it isn't left silently broken.

## 4. Frontend status

`src/api/tariffs.ts`, `src/app/tariffs/page.tsx`, `src/app/tariffs/ImportTariffModal.tsx` are built against this contract and are otherwise complete (schema picker reusing the existing `/hmo/schemas` route, summary stat cards, import wizard with row-level error display). They will 404 until the routes above exist — the summary card and import button both render an explicit "not available yet" state rather than a silent failure or fabricated numbers, consistent with how the dashboard handles other not-yet-built endpoints (`docs/MEDMAX_HMO_IMPLEMENTATION_PLAN.md` §3 item 4). No frontend changes should be needed once the backend matches this contract — if it can't match exactly, coordinate the diff back through this document rather than silently diverging, same convention as `IX2_APP_CRITICAL_FIXES_REQUIRED.md`.
