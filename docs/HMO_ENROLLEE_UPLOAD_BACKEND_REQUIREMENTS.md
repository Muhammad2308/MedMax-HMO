# HMO Enrollee Spreadsheet Upload — Backend Requirements

**Status:** Backend handoff / requirements. This document describes the current frontend request and the backend behavior needed for a reliable upload. It is not evidence that the live Laravel endpoint currently implements these requirements.

**Related context:** [HMO Private Plan / Scheme Reconciliation](./HMO_PRIVATE_PLAN_RECONCILIATION.md)

## 1. Goal and coverage rule

Make the HMO roster upload reliable, tenant-safe, and safe to retry. An upload belongs to exactly one selected `Schema`; the backend must use that Schema as the coverage scope for enrollee enrollment and roster reconciliation.

The current frontend:

- Fetches the user's HMO Schemas from `GET /hmo/schemas`.
- Requires one selected Schema (and preselects it when only one is returned).
- Sends `schema_id` and a spreadsheet file to `POST /hmo/enrollees/import`.
- Accepts `.xlsx`, `.xls`, and `.csv` files up to 10 MB in the file picker. This confirms a client-side selection limit only; the live server-side limit has not been verified and must be enforced and documented by the backend.
- Displays `new_enrollees`, `updated_enrollees`, `deactivated_enrollees`, `total_records_in_sheet`, `skipped_rows`, and `duplicate_rows`.
- Tells the user that members missing from the uploaded file will be deactivated and that new hospital names may be added as providers.

The current UI identifies these spreadsheet columns as required: **Enrollee No., Name, Provider Name**. Confirm and publish the complete canonical template/column mapping with the backend; do not silently assume other columns or require the spreadsheet to contain `schema_id` when the selected Schema is already sent as request metadata.

### HMO interface context

The upload is part of the HMO tenant interface, which also lists available Schemas, manages providers and Schema panels, and lists/registers enrollees. Keep the same authenticated-HMO boundary across these related operations; a safe import endpoint is not sufficient if schema listing or provider resolution exposes another HMO's records.

The current frontend API client calls the following related routes:

- Schemas: `GET /hmo/schemas`, `POST /hmo/schemas`.
- Schema providers: `GET /hmo/schemas/{schema}/providers`, `POST /hmo/schemas/{schema}/providers`.
- Providers: `GET /hmo/providers`, `POST /hmo/providers`, `GET /hmo/providers/{id}`, `PUT /hmo/providers/{id}`.
- Enrollees: `GET /hmo/enrollees`, `GET /hmo/enrollees/{id}`, `POST /hmo/enrollees/register`, `POST /hmo/enrollees/import`, `GET /hmo/enrollees/export`.

These are observed frontend calls, not independent confirmation that every route is deployed or correctly authorized. Verify the Laravel route/controller implementation and tenant scoping before treating them as backend guarantees.

## 2. Make `schema_hmos` the HMO-to-Schema relationship source

The database findings referenced by the reconciliation note include a many-to-many pivot referred to as `schema_hmos` with `schema_id`, `hmo_id`, and `added_by_user_id`, alongside a legacy nullable `hmos.schema_id`. Confirm the exact deployed table name against the current migration and database before implementation; this document uses `schema_hmos` consistently. The pivot is the appropriate relationship for an HMO that may participate in multiple private and external/government Schemas.

### Required relationship behavior

1. Treat `schema_hmos` as the authoritative set of HMO↔Schema links for HMO-facing schema listing and upload authorization. Do not use a client-supplied HMO ID or `hmos.schema_id` alone to authorize an upload.
2. Derive the requesting HMO from the authenticated server-side identity and its trusted organization membership. Never trust an HMO identifier from form data to select the tenant.
3. Before processing an upload, confirm the selected `schema_id` is associated with that authenticated HMO through `schema_hmos` and is currently eligible for enrollee operations.
4. Support both:
   - An HMO-owned private Schema linked to its owning HMO.
   - An external/government Schema linked to every HMO that is permitted to manage its enrollees.
5. Do not infer HMO ownership from `schemas.is_private` alone. Use the actual ownership/type fields and the pivot relationship together. A private Schema should not become accessible to another HMO merely because its ID is known.
6. Make the pivot relationship unique on `(schema_id, hmo_id)` and index both lookup directions. Add/confirm foreign keys and delete behavior consistent with existing migrations and production data.
7. Record who established the relationship (`added_by_user_id`) when available. If relationship approval, revocation, or lifecycle state is needed, model it explicitly and enforce it consistently; do not assume such a column already exists.
8. Use the same relationship source in `GET /hmo/schemas`, the import authorization check, and related HMO schema operations. The schema list must return only Schemas available to the authenticated HMO, with enough display metadata to distinguish private and external coverage when necessary.

### Legacy `hmos.schema_id`

The direct column may remain during compatibility/migration, but it must not compete with the pivot as an undocumented second source of truth. Audit current reads/writes and existing rows; backfill or reconcile relationships deliberately, add tests, and only then deprecate the legacy field. Do not drop or rewrite production data as part of this upload work without a reviewed migration plan.

### Schema setup

Every HMO needs its private Schema established during registration or an explicit first-use setup before its first private roster upload. Creation/linking should be transactional and safe to retry, so a failed registration retry cannot create duplicate private Schemas or pivot links. Keep `Schema` and `Provider` as separate entities; provider panel membership belongs to its own relationship and is not represented by `schema_hmos`.

## 3. Upload endpoint contract

### Request

`POST /api/v1/hmo/enrollees/import`

Authenticated multipart form data:

| Field | Requirement | Meaning |
|---|---|---|
| `schema_id` | Required integer | The coverage Schema selected in the UI. Must be linked to the authenticated HMO and eligible for imports. |
| `file` | Required file | `.xlsx`, `.xls`, or `.csv`; enforce a documented server-side limit (the frontend currently allows selection up to 10 MB). Validate actual file content/format, not only the filename or browser MIME type. |

The current client does not send `hmo_id`, `user_id`, `is_private`, enrollee status, or `plan_id` as upload-wide authorization facts. The backend must derive tenant and authorization context itself. If the template supports a plan/tier per row, validate each plan against the selected Schema; do not accept a client-selected plan as authorization truth.

### Authorization and validation order

1. Authenticate the user and verify the required HMO enrollee-import permission.
2. Derive the active HMO from trusted server-side membership/context.
3. Validate request shape, file size/type, parseability, and supported headers.
4. Verify `(schema_id, authenticated_hmo_id)` exists in `schema_hmos` and the Schema is active and importable for that HMO.
5. Validate every row and all referenced entities in the selected Schema/HMO scope before applying changes.
6. Reject cross-tenant or unauthorized provider/plan references, even if those IDs exist globally.

Return a clear 403 for insufficient permission and a clear 422 for invalid request, unavailable Schema, invalid file, or row validation problems. Do not turn an unauthorized Schema into an empty successful import.

## 4. Row identity, mapping, and provider handling

- Publish a downloadable/template file or unambiguous column guide. At minimum, align its required headers with the current UI: `Enrollee No.`, `Name`, and `Provider Name`.
- Normalize headers and whitespace consistently; define accepted aliases and date/phone formats rather than relying on spreadsheet column position.
- Define the stable enrollee identifier used to match existing records. Treat identity and enrollment coverage separately: a person may have an existing identity while their enrollment in this Schema is new or updated.
- Scope roster matching and all updates by the selected Schema (and authenticated HMO relationship as appropriate). Never let a matching enrollee number in one Schema overwrite or deactivate coverage in another.
- Resolve provider names against providers permitted for the HMO/Schema. Do not create a globally visible provider record from an arbitrary spreadsheet string. If automatic provider creation is part of the product requirement, create/link it through the approved HMO/provider and Schema/provider relationships, validate required provider fields, and report the created/linked outcome.
- Define duplicate-row policy. The UI currently reports duplicate IDs as merged; the backend must specify which row wins or how fields are combined, and return a deterministic duplicate count. Ambiguous conflicting duplicates should be reported rather than silently overwriting data.
- Validate all rows before committing the roster. Return row numbers and field-level errors so an administrator can correct the source file.

## 5. Safe roster reconciliation

The UI currently warns that enrollees in the selected Schema but absent from the file will be deactivated. This is a destructive reconciliation behavior and must be narrowly scoped and protected.

1. Deactivate only active enrollments belonging to the authenticated HMO and the selected `schema_id` that are absent from a successfully validated, explicitly full-roster upload.
2. Never deactivate enrollees in other Schemas or other HMOs. Do not use `hmos.schema_id` as the sole deactivation filter.
3. Do not deactivate anything for an empty, malformed, partially parsed, failed, or all-invalid spreadsheet. Require at least one valid row for replacement-style reconciliation, unless a separately confirmed explicit empty-roster workflow exists.
4. Distinguish **full roster replacement** from **add/update only**. Make the mode explicit in the API/product contract. If the current UI continues to imply replacement, ensure the operator can understand the impact and receives counts before finalizing when practical.
5. Perform creates, updates, and deactivations atomically or with a documented import-batch state machine that prevents a partially applied file from appearing successful.
6. Record an audit trail: HMO, Schema, actor, upload/batch identifier, file metadata or checksum (not unnecessary sensitive file contents), counts, outcome, and timestamps.
7. Consider a preview/validate step and an idempotency mechanism. Retrying the same completed upload must not create duplicates or repeat deactivation unexpectedly.

If existing endpoint behavior is already different, reconcile the confirmation copy and API behavior together rather than silently changing the meaning of an operator's upload.

## 6. Processing and failure behavior

- Parse supported formats with bounded memory and execution time. For large files, use a queued import with an explicit batch status and pollable result rather than timing out the HTTP request.
- Apply server-side row-count and decompression/resource limits in addition to the server-enforced request-size limit. Align the documented limit with the frontend's current 10 MB file-picker limit, or update the UI if the backend intentionally sets a different limit.
- Use a database transaction for bounded synchronous imports. For queued/chunked imports, make each stage recoverable and ensure reconciliation runs only after the complete file has validated and all intended rows have been applied.
- Never return success-shaped fallback data after a parse, validation, database, or queue failure. Log operational failures with a batch/correlation identifier, without logging credentials or unnecessary enrollee PII.
- Preserve a predictable response shape compatible with the current UI, or coordinate any frontend change. The client currently expects a raw response shaped like:

```json
{
  "success": true,
  "message": "Import completed.",
  "summary": {
    "new_enrollees": 0,
    "updated_enrollees": 0,
    "deactivated_enrollees": 0,
    "total_records_in_sheet": 0,
    "skipped_rows": 0,
    "duplicate_rows": 0
  }
}
```

Counts must have precise definitions. In particular, state whether `total_records_in_sheet` excludes header and blank rows, and whether `skipped_rows` counts blank rows, invalid rows, or only rows missing an enrollee identifier. Do not count invalid rows as successful changes.

Recommended definitions to confirm with the backend:

- `new_enrollees`: new enrollee/enrollment records created within the selected Schema.
- `updated_enrollees`: existing records in that Schema changed by the import.
- `deactivated_enrollees`: previously active enrollments deactivated by a successful full-roster reconciliation in that Schema only.
- `total_records_in_sheet`: data rows, excluding the header and fully blank rows.
- `skipped_rows`: rows not applied, reported with reasons; document whether this includes invalid rows and missing identifiers.
- `duplicate_rows`: repeated enrollee identifiers resolved according to the documented duplicate policy.

## 7. Recommended implementation sequence

1. Inspect current Laravel routes, controller/service, migrations, models, and tests for enrollee import and the Schema-HMO relationship. Confirm the actual pivot table name and columns in the deployed schema.
2. Establish the canonical relationship query and update `GET /hmo/schemas` and import authorization to use it consistently.
3. Verify registration/setup creates and links the HMO's private Schema idempotently; repair existing HMO relationships through a reviewed backfill if needed.
4. Define the authoritative spreadsheet template, stable enrollee identity, provider matching, plan semantics, duplicate rules, and full-roster versus add/update behavior.
5. Implement parse/validate, tenant-scoped apply, safe reconciliation, audit logging, and response/error contracts.
6. Exercise the acceptance tests below against an isolated test database and the actual controller/service path before enabling production uploads.

## 8. Acceptance tests

### Schema relationship and tenant isolation

- An HMO sees only Schemas linked to it; a Schema linked to two authorized HMOs is available to both according to policy.
- A private Schema linked to one HMO cannot be imported into by another HMO, even if the second HMO submits its `schema_id`.
- A missing/revoked pivot relationship, inactive Schema, invalid ID, or missing import permission is rejected without writes.
- The authorization result does not change if the request supplies a forged `hmo_id` or if a legacy `hmos.schema_id` points elsewhere.
- Creating/retrying registration or setup produces one intended private Schema and one pivot relationship, not duplicates.

### File and row behavior

- Valid `.xlsx`, `.xls`, and `.csv` uploads within the configured limit are parsed; unsupported, oversized, malformed, and header-invalid files fail visibly.
- Missing required `schema_id` or file is rejected by the server, independent of frontend validation.
- Cross-Schema provider/plan references and duplicate identifiers are handled according to the documented rules and never escape tenant scope.
- Row validation errors include row/field context and do not partially apply a replacement roster.
- A successful response contains all six summary fields expected by the client and accurate counts.

### Reconciliation and retry safety

- A full valid roster updates only the selected HMO+Schema membership and deactivates only absent members in that scope.
- Other Schema memberships and other HMOs' records remain unchanged.
- Empty, failed, malformed, or all-invalid files do not deactivate existing records.
- Retrying the same upload does not duplicate enrollees, repeat unintended status changes, or report a false success.
- Audit records identify the actor, HMO, Schema, batch, counts, and result.

## 9. Frontend integration boundary

No separate `hmo_plan_id` upload path is required solely to replace `schema_id` while Schema remains the canonical coverage identity. The frontend already supplies the selected `schema_id`; the backend is responsible for validating it against the authenticated HMO's `schema_hmos` relationship and for safely applying the roster.

Frontend changes may be needed if the backend adds a preview/batch workflow, returns asynchronous job IDs, changes the response envelope, adds explicit import modes, or changes the provider/plan template. Coordinate those changes with the current UI and retain a clear user-visible explanation of any deactivation behavior.
