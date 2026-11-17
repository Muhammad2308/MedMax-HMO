# MedMax — Master Technical Blueprint
## Multi-Tenant HMO, HCP and SCHEMA Platform

**Document status:** Master planning specification  
**Product name:** MedMax  
**Backend project/folder:** IX2 App  
**Backend technology:** Laravel / PHP / MySQL (MariaDB-compatible)  
**Backend API:** `api.cybernetsystems.ng`  
**Initial development target:** Localhost backend API first  
**Architecture:** Monorepo, API-first, separate HMO / HCP / SCHEMA applications  
**Database authority:** Central master MySQL/MariaDB database

---

# 1. Executive Summary

MedMax is planned as a multi-tenant health-insurance platform in which the HMO, HCP and SCHEMA applications are independent application surfaces inside one monorepo.

The applications are:

```text
MedMax/
├── HMO-App/
├── HCP-App/
├── SCHEMA-App/
└── IX2-App/              # Laravel/PHP/MySQL API backend
```

The three client applications communicate with the Laravel API. They must not directly connect to the MySQL database.

The central database remains the authoritative system of record. Local SQLite databases are application-local operational stores used for installation identity, configuration, cached HMO data, controlled offline work, synchronization state and local queues. SQLite must not become a second independent master database.

The current master database contains 78 application tables covering HMO, SCHEMA, HCP/provider, enrollee, tariff, authorization, claims, billing, clinical and authentication functions. The database already contains important tenant identifiers such as `hmo_id`, `schema_id` and `provider_id`, but the new MedMax architecture should strengthen tenant boundaries and introduce explicit installation, device, licensing and synchronization concepts.

---

# 2. Source Database Assessment

The master SQL dump is a MariaDB 10.4.32 database generated on September 16, 2026 and contains the existing operational schema. The dump begins as a phpMyAdmin export from the `ixhealt1_dbase` database.

The database contains 78 tables, including:

- `hmos`
- `schemas`
- `users`
- `roles`
- `permissions`
- `enrollees`
- `enrollee_dependants`
- `providers`
- `plans`
- `packages`
- `schema_plans`
- `schema_services`
- `schema_treatments`
- `schema_plan_services`
- `schema_plan_treatments`
- `schema_plan_drugs`
- `services`
- `drugs`
- `treatment_prices`
- `drug_prices`
- `code_requests`
- `code_services`
- `code_treatments`
- `code_drugs`
- `code_vetteds`
- `hmo_enrollee_uploads`
- `provider_invoices`
- `invoice_line_items`
- `provider_settlements`
- `provider_wallets`
- `device_sessions`
- clinical/provider-side tables such as admissions, beds, wards, lab requests, procedures, pharmacy and patient tables
- authentication, media, jobs, sessions and audit-related tables.

The database therefore should **not** be copied wholesale into each HMO installation.

The existing enrollee structure is particularly important because it already contains:

- `hmo_id`
- `schema_id`
- `provider_id`
- `plan_id`
- `is_active`
- `is_private`
- `enrollment_id`
- personal demographic fields
- enrollee status
- photo path
- OTP fields

This makes `enrollees` a central operational entity for the HMO application.

The existing HMO table contains organization identity and registration state, while users contain HMO/provider/schema relationships. Providers can also contain both `hmo_id` and `schema_id`, reflecting the fact that a provider may participate in multiple relationships.

---

# 3. Core Architecture Decision

## 3.1 Central Master Database

The central Laravel backend owns:

- HMO organizations
- SCHEMAs
- HCP/providers
- users
- roles and permissions
- enrollee master records
- plans
- schema plans
- provider relationships
- tariff structures
- P-Code authorization
- claims
- vetting
- invoices
- settlements
- financial records
- invitations/onboarding
- licensing
- installations
- devices
- audit records
- synchronization/version information.

The master database is authoritative.

## 3.2 Local SQLite Database

SQLite exists separately inside the HMO-App installation.

It contains only the data required to make the HMO application usable, fast, resilient and capable of controlled offline operation.

SQLite is **not** a replacement for MySQL.

## 3.3 API Boundary

All application communication follows:

```text
HMO-App ───────┐
HCP-App ───────┼──> Laravel API ───> MySQL/MariaDB
SCHEMA-App ────┘
```

During development:

```text
HMO-App ───────┐
HCP-App ───────┼──> localhost Laravel API ───> localhost MySQL
SCHEMA-App ────┘
```

Later:

```text
HMO-App ───────┐
HCP-App ───────┼──> https://api.cybernetsystems.ng ───> production MySQL
SCHEMA-App ────┘
```

The application must therefore use an API base URL/configuration value rather than hard-code the production URL.

---

# 4. Tenant Model

MedMax has three major organizational actors:

```text
SCHEMA
   │
   ├── manages schemes/plans/tariffs
   │
   ├── relates to HMOs
   │
   └── relates to HCPs/providers

HMO
   │
   ├── manages its enrollees
   ├── manages HMO plans/products
   ├── manages provider relationships
   ├── requests/authorizes care
   ├── vets claims
   └── manages provider invoices/settlements

HCP
   │
   ├── operates healthcare facility
   ├── serves enrollees
   ├── requests authorization
   ├── submits services/claims
   └── receives settlement
```

A provider is not permanently owned by one HMO. The current database already permits provider records to have HMO and SCHEMA relationships, and the platform design should preserve the ability for one HCP to work with multiple HMOs.

---

# 5. HMO Application Scope

The HMO-App is the HMO operational application.

Major modules:

1. Dashboard
2. HMO organization profile
3. User management
4. Roles and permissions
5. Call Center
6. Enrollee management
7. Enrollee dependants
8. HMO enrollee imports
9. Plans/products
10. SCHEMA management/selection
11. Provider panel
12. Provider invitations/onboarding
13. Tariff management
14. P-Code requests
15. Referrals
16. Claims
17. Claims vetting
18. Provider invoices
19. Settlements
20. Provider wallet visibility
21. Reports
22. Notifications
23. Audit trail
24. Settings
25. Installation/device management
26. License/subscription status

---

# 6. Important Change: HMO Enrollees Do Not Need to Wait for SCHEMA

This is a major requirement.

The current database contains `hmo_enrollee_uploads`, which already represents an HMO-specific enrollee upload mechanism.

The new MedMax design should formalize this capability.

## 6.1 HMO Enrollee Ownership

An HMO can upload its existing enrollee list directly.

The HMO does not have to wait for a SCHEMA to upload the enrollee data.

The uploaded enrollee is associated with:

- `hmo_id`
- optional `schema_id`
- optional `provider_id`
- optional `plan_id`

The HMO can therefore immediately:

- search the enrollee
- validate the enrollee
- view dependants
- assign/update provider
- assign/update plan
- process operational activities
- use the enrollee in authorization workflows subject to server rules.

## 6.2 Local Representation

The HMO-App should maintain a local copy of the HMO's operational enrollee records.

The local copy is identified by the central record's immutable identifier:

```text
server_id
public_id
enrollment_id
```

The local copy must also retain:

```text
hmo_id
schema_id
provider_id
plan_id
source
sync_status
server_updated_at
local_updated_at
```

## 6.3 Source Types

Every locally imported/created enrollee should have a source indicator such as:

```text
schema_sync
hmo_upload
hmo_manual
server_sync
```

This is important because the HMO may initially upload an enrollee and later the SCHEMA may synchronize the official record.

The system must not silently create duplicate people.

---

# 7. HMO Tariff Upload Requirement

The same principle applies to tariffs.

The HMO may upload:

- Services
- Treatments
- Drugs
- Treatment prices
- Drug prices

but the HMO must select/specify the applicable SCHEMA during upload.

This is important because the master database currently contains schema-specific tariff concepts such as:

- `schema_services`
- `schema_treatments`
- `schema_plan_services`
- `schema_plan_treatments`
- `schema_plan_drugs`
- `treatment_prices`
- `drug_prices`

Therefore:

```text
HMO
  │
  └── Upload tariff
          │
          ├── Select SCHEMA
          ├── Services
          ├── Treatments
          ├── Drugs
          └── Prices
```

The selected `schema_id` becomes mandatory for tariff import operations where the tariff is schema-specific.

---

# 8. Local SQLite Database — Final Proposed Scope

The local database should be divided into seven logical groups:

```text
A. Installation & Identity
B. Authentication & Device State
C. HMO Operational Master Cache
D. Tariff/Plan Operational Cache
E. Transaction/Work Queue
F. Synchronization
G. Local Audit & Application Settings
```

---

# 9. Local SQLite Tables

## 9.1 `installation`

This is the root local record.

Suggested fields:

```text
id
installation_uuid
installation_code
hmo_id
hmo_public_id
hmo_name
hmo_logo
hmo_email
hmo_phone
hmo_state
hmo_city
hmo_address
api_base_url
api_environment
app_version
installation_status
license_status
license_type
license_expires_at
registered_at
last_verified_at
last_sync_at
last_seen_at
created_at
updated_at
```

### Installation status

Suggested states:

```text
new
registering
registered
verified
active
suspended
deactivated
```

The central server controls the authoritative status.

---

# 10. `installation_features`

Stores application entitlements returned by the backend.

Example:

```text
id
feature_key
feature_name
is_enabled
source
server_version
created_at
updated_at
```

Examples:

```text
call_center
enrollees
plans
tariffs
claims
finance
reports
mobile
offline_mode
```

This is preferable to hard-coding commercial feature availability into the UI.

---

# 11. `local_user`

The local database should NOT store the user's password.

Suggested fields:

```text
id
server_user_id
name
email
phone_number
profile_photo_path
hmo_id
is_org_admin
is_approved
last_login_at
last_sync_at
is_active
created_at
updated_at
```

The actual authentication credential/token should use secure operating-system storage where available.

---

# 12. `local_role`

```text
id
server_role_id
hmo_id
title
scope_type
created_at
updated_at
```

# 13. `local_permission`

```text
id
server_permission_id
hmo_id
title
created_at
updated_at
```

# 14. `local_role_permissions`

```text
role_id
permission_id
```

# 15. `local_user_roles`

```text
user_id
role_id
```

The server remains authoritative for authorization.

The local permission data exists so the interface can immediately determine which modules to display, but the API must enforce permissions independently.

---

# 16. `local_devices`

Because the master database already contains `device_sessions`, the local installation should also track the current installation/device state.

```text
id
device_uuid
device_name
platform
app_version
server_device_id
user_id
is_current
last_login_at
last_seen_at
created_at
updated_at
```

---

# 17. Local HMO Organization Data

## `hmo_profile`

```text
id
server_hmo_id
name
state
city
address
email
phone
logo_path
is_verified
is_active
registration_status
server_updated_at
created_at
updated_at
```

This is intentionally a local cache of the HMO organization rather than a replacement for `hmos`.

The master `hmos` table already contains organization identity and registration fields.

---

# 18. `hmo_schemas`

This table records the SCHEMAs that the HMO is permitted to work with.

```text
id
server_schema_id
hmo_id
schema_title
package_code
is_active
relationship_status
server_updated_at
created_at
updated_at
```

This is critical for the new tariff-upload workflow.

The HMO user should only be able to select SCHEMAs to which that HMO is actually entitled/connected.

---

# 19. `hmo_providers`

The local HMO app should cache provider information relevant to that HMO.

```text
id
server_provider_id
hmo_id
schema_id
name
provider_code
hcp_no
facility_type
state
city
address
email
phone
account
bank_name
provider_status
is_verified
relationship_status
server_updated_at
created_at
updated_at
```

A provider may appear under more than one HMO relationship.

Do not assume:

```text
provider_id -> one hmo
```

The relationship is contextual.

---

# 20. `enrollees`

This is one of the most important local tables.

Recommended local fields:

```text
id
server_id
public_id
hmo_id
schema_id
provider_id
plan_id

name
phone_number
email
blood_group
gender
date_of_birth
nin_number
marital_status
category
state
lga
ward
address

next_of_kin_name
next_of_kin_phone_number

enrollment_id
type
enrollee_status
is_active
is_private

enrollee_photo_path

source
sync_status
server_created_at
server_updated_at
local_created_at
local_updated_at

created_at
updated_at
```

The fields deliberately mirror the important operational fields already present in the master `enrollees` table.

The master database confirms that the existing enrollee record already supports HMO, SCHEMA, provider and plan relationships.

---

# 21. `enrollee_dependants`

```text
id
server_id
enrollee_server_id
hmo_id
provider_id
plan_id

name
phone_number
blood_group
gender
date_of_birth
enrollment_id
dependant_photo_path
is_active
is_private

source
sync_status
server_created_at
server_updated_at
local_created_at
local_updated_at

created_at
updated_at
```

---

# 22. Enrollee Import Tables

Because HMO uploads are now a first-class feature, do not insert raw Excel rows directly into `enrollees`.

Use:

## `enrollee_import_batches`

```text
id
server_batch_id
hmo_id
file_name
file_hash
total_rows
processed_rows
successful_rows
failed_rows
duplicate_rows
status
uploaded_by
started_at
completed_at
created_at
updated_at
```

## `enrollee_import_rows`

```text
id
batch_id
row_number
raw_data
normalized_data
enrollment_id
validation_status
error_message
server_id
sync_status
created_at
updated_at
```

This provides:

- duplicate detection
- validation
- error reporting
- retry
- auditability
- resumable uploads.

---

# 23. Local Plans

The HMO application should cache only the plans relevant to that HMO.

## `plans`

```text
id
server_id
hmo_id
schema_id
name
plan_type
status
source
server_updated_at
created_at
updated_at
```

The master database contains both general `plans` and HMO-specific `packages`.

The local design should preserve that distinction rather than collapsing every plan into one uncontrolled table.

---

# 24. `hmo_packages`

For the existing `packages` concept:

```text
id
server_id
hmo_id
plan_name
type
price
status
server_updated_at
created_at
updated_at
```

---

# 25. Tariff Catalogue

The local HMO application needs tariff data for:

- plan configuration
- verification
- claim preparation
- operational display
- tariff upload
- comparison.

But it should not download every global tariff ever created.

Only the HMO's relevant schemas and provider relationships should be synchronized.

---

# 26. `services`

Local catalogue:

```text
id
server_id
title
service_code
service_status
major_id
source
server_updated_at
created_at
updated_at
```

# 27. `treatments`

```text
id
server_id
service_id
treatment_code
treatment_title
treatment_status
treatment_price
schema_id
is_primary
source
server_updated_at
created_at
updated_at
```

# 28. `drugs`

```text
id
server_id
name
generic_name
drug_code
dosage_form
unit
drug_status
source
server_updated_at
created_at
updated_at
```

---

# 29. Schema-Specific Local Tariffs

## `schema_services`

```text
id
server_id
schema_id
service_id
hmo_id
service_code
service_title
service_price
source
effective_from
effective_to
price_status
server_updated_at
created_at
updated_at
```

## `schema_treatments`

```text
id
server_id
schema_id
service_id
treatment_id
hmo_id
treatment_code
treatment_title
treatment_price
treatment_status
source
effective_from
effective_to
price_status
server_updated_at
created_at
updated_at
```

## `schema_drugs`

This can be represented using the drug catalogue plus schema price records.

---

# 30. `treatment_prices`

```text
id
server_id
hmo_id
schema_id
service_id
treatment_id
code
price
effective_date
price_status
source
sync_status
server_updated_at
created_at
updated_at
```

# 31. `drug_prices`

```text
id
server_id
hmo_id
schema_id
drug_id
price
effective_date
price_status
source
sync_status
server_updated_at
created_at
updated_at
```

This allows an HMO to upload its tariff against a selected SCHEMA without pretending that the HMO owns the global service/drug catalogue.

---

# 32. HMO Tariff Import

Use:

## `tariff_import_batches`

```text
id
server_batch_id
hmo_id
schema_id
file_name
file_hash
tariff_type
total_rows
processed_rows
successful_rows
failed_rows
duplicate_rows
status
uploaded_by
started_at
completed_at
created_at
updated_at
```

## `tariff_import_rows`

```text
id
batch_id
row_number
item_type
raw_data
normalized_data
validation_status
error_message
server_id
sync_status
created_at
updated_at
```

This supports importing services, treatments and drugs in a controlled manner.

---

# 33. Provider Tariffs

The master database also has provider-specific pricing concepts such as `provider_drugs`.

The HMO-App should cache provider-specific tariff data only for providers connected to that HMO.

Recommended local tables:

```text
provider_services
provider_treatments
provider_drugs
```

Each should contain:

```text
server_id
hmo_id
provider_id
schema_id
catalogue_item_id
price
effective_date
status
server_updated_at
```

The exact server-side relationship must be finalized during API/database implementation because the current master database contains multiple overlapping tariff structures.

---

# 34. P-Code / Authorization

The HMO application needs P-Code history for operational visibility.

The master database contains `code_requests`, which includes:

- enrollee
- provider
- P-Code
- status
- referral
- diagnoses
- HMO
- user
- closed state.

The local cache should therefore contain:

## `code_requests`

```text
id
server_id
public_id
hmo_id
enrollee_id
provider_id
p_code
is_reference
referral_id
code_status
comments
diagnoses
is_closed

server_created_at
server_updated_at
sync_status

created_at
updated_at
```

## `code_services`

```text
server_id
code_request_id
service_id
```

## `code_treatments`

```text
server_id
code_request_id
treatment_id
quantity
treatment_price
treatment_total
vetted_amount
comments
```

## `code_drugs`

```text
server_id
code_request_id
drug_id
quantity
drug_price
total_cost
vetted_amount
```

## `code_vetteds`

```text
server_id
code_request_id
enrollee_id
diagnose
claim_amount
vetted_amount
remarks
payment_status
```

### Important

The local database may cache P-Code history.

It must **not independently authorize P-Codes while online**.

P-Code issuance remains a central server transaction.

---

# 35. Claims

Local claim records may be cached for:

- recent activity
- claim queues
- vetting screens
- synchronization
- reporting views.

The central server remains authoritative for:

- claim status
- approved amount
- vetted amount
- final settlement
- payment status.

---

# 36. Provider Invoices

The HMO app should cache invoice records relevant to the HMO.

Recommended:

## `provider_invoices`

```text
id
server_id
public_id
invoice_no
hmo_id
patient_id
provider_id
date
subtotal
tax
discount
total
payment_type
hmo_claim_ref
status
patient_type
created_by

server_updated_at
sync_status
created_at
updated_at
```

## `invoice_line_items`

```text
id
server_id
invoice_id
description
quantity
unit_price
subtotal
billing_path
server_updated_at
created_at
updated_at
```

---

# 37. Settlements

The local database can cache settlement records for visibility.

## `provider_settlements`

```text
id
server_id
public_id
hmo_id
provider_id
amount
status
acc_approval
remark
created_by
approved_by
server_updated_at
sync_status
created_at
updated_at
```

However, final financial approval and payment must remain server-controlled.

---

# 38. Provider Wallets

The HMO-App can cache:

```text
provider_id
balance
total_deposited
last_updated_at
server_updated_at
```

Do not make local wallet balance authoritative.

---

# 39. Offline Queue

A key table:

## `sync_queue`

```text
id
uuid
entity_type
entity_id
operation
payload
priority
status
attempts
last_attempt_at
next_attempt_at
error_message
created_at
updated_at
```

Operations:

```text
create
update
delete
upload
action
```

Examples:

```text
HMO enrollee import
enrollee update
provider relationship request
tariff import
user profile update
notes
non-critical operational actions
```

---

# 40. Synchronization State

## `sync_state`

```text
id
resource
scope_type
scope_id
last_server_version
last_synced_at
next_sync_at
sync_status
last_error
created_at
updated_at
```

Example resources:

```text
hmo_profile
schemas
providers
enrollees
dependants
plans
services
treatments
drugs
tariffs
claims
code_requests
invoices
settlements
notifications
```

---

# 41. Server Change Tracking

The master backend should eventually expose a change/version mechanism.

Possible design:

```text
resource
record_id
tenant_type
tenant_id
operation
version
changed_at
```

This lets SQLite request:

```text
Give me all HMO 12 enrollee changes after version 10492.
```

rather than downloading the entire enrollee table repeatedly.

---

# 42. Local Notifications

## `notifications`

```text
id
server_id
user_id
hmo_id
type
title
message
data
is_read
read_at
server_created_at
created_at
updated_at
```

Notifications may include:

- provider onboarding
- claim query
- P-Code status
- settlement approval
- invoice status
- tariff import result
- enrollee import result
- system announcements.

---

# 43. Local Audit

## `local_audit_logs`

```text
id
uuid
user_id
action
entity_type
entity_id
description
payload
created_at
```

This is for local application traceability.

It does not replace the server's authoritative `audit_logs`.

---

# 44. Application Settings

## `app_settings`

```text
id
key
value
value_type
is_encrypted
created_at
updated_at
```

Examples:

```text
api_base_url
api_timeout
sync_interval
offline_mode
theme
language
last_dashboard_sync
```

Do not store passwords here.

---

# 45. Registration / First Installation Flow

## First launch

```text
MedMax starts
     │
     ▼
Open SQLite
     │
     ├── installation exists?
     │        │
     │        ├── YES → verify installation with API
     │        │
     │        └── NO
     │
     ▼
Check server for recovery/existing registration
     │
     ├── Existing installation → recover
     │
     └── New installation
             │
             ▼
       HMO Registration Wizard
```

---

# 46. HMO Registration Wizard

Recommended sequence:

### Step 1 — Welcome

Explain MedMax and installation.

### Step 2 — Organization

Collect:

- HMO name
- email
- phone
- state
- city
- address
- logo

### Step 3 — Business Information

Collect applicable registration/business information.

### Step 4 — Financial Information

Collect organization banking details where required.

### Step 5 — HMO Administrator

Collect:

- name
- email
- phone
- password setup/invitation
- profile information.

### Step 6 — Initial Configuration

Select:

- operating schemas
- initial plans
- optional settings.

### Step 7 — Review

Show complete registration.

### Step 8 — Submit

Call the localhost API during development.

### Step 9 — Server Registration

The server creates:

```text
HMO
Admin User
Default Roles
Default Permissions
Installation
Initial Configuration
```

inside a database transaction.

### Step 10 — Local Registration

After successful server response, SQLite stores:

```text
hmo_id
installation_uuid
installation_code
admin user reference
license status
feature entitlements
API base URL
sync state
```

---

# 47. Existing HMO Recovery

SQLite emptiness must not automatically mean that the HMO is new.

Possible scenarios:

```text
SQLite deleted
SQLite corrupted
Computer replaced
App reinstalled
Database migrated
```

Therefore the backend needs an installation recovery mechanism.

Recovery may use:

- organization identifier
- verified administrator account
- invitation/recovery token
- installation code
- device registration.

Never rely exclusively on a local database file to determine ownership.

---

# 48. Authentication

The master `users` table already supports:

- email
- phone
- password
- OTP
- invitation token
- approval
- organization admin
- provider/HMO/SCHEMA association
- two-factor fields.

The new MedMax authentication flow should build on this rather than creating a separate user database for each application.

One server identity should work across:

```text
HMO-App
HCP-App
SCHEMA-App
```

where the user's organization and permissions permit access.

---

# 49. HMO User Roles

Initial HMO roles:

1. HMO Administrator
2. Call Center Officer
3. Operations Officer
4. Accounts Officer

The master operational process defines these departmental responsibilities.

Custom roles should also be supported.

---

# 50. Call Center Workflow

The HMO workflow remains:

```text
Enrollee visits HCP
       ↓
HCP requests verification
       ↓
HMO Call Center validates
       ↓
Eligibility / provider / plan check
       ↓
Prior authorization
       ↓
P-Code
       ↓
Service
       ↓
Claim
```

The existing `code_requests` table is already aligned with this operational model.

---

# 51. Operations Workflow

Operations manages:

- HMO plans
- SCHEMA relationships
- provider panels
- tariffs
- enrollee rosters
- HMO enrollee imports
- claims vetting.

The existing master database has separate structures for schema services/treatments/plans and HMO/package concepts.

---

# 52. Finance Workflow

Finance manages:

```text
Provider claims
    ↓
Invoice
    ↓
Reconciliation
    ↓
Vetting
    ↓
Settlement approval
    ↓
Payment
    ↓
Wallet/financial record
```

Financial records must remain server authoritative.

---

# 53. HCP Application

The HCP-App is an independent application.

It is NOT a sub-module that the HMO must purchase.

The HCP application has its own:

- registration
- onboarding
- dashboard
- facility profile
- staff
- patients
- services
- claims
- P-Code requests
- invoices
- clinical workflows
- reporting.

HMO and HCP communicate through the API and formal relationships.

---

# 54. HCP Onboarding Model

The planned onboarding relationship should be preserved.

Example:

```text
HMO invites HCP
       ↓
Backend creates invitation
       ↓
SMS sent to HCP administrator
       ↓
HCP opens secure onboarding link
       ↓
HCP confirms/registers
       ↓
HCP completes organization details
       ↓
HCP relationship activated
```

The reverse relationship should also be supported:

```text
HCP
 ↓
invites / requests relationship with HMO
 ↓
HMO receives request
 ↓
HMO reviews
 ↓
HMO accepts/rejects
```

The exact onboarding workflows will be incorporated when the existing onboarding MD files are supplied.

---

# 55. SCHEMA Application

SCHEMA-App is also an independent application.

It should manage:

- SCHEMA organization
- HMOs
- HCPs
- plans
- services
- treatments
- drugs
- tariffs
- enrollee uploads
- relationships
- reports
- approvals
- onboarding.

The SCHEMA remains the authoritative owner of SCHEMA-originated data.

---

# 56. HMO vs SCHEMA Data Authority

This is a critical rule.

An HMO can locally work with a copy of:

- its enrollees
- its providers
- selected SCHEMAs
- selected plans
- selected tariffs.

But a copy does not automatically become the global master record.

Use:

```text
source
origin_id
server_id
sync_status
```

to preserve provenance.

Example:

```text
source = hmo_upload
schema_id = 5
hmo_id = 12
```

Later:

```text
source = schema_sync
schema_id = 5
hmo_id = 12
```

The backend resolves the relationship and prevents duplication.

---

# 57. Data Conflict Strategy

The local database must not overwrite newer server information blindly.

Recommended record states:

```text
synced
local_only
pending_upload
pending_update
server_changed
conflict
failed
archived
```

Conflict resolution should be server-controlled for sensitive records.

---

# 58. What MUST NOT Be Fully Replicated Locally

Do not replicate the entire master database into the HMO SQLite database.

Especially avoid local copies of unrelated HCP clinical tables such as:

- admissions
- beds
- wards
- vital signs
- doctor signs
- pharmacy inventory
- pharmacy sales
- clinical patient tables
- lab operational tables
- provider-side clinical records.

These belong primarily to HCP-App/provider workflows.

The master database contains these tables, but their presence in MySQL does not mean they belong in the HMO local database.

---

# 59. Local Data Classification

## Tier A — Local identity

Must be local:

- installation
- HMO profile
- current user
- device
- feature entitlements
- app settings.

## Tier B — Operational cache

Should be local:

- HMO enrollees
- dependants
- providers
- SCHEMAs
- plans
- tariffs
- recent claims
- recent P-Codes
- invoices
- settlement summaries
- notifications.

## Tier C — Offline queue

May be local:

- import jobs
- non-critical updates
- retryable requests
- sync operations.

## Tier D — Server authoritative

Must remain server authoritative:

- authentication authority
- P-Code authorization
- final claims approval
- final vetting
- settlement approval
- financial balances
- licensing
- organization status
- tenant access
- final permissions.

---

# 60. Lifetime License

MedMax should support both subscription licensing and lifetime licensing.

Do not implement licensing as only:

```text
expires_at
```

because lifetime licenses have no normal expiry.

Recommended license model:

```text
license_type:
    subscription
    lifetime
    trial
    complimentary
```

For lifetime:

```text
license_type = lifetime
expires_at = NULL
```

The license can still have:

- active/suspended status
- organization binding
- product entitlement
- installation limits
- device limits
- support/maintenance dates
- upgrade entitlement.

A lifetime license means perpetual product entitlement under the agreed license terms; it does not have to mean unlimited future services, hosting or support.

---

# 61. Commercial Licensing Structure

The product should not be sold as:

```text
HMO-only
HCP-only
HMO + HCP
```

because HMO-App and HCP-App are independent products/applications.

Instead licensing should be organized around:

### MedMax HMO

HMO operational platform.

### MedMax HCP

Independent provider platform.

### MedMax SCHEMA

Independent SCHEMA platform.

Each application can have its own license/entitlement.

An organization may use the applications through formal relationships and invitations.

---

# 62. HMO Licensing

Possible license modes:

```text
trial
subscription
annual
multi-year
lifetime
```

Possible limits:

```text
max_users
max_enrollees
max_installations
max_devices
max_storage
max_import_rows
```

Some limits may be unlimited for lifetime contracts where commercially agreed.

---

# 63. Installation Licensing

A license should be associated with:

```text
organization
application
license
installation
device
```

Example:

```text
HMO
 ↓
MedMax HMO License
 ↓
Installation A
 ↓
Desktop Device 1
```

If the organization replaces its computer, the old installation can be deactivated and a new installation activated.

---

# 64. Proposed New Master Backend Tables

The existing master database should be extended with concepts such as:

## `installations`

```text
id
uuid
application_type
hmo_id
provider_id
schema_id
license_id
installation_code
installation_token_hash
status
platform
app_version
last_seen_at
last_sync_at
activated_at
deactivated_at
created_at
updated_at
```

## `devices`

```text
id
installation_id
user_id
device_identifier
device_name
platform
app_version
is_active
last_login_at
last_seen_at
created_at
updated_at
```

## `licenses`

```text
id
organization_type
organization_id
application_type
license_type
status
starts_at
expires_at
max_users
max_enrollees
max_installations
max_devices
support_until
created_at
updated_at
```

## `license_features`

```text
id
license_id
feature_key
is_enabled
limit_value
created_at
updated_at
```

## `onboarding_invitations`

```text
id
sender_type
sender_id
recipient_type
recipient_id
recipient_phone
recipient_email
token_hash
expires_at
status
accepted_at
created_at
updated_at
```

## `sync_cursors`

```text
id
application_type
organization_type
organization_id
resource
cursor
version
updated_at
```

These tables should be added only after the current migrations and API are audited.

---

# 65. Tenant Security

Every HMO API request must enforce:

```text
authenticated_user
        ↓
organization context
        ↓
HMO ownership/relationship
        ↓
permission
        ↓
record scope
```

Do not rely only on:

```text
WHERE hmo_id = auth()->user()->hmo_id
```

for every resource.

For provider data, verify the HMO-provider relationship.

For SCHEMA data, verify the HMO-SCHEMA relationship.

For enrollee data, verify HMO ownership/relationship.

For tariff data, verify the selected SCHEMA is authorized for the HMO.

---

# 66. P-Code Uniqueness

P-Codes must be globally safe.

The current `code_requests` table contains `hmo_id`, and P-Codes already appear in operational data.

The final implementation should enforce uniqueness at the server level using a suitable unique identifier/generation strategy.

Never depend on SQLite to guarantee P-Code uniqueness.

---

# 67. Development Environment

The first implementation phase must use localhost.

Recommended:

```text
HMO-App
    ↓
http://127.0.0.1:8000/api
    ↓
Laravel IX2-App
    ↓
localhost MySQL/MariaDB
```

Production later:

```text
HMO-App
    ↓
https://api.cybernetsystems.ng
    ↓
Laravel IX2-App
    ↓
Production MySQL/MariaDB
```

The API base URL should be environment-configurable.

Example conceptual configuration:

```text
API_BASE_URL=http://127.0.0.1:8000
```

and later:

```text
API_BASE_URL=https://api.cybernetsystems.ng
```

---

# 68. Monorepo Structure

Recommended:

```text
MedMax/
│
├── HMO-App/
│   ├── onboarding/
│   ├── authentication/
│   ├── dashboard/
│   ├── call-center/
│   ├── enrollees/
│   ├── dependants/
│   ├── imports/
│   ├── plans/
│   ├── schemas/
│   ├── providers/
│   ├── tariffs/
│   ├── claims/
│   ├── p-codes/
│   ├── invoices/
│   ├── settlements/
│   ├── reports/
│   ├── users/
│   ├── roles/
│   ├── settings/
│   ├── local-db/
│   └── sync/
│
├── HCP-App/
│   ├── onboarding/
│   ├── authentication/
│   ├── dashboard/
│   ├── patients/
│   ├── clinical/
│   ├── claims/
│   ├── p-codes/
│   ├── billing/
│   └── sync/
│
├── SCHEMA-App/
│   ├── onboarding/
│   ├── authentication/
│   ├── dashboard/
│   ├── hmos/
│   ├── providers/
│   ├── plans/
│   ├── tariffs/
│   ├── enrollees/
│   └── reports/
│
└── IX2-App/
    ├── app/
    ├── routes/
    ├── database/
    ├── config/
    ├── resources/
    ├── tests/
    └── ...
```

The backend folder remains named `IX2-App` for the existing Laravel backend/project context, but the customer-facing product/application name is **MedMax**.

---

# 69. API Design

The API should remain versioned:

```text
/api/v1/
```

HMO examples:

```text
/api/v1/hmo/auth/login
/api/v1/hmo/auth/logout

/api/v1/hmo/onboarding/register

/api/v1/hmo/org/profile
/api/v1/hmo/org/users
/api/v1/hmo/org/roles
/api/v1/hmo/org/permissions

/api/v1/hmo/schemas
/api/v1/hmo/providers

/api/v1/hmo/enrollees
/api/v1/hmo/enrollees/import
/api/v1/hmo/enrollees/import/{batch}

/api/v1/hmo/plans
/api/v1/hmo/tariffs
/api/v1/hmo/tariffs/import

/api/v1/hmo/call-center/enrollees/validate
/api/v1/hmo/call-center/requests

/api/v1/hmo/claims
/api/v1/hmo/claims/vet

/api/v1/hmo/finance/invoices
/api/v1/hmo/finance/settlements
/api/v1/hmo/finance/wallet
```

The exact route naming should be reconciled with the existing Laravel routes before implementation.

---

# 70. Existing Database Alignment

The current master database provides strong building blocks.

Important existing HMO fields:

`hmos` includes:

```text
schema_id
admin_user_id
name
state
city
address
email
phone
is_verified
is_active
registration_status
verification_token
```

The `users` table includes:

```text
provider_id
hmo_id
schema_id
package_schema_id
is_org_admin
is_approved
```

The `roles` and `permissions` tables include organization identifiers.

The `enrollees` table includes:

```text
provider_id
hmo_id
schema_id
plan_id
```

The `providers` table includes:

```text
schema_id
hmo_id
admin_user_id
```

These fields support the proposed multi-organization model, but the relationships should be audited before production multi-tenancy is enabled.

---

# 71. Important Database Improvement

The existing design sometimes represents relationships by putting organization IDs directly on records.

That is useful but not sufficient for all many-to-many relationships.

Where a provider can work with multiple HMOs, the preferred future model is an explicit relationship table such as:

```text
hmo_providers
```

with:

```text
id
hmo_id
provider_id
schema_id
status
contract_reference
effective_from
effective_to
created_at
updated_at
```

Likewise, HMO-SCHEMA relationships should use an explicit relationship table if the existing database does not already provide one.

This prevents ambiguous ownership.

---

# 72. Data Ownership Rules

## HMO owns/controls operationally

- HMO organization settings
- HMO users
- HMO-specific enrollee assignments
- HMO plans/products
- HMO provider relationships
- HMO imports
- claims generated under the HMO
- HMO operational reports.

## SCHEMA owns/controls

- SCHEMA organization
- SCHEMA plans
- schema-wide tariff definitions
- schema enrollee datasets
- SCHEMA-provider relationships where applicable.

## HCP owns/controls

- provider organization
- provider staff
- clinical records
- facility resources
- provider claims
- provider invoices
- provider-side operational records.

## Platform owns/controls

- licensing
- installations
- application entitlements
- system-level audit
- tenant isolation
- API authentication infrastructure.

---

# 73. Offline Strategy

Offline mode should be selective.

## Allowed/appropriate

- viewing previously synchronized enrollees
- searching local cached enrollees
- viewing providers
- viewing plans
- viewing tariffs
- preparing imports
- preparing non-sensitive records
- reading reports already synchronized
- composing retryable requests.

## Online-only

- final P-Code authorization
- final eligibility authority
- final claims approval
- financial settlement approval
- wallet updates
- licensing validation
- tenant/permission authority.

---

# 74. Security Rules for SQLite

Never store:

- plaintext passwords
- long-lived master API secrets
- server database credentials
- unrestricted administrator credentials.

Use secure credential storage for authentication tokens where the application platform supports it.

SQLite should be protected using:

- file permissions
- OS user isolation
- encryption where appropriate
- secure token storage
- minimal retained data
- logout/session cleanup.

---

# 75. Sync Strategy

Synchronization should occur in layers.

### Startup

```text
verify installation
verify license
refresh current user
refresh feature entitlements
```

### Normal sync

```text
HMO profile
schemas
providers
plans
enrollees
dependants
tariffs
notifications
recent claims
recent invoices
settlements
```

### Background sync

Use incremental changes rather than full database downloads.

---

# 76. HMO Enrollee Upload API

Recommended conceptual API:

```text
POST /api/v1/hmo/enrollees/import
```

Workflow:

```text
Upload file
     ↓
Create import batch
     ↓
Validate file
     ↓
Parse rows
     ↓
Validate required fields
     ↓
Detect duplicates
     ↓
Resolve schema/provider/plan
     ↓
Create/update enrollee
     ↓
Return import summary
     ↓
Sync result to local SQLite
```

The existing `hmo_enrollee_uploads` table can be retained as part of compatibility/migration, but the new batch/import architecture should be more complete.

---

# 77. Tariff Upload API

Recommended:

```text
POST /api/v1/hmo/tariffs/import
```

Required:

```text
hmo_id → derived from authenticated context
schema_id → selected by HMO user
file
tariff_type
```

The server must verify:

```text
Does this HMO have a valid relationship with this SCHEMA?
```

before accepting the import.

---

# 78. Duplicate Handling

For enrollees, possible matching keys:

1. Existing server `public_id`
2. Existing `enrollment_id`
3. HMO + enrollment number
4. Carefully controlled NIN match
5. Other approved identifiers.

For tariffs:

1. schema_id
2. catalogue item
3. code
4. effective date/version.

The final matching rules should be explicitly implemented in the backend rather than inferred by the client.

---

# 79. Reporting

The HMO-App should report only HMO-scoped data.

Examples:

- total enrollees
- active/inactive enrollees
- dependants
- enrollee by plan
- enrollee by SCHEMA
- provider utilization
- P-Code activity
- claims
- vetted claims
- invoices
- settlements
- provider balances
- tariff usage
- import summaries.

The server should generate authoritative reports.

SQLite can support fast local dashboards but must not be treated as the official financial reporting source.

---

# 80. Migration Strategy

Do not immediately replace the existing master database.

Proceed in stages.

## Phase 1 — Audit

Audit:

- all tenant identifiers
- foreign keys
- relationships
- routes
- controllers
- policies
- middleware
- queries
- file storage
- reports
- authentication.

## Phase 2 — Backend foundations

Add:

- installation
- device
- license
- feature entitlement
- onboarding invitation
- synchronization/version concepts.

## Phase 3 — Local SQLite

Create the local schema described in this document.

## Phase 4 — API abstraction

Make HMO-App communicate exclusively through the API.

## Phase 5 — HMO onboarding

Implement first-run registration.

## Phase 6 — HMO enrollee import

Implement HMO-owned enrollee upload.

## Phase 7 — HMO tariff import

Implement SCHEMA-selected tariff uploads.

## Phase 8 — Sync

Implement incremental synchronization.

## Phase 9 — Licensing

Implement subscription and lifetime licensing.

## Phase 10 — HCP onboarding

Implement the SMS invitation workflow.

## Phase 11 — SCHEMA workflows

Integrate SCHEMA-originated data and synchronization.

---

# 81. Local SQLite: Recommended Final Table Set

The initial HMO SQLite database should contain approximately:

### Installation

```text
installation
installation_features
app_settings
```

### Identity

```text
local_user
local_role
local_permission
local_user_roles
local_role_permissions
local_devices
```

### Organization

```text
hmo_profile
hmo_schemas
hmo_providers
```

### Enrollees

```text
enrollees
enrollee_dependants
enrollee_import_batches
enrollee_import_rows
```

### Plans

```text
plans
hmo_packages
```

### Tariffs

```text
services
treatments
drugs
schema_services
schema_treatments
treatment_prices
drug_prices
provider_services
provider_treatments
provider_drugs
tariff_import_batches
tariff_import_rows
```

### Authorization/Claims

```text
code_requests
code_services
code_treatments
code_drugs
code_vetteds
```

### Finance

```text
provider_invoices
invoice_line_items
provider_settlements
provider_wallets
```

### Communication

```text
notifications
```

### Synchronization

```text
sync_queue
sync_state
```

### Local audit

```text
local_audit_logs
```

This is a **purpose-built HMO operational database**, not a miniature copy of the entire master database.

---

# 82. Local SQLite Data Lifecycle

For every server-backed record:

```text
SERVER RECORD
    │
    ▼
download
    │
    ▼
SQLite cache
    │
    ├── viewed locally
    ├── updated locally if permitted
    └── queued if offline
              │
              ▼
          API sync
              │
              ▼
       server validation
              │
              ▼
       master database
              │
              ▼
       synchronization result
              │
              ▼
          SQLite update
```

---

# 83. The Most Important Principle

The correct architecture is:

> **MedMax is a multi-tenant, API-first health-insurance platform. The central Laravel API and MySQL/MariaDB database are the authoritative system of record. HMO-App, HCP-App and SCHEMA-App are independent applications in one monorepo. Each application may maintain a purpose-built local SQLite store for identity, configuration, cached operational data, synchronization and controlled offline work.**

---

# 84. Immediate Development Rule

Do not start by modifying the production API.

First configure:

```text
MedMax HMO-App
        ↓
localhost Laravel IX2-App
        ↓
localhost MySQL/MariaDB
```

Then prove:

1. HMO registration
2. local installation creation
3. HMO admin creation
4. login
5. role/permission loading
6. HMO enrollee upload
7. HMO enrollee search
8. SCHEMA selection
9. tariff upload
10. provider loading
11. synchronization
12. P-Code workflow
13. claims workflow
14. finance workflow.

Only after these work locally should the API base URL be changed to:

```text
https://api.cybernetsystems.ng
```

---

# 85. Future Onboarding Integration

Additional onboarding MD documents will be incorporated into this architecture when supplied.

The architecture already reserves the required concepts for:

- HMO-to-HCP invitation
- HCP-to-HMO relationship request
- SMS invitation
- secure onboarding links
- invitation expiry
- administrator registration
- organization verification
- relationship approval
- activation.

No final SMS provider implementation should be locked until the existing onboarding specifications are reviewed.

---

# 86. Final Product Direction

MedMax should evolve as a platform rather than as three disconnected applications.

```text
                         MEDMAX PLATFORM
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
       HMO-App              HCP-App             SCHEMA-App
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                         IX2-App API
                         Laravel / PHP
                               │
                         Master Database
                         MySQL/MariaDB
                               │
                ┌──────────────┼──────────────┐
                │              │              │
              HMO            HCP           SCHEMA
                │              │              │
                └──────────── relationships ──┘
```

The platform's strength comes from keeping the applications independent while allowing them to interact through secure, tenant-aware API relationships.

---

# 87. Implementation Guardrails

Before coding any new local database feature:

- Do not duplicate the whole master database.
- Do not store passwords in SQLite.
- Do not let SQLite authorize P-Codes.
- Do not let local financial records override server records.
- Do not assume a provider belongs to only one HMO.
- Do not assume an enrollee must originate from a SCHEMA.
- Do not allow an HMO to upload schema-specific tariffs without selecting/validating the SCHEMA.
- Do not use frontend filtering as tenant security.
- Do not hard-code the production API URL.
- Do not make HMO-App directly access MySQL.
- Do not delete the existing master structures until compatibility has been established.
- Do not implement HCP as a purchased add-on to HMO-App; keep it as an independent application.
- Do not implement only subscription licensing; support lifetime licensing.
- Do not make an empty SQLite database the sole proof that an HMO is a new customer.

---

# 88. Recommended First Build

The first development sprint should be:

```text
1. Localhost Laravel API configuration
2. Master database connection
3. Tenant/authentication audit
4. Installation table
5. Device table
6. License table
7. Feature entitlement table
8. HMO registration endpoint
9. HMO registration wizard
10. SQLite installation schema
11. SQLite HMO profile
12. SQLite admin/user
13. API login
14. HMO enrollee import API
15. HMO enrollee SQLite cache
16. SCHEMA relationship loading
17. Tariff import with required schema_id
18. Sync engine foundation
```

After that, integrate the operational modules.

---

# 89. Decision Summary

| Decision | Final Direction |
|---|---|
| Product name | **MedMax** |
| Backend folder/project | **IX2-App** |
| Backend | Laravel / PHP |
| Master DB | MySQL/MariaDB |
| Production API | `api.cybernetsystems.ng` |
| Development API | Localhost first |
| Architecture | Monorepo |
| HMO-App | Independent application |
| HCP-App | Independent application |
| SCHEMA-App | Independent application |
| Client-to-DB access | API only |
| Local DB | SQLite |
| SQLite purpose | Identity, cache, sync, controlled offline |
| Master DB | Authoritative |
| HMO enrollee upload | Yes |
| HMO enrollee upload requires SCHEMA | Not necessarily |
| HMO tariff upload | Yes |
| Tariff upload requires SCHEMA | Yes |
| HCP relationship | Invitation/onboarding based |
| HMO → HCP onboarding | SMS + secure link |
| HCP → HMO onboarding | Supported |
| P-Code authority | Server |
| Financial authority | Server |
| Lifetime license | Supported |
| Subscription license | Supported |
| HCP as HMO add-on | No |
| Full master DB copied to SQLite | No |

---

# 90. Closing Architecture Statement

**MedMax should be built as a secure multi-tenant ecosystem in which HMO, HCP and SCHEMA applications remain independent but interoperable. The master IX2-App Laravel API owns the authoritative business state. Local SQLite databases make each installation practical and resilient without turning the client into an uncontrolled second master database.**

**The HMO must be able to start operating immediately with its own enrollee records and its own tariff imports. SCHEMA relationships remain important for tariff context and authorization, but SCHEMA-originated enrollee upload must not be a prerequisite for an HMO to begin using MedMax.**

**The next technical work should therefore begin on localhost, starting with the existing database audit, installation/tenant/licensing foundations, HMO onboarding, local SQLite schema, HMO enrollee import and SCHEMA-specific tariff import.**
