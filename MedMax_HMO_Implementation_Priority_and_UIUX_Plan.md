# MedMax HMO-App — Programmatic Implementation & UI/UX Execution Plan

**Document Status:** Implementation master plan for Antigravity  
**Product:** MedMax  
**Application:** HMO-App  
**Backend Project:** `IX2-App`  
**Architecture:** API-first, multi-tenant, Laravel 11 + MySQL/MariaDB + React clients  
**Development Mode:** Localhost API first  
**Production API:** `api.cybernetsystems.ng` — switch only after local implementation/testing is stable

---

## 1. Purpose

This document converts the MedMax master technical blueprint into an implementation sequence that can be executed programmatically.

The immediate scope is:

1. Audit the existing HMO-App source folder.
2. Redesign and implement the HMO interface.
3. Modify `IX2-App` Laravel backend/API to support the new HMO-App.
4. Preserve existing working functionality while progressively refactoring it into the MedMax architecture.
5. Establish the API contracts, tenant boundaries, authentication, licensing, onboarding, enrollee management, tariff management, Call Center, Operations and Accounts foundations required by the HMO application.
6. Prepare the architecture for later HCP-App and SCHEMA-App integration without implementing those applications yet.

**Important:** Antigravity must inspect the actual current HMO-App and `IX2-App` code before changing implementation details. Do not assume that proposed tables, controllers, routes or relationships already exist.

---

# 2. Source of Truth and Implementation Rules

## 2.1 Product structure

```text
MedMax/
├── HMO-App/
├── HCP-App/
├── SCHEMA-App/
└── IX2-App/                  # Existing Laravel/PHP/MySQL backend
```

The three applications communicate through APIs.

```text
HMO-App ───────┐
HCP-App ───────┼────> IX2-App API ───> MySQL/MariaDB
SCHEMA-App ────┘
```

No client application should connect directly to MySQL.

## 2.2 Database authority

The central MySQL/MariaDB database remains the authoritative system of record.

SQLite, if used by the HMO client, is limited to:

- installation identity
- local configuration
- controlled cache
- local session/device state
- controlled offline queue
- synchronization state

SQLite must not become a second master database.

## 2.3 Existing database must be audited

The current database contains important entities including:

- `hmos`
- `users`
- `roles`
- `permissions`
- `enrollees`
- `enrollee_dependants`
- `providers`
- `plans`
- `packages`
- `schemas`
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
- `provider_invoices`
- `invoice_line_items`
- `provider_settlements`
- `provider_wallets`
- `device_sessions`
- `hmo_enrollee_uploads`

Antigravity must inspect migrations, models, controllers, policies, routes, services, requests and database relationships before creating replacements.

**Do not create assumed tables such as `schema_hmos` unless the code/database audit proves that they are required.**

---

# 3. Implementation Priority

The implementation must follow dependency order rather than UI order.

| Priority | Workstream | Objective |
|---|---|---|
| P0 | Codebase Audit | Understand existing HMO-App and IX2-App |
| P1 | Tenant Security | Guarantee HMO data isolation |
| P2 | API Foundation | Establish clean HMO API structure |
| P3 | Authentication & Devices | Secure HMO users and installations |
| P4 | HMO Onboarding | Register/verify HMO and initialize installation |
| P5 | HMO Dashboard Shell | Implement new HMO UI architecture |
| P6 | Enrollee Management | Direct HMO enrollee registration/import |
| P7 | Schema/Tariff Management | HMO uploads tariffs against selected SCHEMA |
| P8 | Provider Network | HMO/HCP relationship and invitations |
| P9 | Call Center | Eligibility and P-Code workflow |
| P10 | Operations | Plans, providers, tariffs, enrollee operations and vetting |
| P11 | Accounts | Invoices, reconciliation, settlements and wallets |
| P12 | Reporting & Audit | Operational reporting and audit trails |
| P13 | Offline/Sync | Controlled SQLite and synchronization |
| P14 | Licensing | Trial/subscription/annual/lifetime application licensing |
| P15 | Production Readiness | Security, performance, testing and deployment |

---

# 4. P0 — Mandatory Codebase Audit

Before writing production code, Antigravity must inspect:

### HMO-App

Identify:

- framework/version
- routing
- pages/screens
- layouts
- components
- navigation
- authentication
- API client
- state management
- forms
- tables
- modals
- charts
- notifications
- current dashboard
- responsive behavior
- dark/light mode
- local storage
- SQLite usage, if any
- current API endpoints
- hard-coded backend URLs

### IX2-App

Inspect:

- `routes/api.php`
- `routes/web.php`
- controllers
- models
- migrations
- policies
- middleware
- Form Requests
- services
- repositories, if present
- resources/API transformers
- authentication
- roles
- permissions
- database relationships
- queues/jobs
- notifications
- audit logs
- storage/media
- existing tests
- environment configuration

### Audit output

Create:

```text
docs/
├── CURRENT_HMO_APP_AUDIT.md
├── CURRENT_IX2_API_AUDIT.md
├── DATABASE_RELATIONSHIP_AUDIT.md
├── API_GAP_ANALYSIS.md
└── MEDMAX_HMO_IMPLEMENTATION_PLAN.md
```

Do not modify core business logic during the audit.

---

# 5. P1 — Multi-Tenant Security Foundation

Every HMO request must resolve a trusted HMO context from the authenticated server-side identity.

Never trust:

```text
hmo_id
```

from arbitrary client input when it can be derived from the authenticated user/session/token.

Required controls:

- HMO-scoped authentication
- authorization middleware
- policies
- organization-scoped roles
- organization-scoped permissions
- query scoping
- request validation
- audit logging
- tenant-safe file paths
- tenant-safe reporting
- tenant-safe exports

A user associated with HMO A must never retrieve HMO B data by changing an ID in the request.

## Required security pattern

```text
Authenticated User
       ↓
Resolved HMO Context
       ↓
Authorization / Permission Check
       ↓
Tenant-Scoped Service
       ↓
Tenant-Scoped Query
       ↓
Response
```

Do not rely on frontend hiding or disabling buttons as a security control.

---

# 6. P2 — HMO API Architecture

Organize the API around HMO business domains.

Suggested structure:

```text
/api/v1/hmo/
├── auth/
├── installation/
├── dashboard/
├── users/
├── roles/
├── permissions/
├── enrollees/
├── dependants/
├── plans/
├── packages/
├── schemas/
├── tariffs/
├── services/
├── treatments/
├── drugs/
├── providers/
├── provider-invitations/
├── eligibility/
├── code-requests/
├── referrals/
├── claims/
├── invoices/
├── settlements/
├── wallets/
├── reports/
├── notifications/
└── audit/
```

Do not expose internal database structure directly through the API.

Use API Resources/DTO-style responses where appropriate.

---

# 7. P3 — Authentication, Installation and Device Management

## 7.1 HMO authentication

Support:

- login
- logout
- token/session management
- password reset
- email/phone verification where existing architecture supports it
- OTP/2FA where enabled
- device recognition
- session revocation

## 7.2 Installation identity

Each installed HMO application receives a permanent installation UUID.

Example:

```text
installation_uuid:
550e8400-e29b-41d4-a716-446655440000
```

The installation UUID must not be used as a secret.

The server associates:

```text
HMO
  └── Installation
       ├── Devices
       ├── App Version
       ├── License
       └── Feature Entitlements
```

## 7.3 SQLite

If the current HMO-App supports local SQLite, use it only for:

- installation
- settings
- cached reference data
- controlled local operational state
- sync queue
- sync state

Never store passwords in SQLite.

---

# 8. P4 — HMO Registration and First-Run Experience

The first-run interface should be a guided wizard.

## UI flow

```text
Welcome
   ↓
HMO Organization Information
   ↓
Business Information
   ↓
Financial Information
   ↓
Administrator Account
   ↓
Initial Configuration
   ↓
Review
   ↓
Register
   ↓
Server Verification
   ↓
Installation Initialization
   ↓
Dashboard
```

The registration process must be transactional on the server.

The client should not assume registration succeeded until the API confirms it.

## Recovery

An empty or recreated SQLite database must not automatically mean:

> "Create a new HMO."

Instead:

```text
No local installation
       ↓
Check server/recovery state
       ↓
Existing installation?
   ├── YES → recover/reconnect
   └── NO  → first-run registration
```

---

# 9. P5 — New HMO-App UI/UX Architecture

The new HMO interface should feel like a modern professional health-insurance operations platform.

## 9.1 Primary design goals

- clear operational hierarchy
- low cognitive load
- fast Call Center workflows
- data-dense but readable tables
- strong status visibility
- minimal unnecessary navigation
- responsive layout
- keyboard-friendly workflows
- accessible forms
- consistent confirmation/query/error states
- light and dark mode
- professional healthcare/fintech visual language

## 9.2 Recommended application shell

```text
┌────────────────────────────────────────────────────────────┐
│ Top Bar: Search | Notifications | Help | User             │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│ Sidebar       │ Main Workspace                             │
│               │                                            │
│ Dashboard     │ Page Header                                │
│ Enrollees     │ Filters / Actions                          │
│ Providers     │                                            │
│ Plans         │ Content                                    │
│ Tariffs       │                                            │
│ Call Center   │                                            │
│ Operations    │                                            │
│ Accounts      │                                            │
│ Reports       │                                            │
│ Settings      │                                            │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
```

## 9.3 Navigation groups

### Overview

- Dashboard

### Beneficiaries

- Enrollees
- Dependants
- Imports
- Eligibility

### Network

- HCPs / Providers
- Provider Invitations
- Provider Panels
- Provider Tariffs

### Products

- Plans
- Packages
- Subscription Types
- Riders

### Tariffs

- Schemas
- Services
- Treatments
- Drugs
- Treatment Prices
- Drug Prices
- Import Tariffs

### Call Center

- Eligibility Verification
- P-Code Requests
- Active Authorizations
- Referrals
- Call Logs / Tickets

### Operations

- Claims
- Vetting
- Exceptions / Queries

### Accounts

- Provider Invoices
- Reconciliation
- Settlements
- Provider Wallets

### Reports

- Enrollee Reports
- Utilization
- Claims
- Provider Reports
- Financial Reports
- Audit Reports

### Administration

- Users
- Roles
- Permissions
- Installation
- License
- Settings
- Audit Logs

---

# 10. UI/UX Components to Standardize

Create a reusable design system rather than building each screen independently.

## Core components

- AppShell
- Sidebar
- Topbar
- Breadcrumbs
- PageHeader
- StatCard
- StatusBadge
- DataTable
- SearchInput
- FilterBar
- DateRangePicker
- Select
- MultiSelect
- FormField
- FileUploader
- ImportWizard
- ImportPreview
- ImportProgress
- ConfirmationDialog
- WarningDialog
- Drawer
- Modal
- DetailPanel
- Timeline
- ActivityFeed
- EmptyState
- LoadingState
- ErrorState
- Skeleton
- Toast
- NotificationCenter
- Pagination
- Tabs
- Stepper
- Command/Search Palette
- AuditTimeline
- ApprovalPanel
- FinancialSummary
- ChartCard

---

# 11. Dashboard UI

The dashboard should be operational rather than decorative.

Suggested cards:

```text
Active Enrollees
Active Providers
Pending P-Code Requests
Claims Awaiting Vetting
Invoices Awaiting Reconciliation
Pending Settlements
Provider Wallet Exposure
Active Plans
```

Additional sections:

- enrollee trend
- claims trend
- authorization volume
- provider activity
- pending operational tasks
- recent activity
- alerts
- outstanding financial actions

Do not invent business metrics that cannot be derived from the existing database/API.

---

# 12. Enrollee Management — High Priority

## Business rule

The HMO can upload/register its assigned enrollees directly.

The HMO must not be forced to wait for SCHEMA upload.

An HMO enrollee does not necessarily require `schema_id`.

The backend must therefore distinguish:

```text
HMO-owned enrollee
```

from:

```text
SCHEMA-associated enrollee
```

where the relationship exists.

## Required UI

### Enrollee list

Columns:

- Public ID
- Enrollee ID
- Name
- Gender
- Date of Birth / Age
- Phone
- Plan
- Primary HCP
- Status
- Type
- Source
- Actions

### Actions

- View
- Edit
- Activate
- Deactivate
- Assign Plan
- Assign Provider
- View Dependants
- View History
- Import
- Export
- Verify Eligibility

## Import wizard

```text
Upload File
   ↓
Map Columns
   ↓
Validate
   ↓
Preview
   ↓
Resolve Duplicates
   ↓
Confirm Import
   ↓
Process
   ↓
Import Report
```

The API should return row-level errors instead of silently discarding bad records.

---

# 13. Tariff Management — High Priority

## Business rule

The HMO can upload:

- services
- treatments
- drugs
- prices

but must select/specify the target SCHEMA during tariff upload.

Therefore:

```text
HMO
 ├── Enrollees → may exist without schema_id
 └── Tariff Upload
       └── requires schema_id
```

## Tariff UI

```text
Select SCHEMA
     ↓
Select Tariff Type
     ↓
Upload Excel/CSV
     ↓
Map Columns
     ↓
Validate
     ↓
Preview
     ↓
Duplicate Detection
     ↓
Confirm
     ↓
Import
     ↓
Import Summary
```

### Required tariff entities

- Services
- Treatments
- Drugs
- Treatment Prices
- Drug Prices

The backend must preserve the selected `schema_id` on tariff records where schema-specific pricing is required.

Do not silently assign a schema.

---

# 14. Provider / HCP Relationship

HCP organizations remain independent from HMOs.

A provider may work with multiple HMOs.

Do not model the relationship as:

```text
Provider belongs exclusively to one HMO
```

Instead support:

```text
HMO A ─────┐
HMO B ─────┼── Provider X
HMO C ─────┘
```

## HMO invitation flow

The architecture must support:

```text
HMO
 ↓
Invite HCP
 ↓
Server creates onboarding invitation
 ↓
Secure onboarding link
 ↓
SMS to HCP administrator
 ↓
HCP completes onboarding
 ↓
HCP accepts relationship
 ↓
HMO ↔ HCP relationship becomes active
```

Exact SMS provider, templates, expiration rules and final onboarding details should be taken from the additional onboarding MD files when supplied by the user.

Do not invent final onboarding requirements before those documents are reviewed.

Also reserve the reverse flow:

```text
HCP → Invite / Request relationship with HMO
```

---

# 15. Call Center UI

Call Center is a high-speed operational workspace.

## Primary screen

A prominent verification/search field should support:

- Public ID
- NIN
- phone
- name
- enrollee number

Results should immediately display:

- enrollee identity
- photo where available
- active/inactive status
- HMO
- plan
- provider
- dependants
- eligibility information
- relevant coverage indicators

## P-Code workflow

```text
Verify Enrollee
      ↓
Confirm Provider
      ↓
Check Eligibility
      ↓
Review Coverage
      ↓
Enter Diagnosis
      ↓
Select Services / Treatments / Drugs
      ↓
Submit Authorization
      ↓
Approve / Reject / Query
      ↓
Generate Server P-Code
```

P-Code generation remains server-authoritative.

Do not implement unrestricted offline P-Code generation.

---

# 16. Operations UI

Operations should manage:

- plans
- packages
- subscription types
- riders
- provider panels
- tariffs
- enrollee rosters
- imports
- claims
- vetting
- exceptions
- referrals

## Vetting interface

Use a split/detail layout:

```text
Claim Information
────────────────────────
Enrollee
Provider
P-Code
Diagnosis
Encounter Date

Requested / Billed
────────────────────────
Service
Treatment
Drug
Quantity
Unit Price
Billed Amount

Vetting
────────────────────────
Tariff Amount
Approved Quantity
Vetted Amount
Query / Remark
Approval State
```

---

# 17. Accounts / Finance UI

Accounts manages:

- provider invoices
- invoice line items
- reconciliation
- settlement batches
- approvals
- provider wallets
- payment status

## Financial workflow

```text
Provider Invoice
      ↓
Match Vetted Claims
      ↓
Reconciliation
      ↓
Exception Resolution
      ↓
Accounts Approval
      ↓
Required Executive Approval
      ↓
Settlement
      ↓
Wallet Update
      ↓
Paid Status
```

Financial actions require server-side authorization and audit logging.

---

# 18. Status System

Create a consistent status visual language.

Use statuses such as:

- Active
- Inactive
- Pending
- Verified
- Suspended
- Approved
- Rejected
- Queried
- Processing
- Completed
- Failed
- Paid
- Unpaid
- Expired

Do not use color alone to communicate status. Include text/icon/accessible labels.

---

# 19. Backend Changes Required

The backend should be changed incrementally.

## Phase A — Foundation

Add/refactor:

- HMO tenant context
- middleware
- policies
- authorization services
- API versioning
- consistent response format
- validation
- exception handling
- audit logging

## Phase B — Installation

Introduce or verify:

- installations
- installation UUID
- installation status
- app version
- devices
- last connection
- license reference
- feature entitlements

Use new migrations only after auditing existing structures.

## Phase C — HMO User Administration

Implement:

- HMO users
- roles
- permissions
- role assignment
- permission checks
- user activation/deactivation
- device/session control

Default roles:

```text
HMO Admin
Call Center Officer
Operations Officer
Accounts Officer
```

Allow custom roles.

## Phase D — Enrollees

Implement:

- HMO enrollee registration
- bulk import
- duplicate detection
- dependant management
- plan assignment
- provider assignment
- activation/deactivation
- eligibility API
- import audit

## Phase E — Tariffs

Implement:

- schema selection
- services
- treatments
- drugs
- treatment prices
- drug prices
- tariff import batches
- row-level import errors
- duplicate handling
- effective dates/statuses where supported

## Phase F — Providers

Implement:

- provider directory
- HMO-provider relationship
- invitations
- invitation state
- secure onboarding link
- relationship activation
- provider panel assignment

## Phase G — Authorization

Implement/refactor:

- eligibility
- P-Code request
- code services
- code treatments
- code drugs
- referral
- authorization states
- audit trail

## Phase H — Claims

Implement/refactor:

- claims
- vetting
- exceptions
- tariff comparison
- approval states

## Phase I — Finance

Implement/refactor:

- provider invoices
- invoice line items
- reconciliation
- settlements
- wallets
- payment states
- audit trail

---

# 20. API Response Standard

Use a consistent response structure.

Success:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "meta": {}
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {}
}
```

Authorization error:

```json
{
  "success": false,
  "message": "You are not authorized to perform this action."
}
```

Never expose SQL errors, stack traces or sensitive internals to the client.

---

# 21. API Service Layer

Avoid putting complex business logic directly inside controllers.

Preferred pattern:

```text
Route
  ↓
Controller
  ↓
Form Request / Validation
  ↓
Application Service
  ↓
Domain / Model Operations
  ↓
Database
  ↓
API Resource
```

Examples:

```text
HmoEnrolleeService
EnrolleeImportService
TariffImportService
EligibilityService
PCodeAuthorizationService
ProviderInvitationService
ClaimVettingService
InvoiceReconciliationService
SettlementService
LicenseValidationService
InstallationService
```

---

# 22. Import Architecture

Both enrollee and tariff imports should use a batch model.

```text
Import Batch
├── File
├── User
├── Started At
├── Completed At
├── Total Rows
├── Successful Rows
├── Failed Rows
└── Status

Import Rows
├── Row Number
├── Raw/Normalized Data
├── Status
├── Error
└── Entity ID
```

This provides:

- traceability
- retry capability
- error reporting
- auditability
- progress reporting

Large imports should be queued where appropriate.

---

# 23. Duplicate Handling

Do not blindly insert every uploaded row.

For enrollee imports, identify duplicates using available identifiers such as:

- enrollment ID
- public ID
- NIN where applicable
- phone/name combinations where appropriate

For tariffs, detect duplicates using appropriate combinations such as:

```text
schema + service/treatment/drug + effective pricing context
```

The exact uniqueness rules must be confirmed against the existing database and business logic.

Import UI should clearly show:

```text
New
Updated
Skipped
Duplicate
Failed
```

---

# 24. Reporting

Reports must always respect HMO tenant scope.

Initial reports:

### Enrollees

- total
- active
- inactive
- gender
- age bands
- plan
- provider
- location

### Utilization

- authorizations
- P-Codes
- services
- treatments
- drugs
- referrals

### Claims

- submitted
- vetted
- queried
- approved
- rejected
- amounts

### Finance

- invoices
- reconciled amounts
- settlements
- wallet balances

### Providers

- provider activity
- claims
- invoices
- settlement history

Exports should use server-side authorization.

---

# 25. Notifications

Implement a central notification center.

Notification types:

- enrollee import completed
- tariff import completed
- import errors
- provider invitation status
- P-Code status
- claim query
- invoice query
- settlement approval
- license warning
- installation warning
- system notification

Use:

- unread/read state
- timestamp
- severity
- action link
- entity reference

---

# 26. Offline Strategy

Offline capability must be controlled.

Safe candidates for local cache:

- provider directory
- selected enrollee reference data
- plan reference data
- tariff reference data
- UI configuration
- non-sensitive operational drafts

Not unrestricted offline:

- P-Code generation
- final claims approval
- financial approval
- settlement
- wallet update
- license validation bypass

When offline:

```text
Offline
  ↓
Allow approved local operations
  ↓
Queue permitted mutations
  ↓
Reconnect
  ↓
Authenticate
  ↓
Validate license
  ↓
Sync
  ↓
Resolve conflicts
```

---

# 27. Conflict Strategy

Every synchronized record should have enough metadata to identify:

- server ID
- local ID
- updated timestamp
- sync state
- last server version where needed

Server remains authoritative.

For sensitive business records:

```text
Server wins
```

unless an explicit business workflow supports conflict resolution.

---

# 28. Licensing

Licensing applies to applications independently.

Do not create commercial bundles that force HMO-App and HCP-App to be licensed together.

Supported concepts should include:

- trial
- subscription
- annual
- multi-year
- lifetime/perpetual

Lifetime licensing may use:

```text
expires_at = NULL
```

while retaining:

- license status
- installation limits
- user limits
- feature entitlements
- support period
- device controls
- revocation/suspension controls

---

# 29. Production/Localhost Configuration

During development:

```env
APP_ENV=local
API_BASE_URL=http://localhost:<port>
```

The production API:

```text
https://api.cybernetsystems.ng
```

must be configurable through environment/build configuration.

Never hard-code the production URL into the application.

Before production switch:

- run migrations
- run tests
- verify tenant isolation
- verify authentication
- verify imports
- verify authorization
- verify financial controls
- verify audit logs
- verify backups
- verify HTTPS
- verify CORS
- verify rate limits
- verify queues
- verify storage

---

# 30. Testing Strategy

## Backend

Test:

- authentication
- tenant isolation
- authorization
- HMO registration
- enrollee CRUD
- enrollee import
- tariff import
- provider relationships
- invitations
- eligibility
- P-Code
- claims
- vetting
- invoices
- settlements
- wallets
- reports
- audit logs

## Frontend

Test:

- login
- onboarding
- dashboard
- navigation
- tables
- filters
- forms
- import wizard
- error handling
- responsive layouts
- permissions
- session expiry
- offline/online transitions

## Security

Explicitly test:

```text
HMO A user → HMO B resource
HMO A import → HMO B records
HMO A report → HMO B data
HMO A provider → unrelated provider data
HMO A P-Code → HMO B P-Code
```

Every test must fail safely.

---

# 31. Antigravity Execution Protocol

Antigravity should execute the project in small verifiable stages.

For every stage:

1. Inspect current implementation.
2. Identify affected files.
3. Explain intended change internally.
4. Implement only the current stage.
5. Run relevant tests/lint/build.
6. Check for regressions.
7. Update implementation documentation.
8. Record changed API routes.
9. Record database changes.
10. Proceed to the next stage only after validation.

Do not perform a massive rewrite of the entire application in one operation.

---

# 32. Required Antigravity Deliverables

At completion of the HMO implementation phase:

```text
MedMax/
├── HMO-App/
│   ├── redesigned interface
│   ├── reusable design system
│   ├── API client
│   ├── authentication
│   ├── onboarding
│   ├── dashboard
│   ├── enrollee management
│   ├── tariff management
│   ├── provider management
│   ├── call center
│   ├── operations
│   ├── accounts
│   ├── reports
│   └── settings
│
├── HCP-App/
│   └── reserved for next implementation phase
│
├── SCHEMA-App/
│   └── reserved for next implementation phase
│
└── IX2-App/
    ├── tenant security
    ├── HMO APIs
    ├── installation/device APIs
    ├── authentication
    ├── enrollee APIs
    ├── tariff APIs
    ├── provider APIs
    ├── authorization APIs
    ├── claims APIs
    ├── finance APIs
    ├── reporting APIs
    ├── notification APIs
    └── audit APIs
```

---

# 33. Definition of Done for the First HMO Sprint

The first implementation sprint is complete when:

- [ ] Current HMO-App codebase has been audited.
- [ ] Current IX2-App backend has been audited.
- [ ] Existing database relationships have been verified.
- [ ] HMO tenant isolation is enforced server-side.
- [ ] HMO authentication works against localhost API.
- [ ] Installation identity is implemented.
- [ ] Device/session handling is implemented or verified.
- [ ] New HMO-App shell is implemented.
- [ ] Sidebar/navigation is implemented.
- [ ] Dashboard foundation is implemented.
- [ ] HMO user/role permissions are enforced.
- [ ] Enrollee CRUD is functional.
- [ ] Enrollee import workflow is functional.
- [ ] Tariff upload requires SCHEMA selection.
- [ ] Tariff import validation/reporting works.
- [ ] Provider directory foundation is functional.
- [ ] HMO-provider invitation architecture is prepared.
- [ ] API documentation is updated.
- [ ] Tests exist for the critical tenant/security paths.
- [ ] Application runs completely against localhost.
- [ ] No production API dependency is required during development.

---

# 34. Immediate Next Action for Antigravity

**Do not begin by coding the dashboard.**

Start with:

```text
STEP 1
↓
Locate and inspect the current HMO-App folder
↓
Locate IX2-App backend
↓
Map current HMO-App screens to API calls
↓
Map API calls to Laravel routes/controllers/services
↓
Map those services to actual database tables
↓
Identify missing functionality
↓
Identify duplicated/obsolete functionality
↓
Identify security/tenant-isolation gaps
↓
Produce audit report
↓
Only then begin P1 implementation
```

The first coding objective is the **foundation that makes the redesigned HMO interface safe and API-compatible**, not visual redesign alone.

---

# 35. Design Principle

The redesigned HMO application should not simply be a prettier version of the current application.

It should become the operational interface for:

```text
HMO Management
      │
      ├── Beneficiary Administration
      ├── Provider Network
      ├── Product & Plan Management
      ├── SCHEMA/Tariff Management
      ├── Call Center
      ├── Operations
      ├── Claims
      ├── Accounts & Finance
      ├── Reporting
      └── Administration
```

The interface and backend must therefore be designed together.

**UI → API → Business Service → Tenant Scope → Database**

This is the core implementation pattern for MedMax HMO-App.
