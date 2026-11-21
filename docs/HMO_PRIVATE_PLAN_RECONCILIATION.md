# HMO Private Plan / Scheme Reconciliation — Frontend Findings

**Status:** Product rule clarified from the supplied database dump and user direction; backend code/runtime and production-data questions remain unverified. This is a reconciliation note, not an implementation contract.

**Related request:** `docs/HMO_PRIVATE_PLAN_INTEGRATION_PROMPT.md`  
**Scope inspected:** current HMO frontend source, checked-in API contracts, and `C:\Users\DELL\Downloads\ixhealt1_dbase.sql` (17,542,194 bytes; file timestamp November 3, 2026). This is a database dump, not a live connection; it cannot prove that the current production database has the same contents or that Laravel routes work.

## Confirmed product rule

For this product, every HMO private plan is created with a corresponding private `Schema` during HMO registration/setup. The Schema is the organizing/coverage context for private services and tariffs. The default HCP/provider associated with that private Schema is the Schema's provider by default. Private services, tariffs, and enrollees follow that `schema_id`. An HMO may also participate in external/government Schemas; private coverage and government coverage must remain distinguishable by the Schema's ownership/type and relationship data.

This means the user's intended model is **Schema-centered private coverage**, not “private plan without any Schema.” The older standalone `hmo_plans` proposal should be reconciled with this chosen rule before implementation. It may still describe commercial product metadata, riders, or subscription offerings, but it must not introduce a competing coverage identity that bypasses the private Schema used by services, tariffs, HCP panel, and enrollees.

The phrase “HCP will be the schema by default” is interpreted as: the HCP/provider is the default provider/panel member for the private Schema. A provider and a Schema are still different entity types in the dump (`providers` vs `schemas`) and are connected through `schema_providers`; do not make a provider row double as a Schema row unless the backend owner explicitly confirms that is the intended meaning.

## Findings

### 1. The current frontend already has a private-sector feature, but it is not the proposed standalone `hmo_plans` model

The `/schemes` page presents an “Informal Sector” workspace and describes creating HMO-owned private schemes without a government scheme. It calls `GET /hmo/schemas`, `POST /hmo/schemas`, and `/hmo/schemas/{id}/providers` through `providersApi`. It then manages provider pricing through `schemaPlansApi`, whose plan resolution is keyed by `schema_id`, `provider_id`, and `plan_id` at `/hmo/marketing/schema-plans/create`.

That is a schema-backed implementation shape: the private item is represented in the UI as a `Schema`, and its provider pricing is represented as a `SchemaPlan`. It is not evidence that the standalone `hmo_plans`, riders, or `enrollee_plans` design from the backend's June document exists. The frontend's plan tiers are described as shared/static (Platinum/Diamond/Gold/Bronze), not as HMO-authored subscription products. Under the clarified product rule, that static tier list may be a starter classification, but it is not sufficient to represent creation of each HMO's actual private coverage product unless backend confirms those tiers are intended to be global.

The private-plan prompt's statement that the only HMO schema route is read-only conflicts with the current frontend API module and `/schemes` page, which call `POST /hmo/schemas`. This conflict must be checked against the actual Laravel `routes/api.php` and controller before choosing a product model. A client call alone does not prove the route is deployed or safe.

### 2. Enrollee import and authorization remain schema-oriented

`ImportEnrolleesModal` fetches the HMO's schemas, asks the user to select a “Health Scheme,” requires a `schema_id`, and submits it with the spreadsheet to `/hmo/enrollees/import`. This matches the clarified schema-centered rule; the key requirement is that the HMO's registration/setup creates or attaches its private Schema and that this Schema is returned by the HMO-scoped schema list. A parallel `hmo_plan_id` import path is not needed merely to identify coverage if the Schema remains canonical. The current flow also tells the HMO that absent roster members will be deactivated, so backend import semantics should be verified before users run it.

`EnrolleeSearchInput` includes `schema_id`, `is_private`, and `plan_id` fields. The dump confirms `enrollees` contains all three fields. `TreatmentMultiSelect` obtains an enrollee-specific catalog from `/hmo/code-requests/treatment-catalog`; the API comment documents schema-wide eligibility or plan-specific eligibility for private/plan enrollees. The component can remain a generic catalog consumer if the backend resolves the catalogue using the enrollee's `schema_id` and, where appropriate, `plan_id`.

`ServiceMultiSelect` is an older/mock component: it tries to find services nested in the schemas list response and explicitly labels its filtering as mocked. It should not be treated as a working schema or private-plan catalog integration. The direct code-request wizard uses `TreatmentMultiSelect`; it does not currently present `ServiceMultiSelect` as the primary authorization catalog.

Tariff import is also schema-scoped (`schema_id`) and the associated backend contract is explicitly labeled proposed/not built. It is separate from plan pricing in `/schemes`.

### 3. What the supplied database dump confirms

The dump includes these relevant structures:

- `hmos.schema_id` nullable, alongside the newer `schema_hmos` many-to-many relationship (`schema_id`, `hmo_id`, `added_by_user_id`). This suggests a legacy direct HMO-to-Schema field coexists with a relationship pivot; choose and document the canonical relationship.
- `schemas` and `schema_providers` (`schema_id`, `provider_id`, `added_by_user_id`), supporting the model where an HCP/provider is linked to a Schema rather than being the Schema itself.
- `schema_plans` with `schema_id`, `plan_id`, and optional `provider_id`.
- `schema_plan_services`, `schema_plan_treatments`, and `schema_plan_drugs` with `schema_id` and `schema_plan_id`/catalog item identifiers, supporting Schema-scoped services and negotiated pricing.
- `services.schema_id`, `schema_treatments.schema_id`, `drug_prices.schema_id`, and `treatment_prices.schema_id`.
- `enrollees.schema_id`, `enrollees.plan_id`, and `enrollees.is_private`.
- Legacy `packages`, `package_drugs`, `package_drug_prices`, `package_schemas`, `package_services`, and `package_treatments` tables exist, but this dump has no `INSERT INTO` sections for them. This means the supplied snapshot contains no dumped rows for those tables; it does not establish that production currently has no rows or that dropping them is safe.

The dump contains four global `plans` values (Platinum, Diamond, Gold, Bronze). Those are distinct from the per-Schema `schema_plans` relationship and should not automatically be treated as each HMO's private plan definitions.

The registration wizard and API types establish that registration creates an HMO, but the frontend alone cannot establish what `CommercialHmoRegistrationService::provisionWithinTransaction` creates. The dump has a provisioned HMO/deployment and registration draft, but does not establish that a private Schema was created for every HMO or how it was linked.

## Practical conclusions

1. **Use Schema as the coverage anchor for private services, tariffs, providers, and enrollees.** At HMO registration/setup, create the private Schema and establish the default provider/panel relationship according to the approved backend rule.
2. **Allow private and government Schemas to coexist for an HMO.** Represent private ownership/type and HMO association explicitly; each enrollee is assigned to the correct Schema and any applicable plan tier.
3. **Keep enrollee treatment selection behind the enrollee-specific catalog endpoint.** The UI can consume one normalized catalog while the backend resolves it from the enrollee's Schema and plan. Do not trust a client-selected plan as authorization truth.
4. **Do not add an `hmo_plan_id` path solely to replace `schema_id`.** Only retain a separate HMO product identifier if it represents a distinct concept (for example, commercial benefit package) and define its relation to the canonical Schema clearly.
5. **No schema/table cleanup is safe based on this dump alone.** The legacy package tables have no data inserts in this snapshot, but production counts, migration history, foreign keys, and code references must be checked before migration/drop.

## Backend checks needed to close the decision

- Compare the current backend `routes/api.php` and controllers with `providersApi.createSchema`, `createSchemaProvider`, `schemaPlansApi`, and enrollee import calls. Confirm which routes are deployed and how HMO ownership is enforced.
- Inspect current migrations/models for `schemas`, `schema_hmos`, `schema_providers`, `schema_plans`, `plans`, `packages`, and every `package_*` table. Confirm whether `hmo_plans` or `enrollee_plans` was added after the older audit.
- Inspect `CommercialHmoRegistrationService::provisionWithinTransaction` and enrollee create/import validation. Implement/confirm the clarified rule: every HMO gets an HMO-owned private Schema during registration/setup, with its default HCP/provider attached as the Schema's provider; all private enrollees and tariffs refer to that Schema. Decide whether to create the Schema transactionally during registration or require a first-login setup step, and make retries idempotent.
- Confirm the default HCP/provider definition and lifecycle: whether the HMO admin must enter an existing provider, whether registration also provisions a provider entity, and how the `schema_providers` and `hmo_providers` pivots are populated. Keep `Provider` and `Schema` as separate entities unless the backend owner explicitly chooses otherwise.
- Standardize whether `hmos.schema_id` or `schema_hmos` is authoritative for an HMO's Schemas. The dump contains both patterns.
- Query production-safe counts and foreign-key references for legacy `packages`/`package_*` data before proposing migration or deletion. Do not run destructive migrations as part of this investigation.
- Verify the treatment catalog's private-enrollee branch, including whether it uses `schema_plan_treatments`, `plan_id`, provider pricing, or an HMO-owned product table.
- Confirm whether self-service private `Schema` creation is a deliberate product capability, and whether it is allowed to create a global `Schema` row or only a tenant-owned relationship/resource.

## Frontend impact after backend decision

- **Private Schema is the chosen coverage model:** ensure the HMO schema endpoint returns the HMO-owned private Schema and any government Schemas separately or with an explicit `type`/`is_private` field. The current frontend `Schema` type has `is_private`, but should also receive reliable owner/relationship information.
- **Registration/setup:** the backend must create the private Schema and default provider relationship reliably. Do not rely on an empty HMO schema list or platform-admin intervention for a private-only HMO.
- **Enrollee import:** retain `schema_id` as the selected coverage Schema, with server validation that the Schema is either owned by the HMO (private) or an allowed linked government Schema. Preserve `plan_id` where it identifies a tier within that Schema.
- **Catalog/pricing:** keep `TreatmentMultiSelect` on an enrollee-scoped catalog abstraction; make eligibility resolution authoritative using the enrollee's Schema and applicable `schema_plan_id`/plan. Replace or remove `ServiceMultiSelect`'s mocked nested-schema assumption before using it for real pricing/authorization.

## No code changes to enrollment or plans

This pass only documents observed frontend behavior and unresolved backend decisions. It does not create migrations, alter APIs, change enrollee import, or modify the private-plan screen.
