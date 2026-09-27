# MedMax HMO-App — Claude Code Implementation Specification
## Onboarding, Local SQLite, First-Visit Validation, Provider Relationships and HMO Interface

**Product:** MedMax  
**Client Application:** HMO-App  
**Backend Project:** `IX2-App`  
**Backend:** Laravel 11 / PHP / MySQL/MariaDB  
**Development API:** localhost  
**Production API:** `https://api.cybernetsystems.ng`  
**Implementation Target:** HMO-App first, then subsequent operational modules

---

# 1. Purpose

This document is the implementation specification for Claude Code.

The objective is to take the existing HMO-App and implement the new MedMax HMO architecture against the already corrected `IX2-App` backend.

The implementation must begin with:

1. HMO installation identity
2. Local SQLite foundation
3. First-run detection
4. New HMO onboarding
5. Existing HMO recovery
6. Server-side installation/HMO/user/license validation
7. Initial bootstrap
8. HMO UI shell and design system
9. Provider relationship architecture
10. Enrollee and tariff foundations
11. RBAC-driven navigation

Do not start by rebuilding every HMO feature.

Build the identity and local-data foundation first.

---

# 2. Authoritative Architecture

The system is:

```text
                 ┌───────────────────────┐
                 │       HMO-App         │
                 │ React / Local SQLite  │
                 └───────────┬───────────┘
                             │ HTTPS API
                             ▼
                 ┌───────────────────────┐
                 │       IX2-App         │
                 │ Laravel 11 API        │
                 │ Auth / RBAC / Tenant  │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │    MySQL/MariaDB      │
                 │ Authoritative Store   │
                 └───────────────────────┘
```

The HMO-App must never connect directly to MySQL/MariaDB.

SQLite is a local application database, not a replacement master database.

---

# 3. Important Backend Architecture Correction

The provider architecture has changed.

The `providers` table is now independent.

The backend removed:

```text
providers.hmo_id
providers.schema_id
```

Provider relationships are represented through pivot tables.

The current architecture is:

```text
                    ┌──────────────┐
                    │   Provider   │
                    │ independent  │
                    └──────┬───────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      hmo_providers              schema_providers
             ▲                           ▲
             │                           │
          HMO                         SCHEMA
```

Therefore the HMO-App must NOT model a provider as belonging exclusively to one HMO.

A provider may have relationships with multiple HMOs and/or SCHEMAs.

---

# 4. Backend Changes Confirmed

The corrected backend has:

### Provider independence

- Removed `hmo_id` from `providers`
- Removed `schema_id` from `providers`
- Added/uses `hmo_providers`
- Provider model defines HMO/schema many-to-many relationships
- Provider API scopes providers through the HMO relationship

### Provider security

Provider endpoints use relationship-based HMO scoping.

Conceptually:

```php
Provider::whereHas('hmos', function ($query) {
    $query->where('hmos.id', $currentHmoId);
});
```

Do not recreate direct `provider.hmo_id` assumptions in the frontend.

### Claims security

Vetted claims are scoped relationally through their code request/HMO context.

### P-Code

Correct numeric status values:

```text
0 = pending/default
1 = granted
3 = vetted
9 = declined
```

The frontend must reflect the API values.

### RBAC

The backend access model is split:

```text
operations_access
call_center_access
accounts_access
```

Current intended module access:

```text
Operations → Enrollees + Providers
Call Center → Code Requests + Referrals
Accounts → Finance + Claims
```

HMO Admin has broader administrative access.

---

# 5. Backend Database — Important HMO Tables

The master database contains many operational tables. The HMO client must NOT replicate all of them into SQLite.

Relevant backend tables include:

```text
hmos
users
roles
permissions
role_user
permission_role

schemas
schema_plans

providers
hmo_providers
schema_providers

enrollees
enrollee_dependants
hmo_enrollee_uploads

plans
packages

services
treatments
drugs
treatment_prices
drug_prices

schema_services
schema_treatments
schema_plan_services
schema_plan_treatments
schema_plan_drugs

code_requests
code_services
code_treatments
code_drugs
code_vetteds

provider_invoices
invoice_line_items
provider_settlements
provider_wallets

device_sessions
audit_logs
```

Use the actual IX2-App migrations/controllers/models/routes as the implementation authority.

Do not invent database relationships where the backend already defines them differently.

---

# 6. HMO Organization Identity

The backend `hmos` record contains important fields including:

```text
id
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
token_expires_at
created_at
updated_at
```

Important:

The existence of `schema_id` on the current `hmos` table must not be interpreted as proof that an HMO owns a provider or that providers need `schema_id`.

Provider relationships are now pivot-based.

Client code must follow the corrected backend relationship model.

---

# 7. User Identity

The backend `users` table supports organization relationships including:

```text
id
name
email
phone_number
is_approved
is_org_admin
provider_id
hmo_id
schema_id
package_schema_id
created_at
updated_at
```

For an HMO user, the authoritative organization association comes from the authenticated server-side user context.

The frontend must not rely on a user selecting an arbitrary `hmo_id`.

Never store plaintext passwords in SQLite.

---

# 8. HMO Onboarding Goal

The first-run experience must support two paths:

```text
NEW HMO
EXISTING HMO
```

### New HMO

```text
Install MedMax
      ↓
Welcome
      ↓
Connection Test
      ↓
Register New HMO
      ↓
Organization Details
      ↓
Administrator
      ↓
Initial Configuration
      ↓
Review
      ↓
Submit
      ↓
Server Registration
      ↓
Installation Registration
      ↓
Bootstrap
      ↓
HMO Dashboard
```

### Existing HMO

```text
Install MedMax
      ↓
Welcome
      ↓
Connect Existing HMO
      ↓
Authenticate/Identify
      ↓
Server Recovery Check
      ↓
Register/Recover Installation
      ↓
Bootstrap
      ↓
HMO Dashboard
```

---

# 9. Critical First-Visit Rule

Never do this:

```text
if SQLite database is empty:
    create HMO
```

This is unsafe.

SQLite may be:

- deleted
- corrupted
- reinstalled
- migrated
- restored from backup
- unavailable after an application upgrade

Instead:

```text
APP START
   ↓
Check SQLite
   ↓
Installation exists?
   ├── YES → validate server
   └── NO → recovery/server check
                  ├── Existing HMO → recover
                  └── No existing installation → onboarding
```

The server is authoritative.

---

# 10. Local SQLite Design

The first implementation should create these logical tables.

## 10.1 installation

```text
id
installation_uuid
installation_code
server_installation_id
hmo_id
hmo_public_id
hmo_name
hmo_logo
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

The `installation_uuid` must be generated once and persisted.

It must survive normal application updates.

---

## 10.2 installation_features

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
enrollees
providers
tariffs
call_center
claims
finance
reports
offline_mode
```

The frontend may use feature flags to control presentation, but the API must enforce authorization.

---

## 10.3 app_settings

```text
id
key
value
value_type
is_sensitive
updated_at
```

Do not store passwords here.

Do not store private API secrets here.

---

## 10.4 local_users

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
is_active
last_login_at
last_sync_at
created_at
updated_at
```

No password field.

---

## 10.5 local_roles

```text
id
server_role_id
title
created_at
updated_at
```

## 10.6 local_permissions

```text
id
server_permission_id
title
created_at
updated_at
```

## 10.7 local_role_permissions

```text
role_id
permission_id
```

## 10.8 local_user_roles

```text
user_id
role_id
```

These local records are for UI/navigation and local session context.

The backend remains authoritative.

---

# 11. Device Identity

Create:

## local_devices

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

Integrate with the backend `device_sessions` mechanism.

The application should recognize a device without assuming that the device itself is authorized forever.

---

# 12. Local HMO Profile

Create:

## hmo_profile

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

This is a cache of the authoritative HMO.

---

# 13. SCHEMA Cache

The HMO must know which SCHEMAs it is authorized/connected to.

Create:

## schemas

```text
id
server_schema_id
title
package_code
is_active
server_updated_at
created_at
updated_at
```

Create a relationship cache:

## hmo_schema_relationships

Only implement this if the corrected backend exposes an HMO-SCHEMA relationship requiring it. Inspect the actual backend before creating it.

Do NOT assume a `schema_hmos` table exists.

The purpose is to avoid hard-coding an unverified relationship.

---

# 14. Provider Local Architecture — IMPORTANT

Because providers are now independent, do NOT create:

```text
hmo_providers
```

as a table that duplicates the server's provider entity.

Instead distinguish:

### providers

```text
id
server_provider_id
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
registration_status
server_updated_at
created_at
updated_at
```

### hmo_provider_relationships

```text
id
server_relationship_id
provider_id
relationship_status
effective_date
expiry_date
created_at
updated_at
```

### schema_provider_relationships

```text
id
server_relationship_id
provider_id
schema_id
relationship_status
effective_date
expiry_date
created_at
updated_at
```

The exact pivot columns must be confirmed from the actual IX2-App migrations.

Do not fabricate columns that are not present in the backend.

---

# 15. HMO Provider Network UX

The navigation should call the module:

```text
Provider Network
```

not imply provider ownership.

Dashboard:

```text
Provider Network
────────────────────────────
Active Providers       128
Pending Relationships    6
Invitations              3
Suspended                2

[ + Invite Provider ]
[ + Connect Existing Provider ]
```

Provider list should display relationship status:

```text
Provider
Facility Type
Location
Relationship
SCHEMAs
Status
Actions
```

---

# 16. Provider Invitation

Reserve the following architecture:

```text
HMO
 ↓
Invite HCP
 ↓
Server creates invitation
 ↓
Secure onboarding link
 ↓
SMS to HCP administrator
 ↓
HCP opens link
 ↓
HCP completes onboarding
 ↓
Provider accepts relationship
 ↓
hmo_providers relationship becomes active
```

Do not invent the final SMS provider, message template, expiry or verification rules until the additional onboarding documentation is supplied.

The frontend should nevertheless have an extensible invitation UI.

---

# 17. Existing Provider Connection

The HMO should eventually be able to:

```text
Search existing provider
        ↓
View provider profile
        ↓
Request connection
        ↓
Pending
        ↓
Provider accepts
        ↓
Active relationship
```

The local database should therefore distinguish:

```text
provider entity
```

from:

```text
HMO-provider relationship
```

---

# 18. Enrollee Local Structure

The backend `enrollees` table supports fields including:

```text
id
public_id
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
enrollment_id
type
enrollee_status
enrollee_photo_path
provider_id
hmo_id
schema_id
is_active
plan_id
is_private
user_id
```

Local cache:

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

`schema_id` is nullable.

---

# 19. HMO Direct Enrollee Upload

The HMO can upload its assigned enrollees directly.

It does not have to wait for SCHEMA upload.

Therefore:

```text
HMO → Enrollee Import → schema_id may be NULL
```

The import process:

```text
Upload
 ↓
Map columns
 ↓
Validate
 ↓
Duplicate detection
 ↓
Preview
 ↓
Confirm
 ↓
Server import
 ↓
Sync local cache
```

---

# 20. Enrollee Import Tables

## enrollee_import_batches

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

## enrollee_import_rows

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

---

# 21. Enrollee Import UI

Use a wizard:

```text
1 Upload
2 Map
3 Validate
4 Review
5 Import
```

Show:

```text
Total Rows
Valid
Invalid
Duplicates
Warnings
New
Updated
Skipped
Failed
```

Every failed row needs a human-readable reason.

---

# 22. Tariff Architecture

The HMO can upload:

```text
Services
Treatments
Drugs
Treatment Prices
Drug Prices
```

But tariffs must be associated with a selected SCHEMA.

Therefore:

```text
Tariff Import
      ↓
Select SCHEMA *
      ↓
Upload
      ↓
Validate
      ↓
Preview
      ↓
Import
```

No SCHEMA selected:

```text
IMPORT BUTTON DISABLED
```

---

# 23. Local Tariff Tables

## services

```text
id
server_id
title
service_code
service_status
major_id
server_updated_at
created_at
updated_at
```

## treatments

```text
id
server_id
service_id
treatment_code
treatment_title
treatment_status
server_updated_at
created_at
updated_at
```

## drugs

```text
id
server_id
name
generic_name
drug_code
dosage_form
unit
drug_status
server_updated_at
created_at
updated_at
```

## treatment_prices

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
server_updated_at
created_at
updated_at
```

## drug_prices

```text
id
server_id
hmo_id
schema_id
drug_id
price
effective_date
price_status
server_updated_at
created_at
updated_at
```

The exact server columns/API payloads must be verified against IX2-App.

---

# 24. Sync Architecture

## sync_state

```text
id
entity
last_server_cursor
last_server_updated_at
last_sync_started_at
last_sync_completed_at
status
error_message
created_at
updated_at
```

## sync_queue

```text
id
entity
local_record_id
server_record_id
operation
payload
status
attempts
last_error
available_at
created_at
updated_at
```

Use queues only for explicitly permitted operations.

---

# 25. Server-Authoritative Operations

Never perform these as unrestricted offline operations:

```text
P-Code generation
final authorization
final claims approval
financial approval
settlement approval
wallet updates
license activation
installation authorization
tenant switching
```

P-Code remains server-authoritative.

The corrected backend maps:

```text
1 → Granted
3 → Vetted
9 → Declined
```

The frontend must preserve these values exactly.

---

# 26. HMO Startup Algorithm

Implement:

```text
startApplication()

    initializeLocalDatabase()

    installation = getInstallation()

    if installation exists:

        validate installation with server

        if valid:
            refresh required bootstrap data
            open HMO workspace

        if suspended:
            show suspension state

        if license blocked:
            show license state

        if installation invalid/revoked:
            start recovery

    else:

        perform server recovery check

        if existing recoverable HMO:
            start existing HMO recovery

        else:
            show:
                Register New HMO
                Connect Existing HMO
```

The exact endpoint names must come from IX2-App.

---

# 27. First-Visit Validation Data

The client should send/identify:

```text
installation_uuid
app_version
device_uuid
authenticated session/token
```

The server should resolve:

```text
HMO
user
installation
device/session
license
permissions
features
```

Do not make the user type an HMO ID when the authenticated server context can resolve it.

---

# 28. Bootstrap Order

After successful onboarding/authentication:

```text
1 Installation
2 HMO Profile
3 Current User
4 Roles
5 Permissions
6 Features
7 Authorized SCHEMAs
8 Provider Relationships
9 Providers
10 Plans
11 Packages
12 Required reference data
13 Notifications
14 Sync State
```

Use pagination.

Do not download the entire backend database.

---

# 29. HMO UI/UX Foundation

The new HMO-App should have a professional health-insurance enterprise interface.

Primary navigation:

```text
Dashboard

Enrollees
Provider Network
Plans
Tariffs

Call Center
Authorizations
Referrals

Claims
Invoices
Settlements
Wallet

Reports

Settings
Users & Roles
Installation
License
```

Menus must be permission-driven.

---

# 30. Role-Based Navigation

### HMO Admin

Administrative access to all permitted HMO functions.

### Operations Officer

```text
Enrollees
Provider Network
```

### Call Center Officer

```text
Code Requests
Referrals
Authorization workflows
```

### Accounts Officer

```text
Claims
Invoices
Settlements
Financial Reports
Wallet
```

The exact permissions must come from the server.

---

# 31. Onboarding UI Components

Implement reusable components:

```text
OnboardingShell
OnboardingStepper
WelcomeScreen
ConnectionCheck
NewOrExistingChoice
OrganizationForm
AdministratorForm
InitialConfigurationForm
ReviewSummary
RegistrationProgress
VerificationStatus
InstallationStatus
LicenseStatus
RecoveryWizard
ErrorState
SuccessState
RetryButton
```

---

# 32. Welcome Screen

Concept:

```text
MEDMAX

Health insurance operations,
provider network and claims management.

[ Register a New HMO ]

[ Connect an Existing HMO ]

Need Help?
```

Do not overload the first screen.

The primary action must be obvious.

---

# 33. Organization Form

Collect only what is required by the API.

Typical fields:

```text
HMO Name *
Email *
Phone *
State *
City *
Address *
```

Use:

- inline validation
- clear required indicators
- proper input types
- mobile-friendly controls
- searchable state/city selectors where appropriate
- no unnecessary fields

---

# 34. Administrator Form

Typical:

```text
Full Name *
Email *
Phone *
Password *
Confirm Password *
```

Passwords are transmitted securely to the API during registration but are never persisted in SQLite.

Do not display passwords after submission.

---

# 35. Review Screen

Show:

```text
Organization
Administrator
Initial Configuration
```

Provide:

```text
Edit
Back
Submit Registration
```

The user must understand that submitting creates the organization.

---

# 36. Registration Progress

Do not freeze the screen.

Show progress:

```text
Creating HMO       ✓
Creating Admin     ✓
Registering App    ✓
Initializing       ...
Downloading Data   ...
```

If the network fails:

```text
Registration paused.

Your information has not been duplicated.

[ Retry ]
```

The server must protect against duplicate submissions.

---

# 37. Existing HMO Recovery UI

Show:

```text
Connect Existing HMO

Your organization already uses MedMax?

[ Continue ]
```

Authenticate/identify using the corrected backend mechanism.

Never allow a user to simply type:

```text
HMO ID = 5
```

and claim it.

---

# 38. Installation Status UI

Settings → Installation:

```text
Installation
────────────────────

Installation ID
XXXXXXXX

Status
Active

Device
Windows Desktop

App Version
1.x.x

Last Verified
18 Sep 2026

Last Sync
18 Sep 2026
```

---

# 39. License UI

Display:

```text
License Type
Lifetime

Status
Active

Expiry
Never

Support Until
[date]
```

or for other license types:

```text
Trial
Subscription
Annual
Multi-Year
```

Lifetime licensing does not disable server authorization.

---

# 40. Provider Network UI Details

Provider details:

```text
Provider Name
Provider Code
HCP Number
Facility Type
Location
Contact
Relationship Status
Connected SCHEMAs
```

Actions:

```text
View
Invite
Request Connection
Suspend Relationship
View Activity
```

Only expose actions permitted by the current role and API.

---

# 41. Enrollee Search UX

Support search by appropriate backend-supported identifiers such as:

```text
Public ID
Enrollment ID
NIN
Phone
Name
```

Show:

```text
Name
Public ID
Plan
Provider
Status
SCHEMA
```

If `schema_id` is null, display:

```text
SCHEMA: Not Assigned
```

Do not treat this as an invalid enrollee automatically.

---

# 42. Data Status Indicators

Use both icon/text and accessible labels.

Examples:

```text
Active
Pending
Suspended
Expired
Synced
Pending Sync
Sync Failed
```

Do not communicate important state using color alone.

---

# 43. Error Handling

Never show:

```text
SQLSTATE...
Laravel stack trace...
Internal server exception...
```

Instead:

```text
We couldn't complete this request.

Reason:
Your connection to the MedMax server was interrupted.

[ Retry ]
```

Provide technical details only in developer logs.

---

# 44. Tenant Security Rules

The frontend must never allow users to manipulate tenant context through arbitrary form fields.

Avoid trusting:

```text
hmo_id
provider_id
schema_id
```

when those values are supposed to be resolved/authorized by the backend.

For provider operations, the backend must validate membership through:

```text
hmo_providers
```

For claims, the backend must resolve the HMO relationship through the appropriate code request/claim relationship.

---

# 45. Testing Matrix

## Fresh Installation

```text
SQLite absent
API available
No existing installation
→ New HMO flow
```

## Existing Installation

```text
SQLite valid
Server valid
→ Dashboard
```

## Lost SQLite

```text
SQLite deleted
Server organization exists
→ Recovery
```

## Invalid Installation

```text
Local installation exists
Server says revoked
→ Recovery/support
```

## Suspended HMO

```text
Server says suspended
→ Suspension screen
```

## License blocked

```text
Server says license unavailable
→ License screen
```

## Provider Isolation

```text
HMO A cannot access HMO B provider relationship
```

## Enrollee Isolation

```text
HMO A cannot access HMO B enrollee
```

## Claims Isolation

```text
HMO A cannot access HMO B claims
```

## Role Isolation

```text
Call Center Officer
cannot access Accounts functions

Accounts Officer
cannot access Operations functions
```

---

# 46. Claude Code Execution Plan

## Phase 0 — Repository Audit

Before modifying code:

```text
Inspect HMO-App structure
Inspect routing
Inspect API client
Inspect authentication
Inspect current local storage
Inspect current SQLite implementation
Inspect UI components
Inspect environment configuration
Inspect IX2-App API routes
Inspect relevant controllers
Inspect models
Inspect migrations
Inspect policies/middleware
```

Create a short implementation audit before coding.

---

# 47. Phase 1 — Local SQLite

Implement and test:

```text
installation
installation_features
app_settings
local_users
local_roles
local_permissions
local_role_permissions
local_user_roles
local_devices
hmo_profile
schemas
```

Do not implement every operational table yet.

---

# 48. Phase 2 — Startup State Machine

Implement:

```text
Fresh install
Existing installation
Server validation
Recovery
Suspension
License block
```

Test each state before proceeding.

---

# 49. Phase 3 — API Service Layer

Implement:

```text
ApiClient
AuthService
OnboardingService
InstallationService
BootstrapService
SyncService
```

Use the existing project architecture.

Do not duplicate HTTP logic across components.

---

# 50. Phase 4 — Onboarding UI

Implement:

```text
Welcome
Connection Check
New/Existing HMO
Organization
Administrator
Configuration
Review
Registration
Verification
Success
Recovery
```

Use the existing design system where possible.

Do not unnecessarily replace working components.

---

# 51. Phase 5 — Bootstrap

Implement server synchronization for:

```text
HMO
User
Roles
Permissions
Features
SCHEMAs
Provider relationships
Providers
Plans
Packages
```

---

# 52. Phase 6 — HMO Operational Data

Implement:

```text
Enrollees
Dependants
Services
Treatments
Drugs
Treatment Prices
Drug Prices
```

Then build:

```text
Enrollee import
Tariff import
```

---

# 53. Phase 7 — HMO Interface Modules

Build in this order:

```text
Dashboard
Enrollees
Provider Network
Plans
Tariffs
Call Center
Claims
Finance
Reports
Settings
```

---

# 54. Phase 8 — HCP Relationship Workflow

After the core HMO foundation is stable:

```text
Invite HCP
Existing Provider Connection
Pending Relationships
Relationship Approval
Relationship Status
```

Integrate the final SMS/onboarding specification after the additional onboarding documents are provided.

---

# 55. Coding Rules

Claude Code must:

1. Preserve existing working HMO-App functionality.
2. Inspect before modifying.
3. Follow actual IX2-App routes and responses.
4. Never connect directly to MySQL.
5. Never store passwords in SQLite.
6. Never recreate `providers.hmo_id`.
7. Never recreate `providers.schema_id`.
8. Use provider relationship pivots.
9. Never assume an HMO owns a provider.
10. Keep enrollee `schema_id` nullable.
11. Require SCHEMA selection for schema-specific tariff uploads.
12. Keep P-Code generation server-authoritative.
13. Respect backend RBAC.
14. Never trust client-supplied tenant IDs.
15. Never interpret empty SQLite as proof that the HMO is new.
16. Keep localhost as development API.
17. Make production API configurable.
18. Do not hard-code production API URLs throughout components.
19. Add tests after each major phase.
20. Do not move to the next phase if the current phase is failing.

---

# 56. Environment Configuration

Development:

```text
API_BASE_URL=http://localhost/...
```

Production:

```text
API_BASE_URL=https://api.cybernetsystems.ng
```

Use the actual local IX2-App URL/port discovered during repository audit.

The application must use environment configuration rather than hard-coded URLs.

---

# 57. Database Rules

Use:

```text
server_id
```

for the authoritative server primary key.

Use:

```text
local id
```

for the SQLite primary key.

Never confuse them.

For synchronized records, retain:

```text
server_updated_at
sync_status
```

where useful.

Use stable public identifiers where provided by the backend.

---

# 58. Duplicate Prevention

New HMO registration must be idempotent.

If a registration request is retried after a timeout:

```text
DO NOT create HMO A
DO NOT create HMO B
```

The server must identify the previous registration attempt/installation where applicable.

The client must safely recover after a network interruption.

---

# 59. Migration Safety

Before changing SQLite:

```text
backup/test migration
run migration
verify tables
verify indexes
verify constraints
```

Do not destroy local operational data during an application update.

For a schema migration:

```text
old SQLite
    ↓
migration
    ↓
new SQLite
```

not:

```text
delete SQLite
create empty SQLite
```

unless an explicit recovery workflow is intentionally invoked.

---

# 60. Performance

Do not load thousands of records into memory unnecessarily.

Use:

```text
pagination
incremental synchronization
search endpoints
lazy loading
virtualized tables where appropriate
```

For enrollee imports, process records in controlled batches.

---

# 61. Final Definition of Done

The first implementation milestone is complete when:

- [ ] HMO-App launches reliably.
- [ ] Local SQLite initializes.
- [ ] Installation UUID is created once.
- [ ] Existing installation is recognized.
- [ ] Server installation validation works.
- [ ] Fresh install supports New HMO.
- [ ] Fresh install supports Existing HMO.
- [ ] Duplicate registration is prevented.
- [ ] Existing HMO recovery works.
- [ ] HMO profile is bootstrapped.
- [ ] User is bootstrapped.
- [ ] Roles are bootstrapped.
- [ ] Permissions are bootstrapped.
- [ ] Feature entitlements are bootstrapped.
- [ ] Authorized SCHEMAs are available.
- [ ] Provider relationships are represented through pivots.
- [ ] No `provider.hmo_id` assumption exists in HMO-App.
- [ ] No `provider.schema_id` assumption exists in HMO-App.
- [ ] Enrollee `schema_id` remains optional.
- [ ] Tariff import requires SCHEMA selection.
- [ ] P-Code remains server-authoritative.
- [ ] RBAC controls navigation and API access.
- [ ] Localhost API integration works.
- [ ] Production URL is configurable.
- [ ] Recovery works after SQLite loss.
- [ ] Cross-HMO isolation tests pass.
- [ ] No passwords are stored in SQLite.

---

# 62. Expected Claude Code Deliverables

At the end of each implementation phase, report:

```text
PHASE:
Status:

FILES CREATED:
- ...

FILES MODIFIED:
- ...

DATABASE CHANGES:
- ...

API ENDPOINTS USED:
- ...

UI CHANGES:
- ...

TESTS RUN:
- ...

TEST RESULTS:
- ...

KNOWN ISSUES:
- ...

NEXT PHASE:
- ...
```

Do not claim completion without testing.

---

# 63. Final Architecture

The completed HMO foundation should look like:

```text
MedMax/
│
├── HMO-App/
│   │
│   ├── UI
│   │   ├── Onboarding
│   │   ├── Dashboard
│   │   ├── Enrollees
│   │   ├── Provider Network
│   │   ├── Plans
│   │   ├── Tariffs
│   │   ├── Call Center
│   │   ├── Claims
│   │   ├── Finance
│   │   └── Settings
│   │
│   ├── API Services
│   │   ├── AuthService
│   │   ├── OnboardingService
│   │   ├── InstallationService
│   │   ├── BootstrapService
│   │   └── SyncService
│   │
│   └── SQLite
│       ├── Installation
│       ├── Users/Roles
│       ├── HMO Profile
│       ├── Provider Relationships
│       ├── Enrollees
│       ├── Tariffs
│       └── Sync
│
├── HCP-App/
│
├── SCHEMA-App/
│
└── IX2-App/
    └── Laravel API
```

The governing rule is:

> **MedMax HMO-App is a secure client of the IX2-App API. The IX2-App backend and MySQL/MariaDB remain authoritative. HMO, HCP and SCHEMA are independent organizations; relationships are represented through pivot tables. Local SQLite provides installation identity, local configuration, controlled cache and synchronization—not a second authoritative backend.**
