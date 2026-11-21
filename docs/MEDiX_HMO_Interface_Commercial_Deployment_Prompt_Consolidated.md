# MEDiX HMO Interface --- Commercial Deployment & White-Label Implementation Prompt

## Purpose

This document defines the agreed commercial and technical approach for
the **MEDiX HMO Interface**.

MEDiX is a healthcare management software product that will be
sold/licensed to HMOs across Nigeria. Each HMO must experience MEDiX as
**its own healthcare management application**, while the underlying
technology remains centralized.

Central API:

`https://api.cybernetsystems.ng`

The HMO-facing application is the focus of this document. It must
provide organization-specific branding, authentication, data isolation,
deployment recognition, and the existing HMO operational modules.

------------------------------------------------------------------------

# 1. Product Naming

The official product name is:

## MEDiX

`IX2 HMO` is only the current project/folder name and must not be
treated as the official customer-facing product name.

Do not display `IX2 HMO` or generic `MEDIX HMO Portal` as the customer
product identity.

Use:

-   **MEDiX** for the product/technology identity where appropriate.
-   The customer's organization name, logo, contacts, and branding
    throughout the HMO workspace.

------------------------------------------------------------------------

# 2. Commercial Objective

The customer should feel:

> **"This is our HMO management software."**

Not:

> "We are one organization inside a generic shared SaaS application."

The architecture is:

``` text
ONE MEDiX PLATFORM
        +
ONE CENTRAL API
        +
MANY HMO ORGANIZATIONS
        +
ORGANIZATION-SPECIFIC DEPLOYMENTS
        +
STRICT TENANT ISOLATION
        =
SCALABLE WHITE-LABEL HMO SOFTWARE
```

------------------------------------------------------------------------

# 3. Agreed Deployment Model

There are two primary customer deployment models.

## Web

Use one standard MEDiX Web release.

Example:

``` text
MEDiX-Web.zip
```

The customer deploys it on its own domain/subdomain:

``` text
https://portal.abchmo.ng
```

The application communicates with:

``` text
https://api.cybernetsystems.ng
```

The backend resolves the customer's domain/deployment to the correct
organization.

## Desktop

Use one standard MEDiX Windows installer:

``` text
MEDiX-Setup.exe
```

The customer installs it and performs first-launch activation using the
deployment/activation mechanism supplied by MEDiX.

The server binds the installation to the customer's organization.

------------------------------------------------------------------------

# 4. Do Not Build a Complete Application Copy Per Customer

Do NOT create:

``` text
ABC HMO/
    entire MEDiX application

XYZ HMO/
    entire MEDiX application
```

This creates unnecessary storage, deployment, maintenance, update, and
versioning complexity.

Instead use:

``` text
MEDiX Application
       +
Organization Deployment
       +
Organization Configuration
       +
Installation Identity
```

One codebase must serve many HMOs.

------------------------------------------------------------------------

# 5. Web Deployment

The web customer receives the standard MEDiX Web package.

Example:

``` text
MEDiX-Web.zip
```

The customer deploys it on its own domain.

Startup flow:

``` text
portal.abchmo.ng
        |
        v
MEDiX Web Client
        |
        v
API Bootstrap
        |
        v
api.cybernetsystems.ng
        |
        v
Resolve Domain/Deployment
        |
        v
ABC HMO
```

The server returns the public organization configuration required by the
client.

The client must not be trusted to choose an organization using an
arbitrary `organization_id`.

------------------------------------------------------------------------

# 6. Web Organization Resolution

The backend should maintain a domain/deployment mapping conceptually
similar to:

``` text
domains
--------------------------------
id
organization_id
domain
status
created_at
```

Example:

``` text
portal.abchmo.ng
        ↓
ABC HMO
```

Another:

``` text
portal.xyzhmo.ng
        ↓
XYZ HMO
```

The same MEDiX Web release can serve both.

------------------------------------------------------------------------

# 7. Web Bootstrap

When the application loads, it should request the appropriate public
organization configuration.

Conceptually:

``` http
GET /api/v1/client/bootstrap
```

Use the actual backend endpoint if one already exists.

Example response:

``` json
{
  "organization": {
    "id": "uuid",
    "name": "ABC Health Maintenance Organisation",
    "short_name": "ABC HMO",
    "logo_url": "...",
    "email": "info@abchmo.ng",
    "phone": "08000000000",
    "address": "Abuja, Nigeria",
    "website": "https://abchmo.ng"
  },
  "branding": {
    "primary_color": "#...",
    "secondary_color": "#...",
    "favicon_url": "..."
  },
  "deployment": {
    "status": "active"
  }
}
```

Only public organization information belongs in the public bootstrap
response.

------------------------------------------------------------------------

# 8. Desktop Deployment

Use one standard installer:

``` text
MEDiX-Setup.exe
```

First-launch flow:

``` text
MEDiX
   |
   v
Activation
   |
   v
Deployment/Activation Code
   |
   v
api.cybernetsystems.ng
   |
   v
Validate Deployment
   |
   v
Resolve Organization
   |
   v
ABC HMO
   |
   v
Register Installation
```

The exact activation API must follow the existing backend architecture.

Do not embed private API credentials in the installer.

------------------------------------------------------------------------

# 9. Installation Identity

The backend should distinguish:

``` text
Organization
Deployment
Installation
User
```

Conceptually:

``` text
installation_uuid
deployment_id
organization_id
platform
version
status
last_seen_at
```

Example:

``` text
Installation: 9d8c...
Organization: ABC HMO
Platform: Windows Desktop
Status: Active
```

The installation identity identifies the installation/deployment. It
does not replace user authentication.

------------------------------------------------------------------------

# 10. HMO Registration

HMO registration is a server-side provisioning process.

The customer should register through the official MEDiX registration
interface.

Recommended flow:

``` text
MEDiX Website
      |
      v
Register HMO
      |
      v
Organization
      |
      v
Corporate Registration
      |
      v
NHIA Information
      |
      v
Administrator
      |
      v
Review
      |
      v
Submit
      |
      v
Verification / Approval
      |
      v
Deployment Created
      |
      v
MEDiX Download
```

The exact verification process belongs to the backend/platform.

------------------------------------------------------------------------

# 11. Registration Wizard

Present registration professionally as a multi-step wizard:

``` text
01 Organization
02 Corporate Registration
03 NHIA Information
04 Administrator
05 Review
06 Submission
```

Avoid a single overwhelming form.

------------------------------------------------------------------------

# 12. Organization Information

Support appropriate fields such as:

-   Legal organization name
-   Short/display name
-   Organization type
-   State
-   City/LGA
-   Registered address
-   Operational address
-   Official email
-   Official phone
-   Website
-   Logo
-   Organization description

------------------------------------------------------------------------

# 13. Corporate Registration

Support appropriate corporate information:

-   CAC registration number
-   Registration type
-   Date of incorporation
-   Registered address
-   Supporting documents where required

The backend is responsible for verification and uniqueness.

------------------------------------------------------------------------

# 13A. CONSOLIDATED CAC / KORA VERIFICATION REQUIREMENT

This section is mandatory and must be treated as part of the HMO
onboarding architecture.

MEDiX must verify the applicant's corporate registration information
through a server-side CAC verification integration.

The selected provider is **Kora**.

Current Kora documentation identifies the Nigeria CAC Lookup API as:

``` text
POST https://api.korapay.com/merchant/api/v1/identities/ng/cac
```

Kora's current documentation shows a request containing:

``` json
{
  "id": "RC00000011",
  "registration_type": "RC",
  "registration_name": "GWAN NETWORKS",
  "verification_consent": true
}
```

The current documentation explicitly identifies `id` as required,
`registration_name` as optional, and `verification_consent` as required
and `true` for the check. The implementation must follow Kora's current
API contract at development time and must not assume undocumented
fields.

Reference:
https://developers.korapay.com/docs/nigeria-certificate-incorporation

## Kora Integration Architecture

Never call Kora directly from the browser or desktop client.

Correct:

``` text
MEDiX Registration UI
        |
        v
MEDiX Backend
        |
        v
CAC Verification Service
        |
        v
Kora CAC API
        |
        v
Normalized CAC Verification Result
        |
        v
MEDiX Backend
        |
        v
Registration UI
```

Kora credentials must remain server-side.

Never expose:

``` text
KORA_SECRET_KEY
Kora private credentials
internal Kora headers
raw provider credentials
```

to the frontend or installer.

## CAC Verification UX

The registration wizard must provide:

``` text
CAC Registration Number
[________________________]

Registered Organization Name
[________________________]

Registration Type
[________________________]

[ VERIFY CAC ]
```

During verification:

``` text
Verifying CAC registration...
```

On success:

``` text
CAC Verification Successful

Verified Legal Name:
ABC HEALTH MAINTENANCE ORGANISATION LTD

CAC Registration Number:
RC123456

Company Status:
ACTIVE

Registration Date:
...

Registered Address:
...

State:
...

LGA:
...

Entity Type:
...

[ CONFIRM AND CONTINUE ]
```

On failure:

``` text
CAC Verification Unsuccessful

We could not verify the supplied CAC information.

Please review the registration number and organization name
and try again.

[ TRY AGAIN ]
```

Do not expose raw provider errors, stack traces, API keys, SQL errors,
or internal service names.

## CAC Consent

Because Kora's current documentation requires
`verification_consent=true`, MEDiX must provide an appropriate
consent/authorization step before making the verification request.

Example UI wording:

``` text
I confirm that I am authorized to submit this organization
for CAC verification and consent to the verification check.
```

The final legal wording should be approved by the business/legal owner.

Do not fabricate or silently assume consent.

## CAC Verification Result

Kora's current example response includes information such as:

``` text
reference
id
id_type
name
registration_number
registry_number
vat_number
registration_date
registration_submission_date
date_dissolved
tin
type_of_entity
activity
address
state
lga
city
company_status
company_contact_persons
key_personnel
filings
affiliates
```

Only persist the information required by MEDiX.

Do not automatically copy the entire provider response into the primary
organization table.

Normalize provider-specific data into a MEDiX verification result.

Conceptually:

``` text
CACVerificationResult
--------------------------------
success
reference
registration_number
legal_name
entity_type
company_status
registration_date
address
state
lga
```

The Kora adapter maps the provider response into this internal
structure.

## Verification Record

Conceptually:

``` text
organization_verifications
--------------------------------
id
organization_id
verification_type
provider
reference
submitted_identifier
submitted_name
verified_name
status
verified_at
response_summary
created_at
updated_at
```

Possible values:

``` text
verification_type:
CAC

provider:
KORA

status:
PENDING
VERIFIED
FAILED
REVIEW
```

If the full provider response is retained for audit/reconciliation,
store it securely and do not expose it through public bootstrap APIs.

## Name Matching

Compare the applicant's submitted legal name with the verified CAC legal
name.

Support normalization for:

``` text
case
spacing
punctuation
common legal suffix formatting
```

Do not treat materially different organizations as a match.

Possible internal outcomes:

``` text
MATCH
MINOR_NORMALIZATION_DIFFERENCE
MATERIAL_MISMATCH
```

For material mismatch:

``` text
The organization name does not sufficiently match the CAC record.
Please review the information or contact MEDiX support.
```

Use manual review where required.

## Duplicate CAC Prevention

Before activating an organization:

``` text
CAC Registration Number
        |
        v
Existing Organization Check
        |
        +---- Existing active organization
        |          |
        |          v
        |      Block / Review
        |
        +---- No existing active organization
                   |
                   v
                Continue
```

Do not create two active organization records against the same verified
CAC identity.

Do not disclose another customer's private information during duplicate
checks.

## CAC Is Not NHIA Verification

This distinction is mandatory.

CAC verification validates corporate registration identity.

It does NOT automatically prove:

``` text
NHIA accreditation
NHIA operational status
HMO regulatory approval
Provider network authorization
Healthcare regulatory compliance
```

Keep:

``` text
CAC Verification
```

and:

``` text
NHIA Accreditation / Verification
```

as separate concepts and statuses.

# 13B. COMPLETE HMO ONBOARDING STATE MACHINE

Recommended flow:

``` text
REGISTRATION_STARTED
        |
        v
ORGANIZATION_INFORMATION
        |
        v
CAC_VERIFICATION
        |
        +----> FAILED ----> RETRY
        |
        v
CAC_VERIFIED
        |
        v
NHIA_INFORMATION
        |
        v
ADMINISTRATOR_INFORMATION
        |
        v
DOCUMENT_UPLOAD
        |
        v
REVIEW
        |
        v
PENDING_REVIEW
        |
        +----> REJECTED
        |
        v
APPROVED
        |
        v
ORGANIZATION_PROVISIONED
        |
        v
DEPLOYMENT_CREATED
        |
        v
TRIAL_ACTIVATED
        |
        v
READY_FOR_DOWNLOAD
        |
        v
DEPLOYED
        |
        v
ACTIVE
```

The exact backend state names may differ, but the implementation must
preserve the business meaning.

The frontend must never independently transition an organization to
`ACTIVE`.

# 13C. COMPLETE ORGANIZATION PROVISIONING

After approval, the backend provisions:

``` text
Organization
Organization UUID
CAC Verification Record
NHIA Information
Initial Administrator
Organization Membership
Branding Configuration
Web Deployment
Desktop Deployment
Trial
```

Conceptually:

``` text
ABC HMO
 |
 +-- Organization UUID
 +-- CAC Verification
 +-- NHIA Information
 +-- Administrator
 +-- Branding
 +-- Web Deployment
 +-- Desktop Deployment
 +-- Trial
```

Use the existing backend services and tables where available.

Do not create duplicate organization/deployment systems.

# 13D. DEPLOYMENT / INSTALLATION / USER DISTINCTION

These are different concepts.

``` text
Organization
    |
    +-- Deployment
           |
           +-- Installation
                  |
                  +-- User Session
```

An organization is the customer.

A deployment is a customer's web or desktop deployment.

An installation is a specific desktop installation.

A user is an authenticated human operating the system.

Do not use `user_id` as the deployment identity.

Do not use `organization_id` as the installation identity.

# 13E. WEB DEPLOYMENT RESOLUTION

For web:

``` text
portal.abchmo.ng
        |
        v
HTTP Host / Domain
        |
        v
Domain Mapping
        |
        v
Deployment
        |
        v
Organization
```

Conceptually:

``` text
domains
--------------------------------
id
organization_id
deployment_id
domain
status
verified_at
created_at
updated_at
```

The same `MEDiX-Web.zip` can serve:

``` text
portal.abchmo.ng
portal.xyzhmo.ng
portal.defhmo.ng
```

with each domain resolving to its correct organization.

# 13F. DESKTOP DEPLOYMENT RESOLUTION

For desktop:

``` text
MEDiX-Setup.exe
        |
        v
First Launch
        |
        v
Activation / Deployment Code
        |
        v
Backend
        |
        v
Deployment
        |
        v
Installation UUID
        |
        v
Organization
```

Conceptually:

``` text
installations
--------------------------------
id
installation_uuid
deployment_id
organization_id
platform
version
status
last_seen_at
created_at
updated_at
```

The installation UUID does not replace user authentication.

# 13G. TRIAL AND LICENSING FOUNDATION

Trial validity must be server-controlled.

Conceptually:

``` text
Deployment
   |
   +-- edition
   +-- trial_started_at
   +-- trial_expires_at
   +-- status
```

Possible deployment statuses:

``` text
PENDING
ACTIVE
SUSPENDED
EXPIRED
REVOKED
```

Possible editions:

``` text
TRIAL
LICENSED
```

The client may display remaining trial time but must never be the
authority for trial validity.

The architecture must leave room for future:

``` text
subscription plans
license enforcement
device revocation
version enforcement
offline grace periods
```

# 13H. PUBLIC VS PROTECTED ORGANIZATION DATA

Public configuration:

``` text
Organization Name
Short Name
Logo
Favicon
Primary Color
Secondary Color
Address
Public Phone
Public Email
Website
Public Support Contact
Tagline
```

Protected:

``` text
Enrollees
Providers
Claims
Financials
Staff
Authorization
Referrals
Internal Settings
Audit
Private Documents
```

Public bootstrap/login/logout screens must never expose protected data.

# 13I. BRANDING ARCHITECTURE

Use one centralized organization branding/configuration layer.

Conceptually:

``` text
OrganizationBranding

getName()
getShortName()
getLogo()
getFavicon()
getPrimaryColor()
getSecondaryColor()
getAddress()
getPhone()
getEmail()
getWebsite()
getSupportContact()
getTagline()
```

Do not duplicate customer branding logic in individual components.

Never hard-code:

``` text
ABC HMO
ABC logo
ABC phone
ABC email
ABC colors
```

inside reusable components.

# 13J. AUTHENTICATION AND ORGANIZATION ISOLATION

The backend must combine:

``` text
Deployment Context
+
Authenticated User
+
Organization Membership
+
Role / Permissions
```

before granting access to protected resources.

If an ABC deployment receives credentials belonging to another
organization, return only:

``` text
Invalid username or password
```

Do not disclose:

``` text
other organization name
other organization membership
whether the username exists
```

# 13K. LOGOUT AND CACHE ISOLATION

Logout must:

``` text
Revoke/Clear User Authentication
Clear Sensitive Cached Data
Clear User State
Clear Protected API Data
Preserve Deployment Identity
Preserve Public Organization Configuration
Return to Organization-Branded Login/Logout Page
```

After logout, the user should see:

``` text
[ABC HMO LOGO]

ABC HEALTH MAINTENANCE ORGANISATION

You have been logged out.

[ LOGIN AGAIN ]

ABC HMO Public Contact Information
```

A later restart should still identify the installation/domain as ABC
HMO.

# 13L. HMO OPERATIONAL MODULES

The organization-aware interface must preserve the existing business
modules:

``` text
Dashboard
Enrollees
Providers / HCPs
Preauthorization
Authorization Codes
Referrals
Claims
Vetting
Financial
Reports
Staff
Roles / Permissions
Notifications
Organization Settings
```

Every protected request must operate inside the authenticated
organization context.

Do not rebuild functioning business logic simply to implement
deployment/branding.

# 13M. REPORTS AND DOCUMENTS

Generated:

``` text
PDF
Excel
Print Views
Letters
Statements
Claims Documents
Authorization Documents
Reports
```

must use the correct organization's:

``` text
Logo
Legal Name
Address
Phone
Email
Website
```

The organization identity must be resolved by the backend, not accepted
as arbitrary client input.

# 13N. DOMAIN / DEPLOYMENT FAILURE STATES

Unknown web deployment:

``` text
This MEDiX deployment could not be identified.

Please verify your deployment configuration
or contact MEDiX support.
```

Suspended deployment:

``` text
This MEDiX deployment is currently unavailable.

Please contact your administrator or MEDiX support.
```

Expired trial:

``` text
Your MEDiX trial has expired.

Please contact MEDiX or your account administrator
to continue using the service.
```

Do not expose database IDs, stack traces, license implementation
details, or internal service names.

# 13O. KORA FAILURE CATEGORIES

Do not treat every Kora failure as an invalid company.

Distinguish internally between:

``` text
INVALID_VERIFICATION_DATA
VERIFICATION_PROVIDER_UNAVAILABLE
VERIFICATION_PROVIDER_ERROR
INTERNAL_VERIFICATION_ERROR
MANUAL_REVIEW_REQUIRED
```

Customer-facing messages can remain simple.

For provider outage:

``` text
CAC verification is temporarily unavailable.
Please try again shortly.
```

# 13P. FUTURE SECURITY / LICENSING EXTENSIBILITY

This phase does not require full implementation of:

``` text
Installation authentication
Deployment authorization
License management
Trial enforcement
Device revocation
Refresh token rotation
Rate limiting
Audit hardening
Package integrity
Desktop tamper resistance
API abuse prevention
Offline policy
Subscription management
Version enforcement
```

However, the current architecture must not prevent these capabilities
later.

# 13Q. COMPLETE IMPLEMENTATION CHECKLIST

Before coding:

``` text
[ ] Inspect frontend
[ ] Inspect backend API
[ ] Inspect database
[ ] Inspect existing organization model
[ ] Inspect existing deployment model
[ ] Inspect existing installation model
[ ] Inspect authentication
[ ] Inspect tenant isolation
[ ] Inspect registration
[ ] Inspect existing verification services
[ ] Inspect existing Kora integration
[ ] Inspect existing HMO modules
[ ] Search for hard-coded customer identity
[ ] Search for hard-coded API URLs
[ ] Inspect login/logout
[ ] Inspect session restoration
[ ] Inspect cache/local storage
```

Then produce:

``` text
REUSE
MODIFY
CREATE
REMOVE / DEPRECATE
```

Do not create migrations before inspecting the existing schema.

Do not duplicate an existing service.

Do not rewrite working HMO functionality unnecessarily.

# 13R. COMPLETE ACCEPTANCE MATRIX

## Registration

``` text
[ ] Organization can start registration
[ ] CAC number captured
[ ] CAC name captured
[ ] Consent captured
[ ] Kora called only by backend
[ ] Valid CAC verifies
[ ] Invalid CAC fails safely
[ ] Provider outage is distinguishable from invalid data
[ ] Verified name shown for confirmation
[ ] Material name mismatch is blocked/reviewed
[ ] Duplicate CAC is prevented
[ ] NHIA remains separate from CAC
[ ] Administrator is provisioned correctly
[ ] Documents are organization-scoped
[ ] Approval is server-controlled
```

## Web

``` text
[ ] Standard MEDiX-Web.zip is used
[ ] Customer domain resolves correctly
[ ] Organization bootstrap works
[ ] Branding loads correctly
[ ] Unknown domains fail safely
[ ] Deployment status is enforced
```

## Desktop

``` text
[ ] Standard MEDiX-Setup.exe is used
[ ] First launch activation works
[ ] Installation UUID is registered
[ ] Installation maps to deployment
[ ] Deployment maps to organization
[ ] Restart preserves deployment identity
```

## Authentication

``` text
[ ] Correct user can log in
[ ] Wrong organization credentials return generic failure
[ ] Session restoration works
[ ] Expired session returns to organization login
[ ] Logout clears sensitive state
[ ] Organization branding remains after logout
```

## Tenant Isolation

``` text
[ ] ABC cannot see XYZ enrollees
[ ] ABC cannot see XYZ providers
[ ] ABC cannot see XYZ claims
[ ] ABC cannot see XYZ financials
[ ] ABC cannot see XYZ reports
[ ] ABC cannot access XYZ private documents
[ ] Backend rejects arbitrary organization IDs
```

## Branding

``` text
[ ] Logo
[ ] Name
[ ] Favicon
[ ] Colors
[ ] Browser title
[ ] Sidebar
[ ] Dashboard
[ ] Login
[ ] Logout
[ ] Reports
[ ] Print/PDF
```

## Commercial

``` text
[ ] Trial is server-controlled
[ ] Deployment can be suspended
[ ] Deployment can expire
[ ] Future licensing can be added
[ ] Customer-specific domains are supported
[ ] No customer-specific source copy is required
```

# 13S. FINAL CODE-EDITOR INSTRUCTION

Build the **MEDiX HMO Interface** as a production-ready, commercially
saleable organization-specific healthcare application.

The goal is:

> **One centralized MEDiX technology platform that presents itself to
> each HMO as that HMO's own healthcare management software, while
> maintaining strict backend-controlled organization isolation.**

Use:

``` text
ONE MEDiX CODEBASE
ONE CENTRAL API
MANY HMO ORGANIZATIONS
MANY DEPLOYMENTS
CUSTOMER-SPECIFIC DOMAINS
STANDARD WEB PACKAGE
STANDARD WINDOWS INSTALLER
SERVER-SIDE CAC/KORA VERIFICATION
SEPARATE NHIA WORKFLOW
SERVER-SIDE PROVISIONING
TRIAL DEPLOYMENTS
ORGANIZATION-SPECIFIC BRANDING
STRICT TENANT ISOLATION
ORGANIZATION-SPECIFIC AUTHENTICATION
ORGANIZATION-SPECIFIC LOGOUT
EXISTING HMO MODULES
FUTURE LICENSING/SECURITY EXTENSIBILITY
```

Do not:

``` text
Create a full source-code copy for every HMO
Generate a new EXE for every registration
Call Kora from the frontend
Expose Kora credentials
Trust frontend organization IDs
Expose another organization's membership
Treat CAC verification as NHIA accreditation
Store sensitive HMO data in public bootstrap
Rely on client-side trial countdowns
Rewrite functioning HMO business modules unnecessarily
Create duplicate organization/deployment systems
```

Before writing substantial code, inspect the existing MEDiX project and
produce a concrete implementation plan showing exactly what will be
reused, modified, and newly created.

# 14. NHIA Information

Support appropriate accreditation information:

-   NHIA accreditation number
-   Accreditation type
-   Accreditation status
-   Accreditation date
-   Expiry date where applicable
-   Supporting documents where required

Do not assume automatic NHIA verification unless an authorized backend
integration exists.

------------------------------------------------------------------------

# 15. Organization Administrator

The initial administrator should be provisioned as part of organization
setup.

Potential fields:

-   First name
-   Last name
-   Email
-   Phone
-   Password

The backend establishes organization membership and permissions.

------------------------------------------------------------------------

# 16. Organization Identity

Each organization receives an immutable UUID.

Use the UUID as the stable internal identity.

Do not use organization name or short name as the primary identity
because those values can change.

------------------------------------------------------------------------

# 17. Deployment Identity

Each HMO deployment should have its own deployment record.

Conceptually:

``` text
deployments
--------------------------------
id
uuid
organization_id
platform
edition
status
created_at
updated_at
```

Possible platform values:

``` text
web
desktop
```

Possible editions:

``` text
trial
licensed
```

Use the actual backend schema where one already exists.

------------------------------------------------------------------------

# 18. Trial Model

Trial status must be server-controlled.

Conceptually:

``` text
TRIAL
Start Date
Expiry Date
Status
Deployment ID
```

Example:

``` text
ABC HMO
Edition: Trial
Trial Started: 28 September 2026
Trial Expires: 28 October 2026
```

The client may display trial information, but the server remains
authoritative.

Do not rely on a client-side countdown as the actual licensing control.

------------------------------------------------------------------------

# 19. Avoid Complex Package Generation Initially

Do NOT initially build a service that:

-   Copies the complete MEDiX application for every HMO
-   Creates customer-specific application folders
-   Modifies source files
-   Generates thousands of customer ZIPs
-   Builds a new EXE for every registration

Start with:

``` text
ONE MEDiX WEB PACKAGE
ONE MEDiX DESKTOP INSTALLER
MANY DEPLOYMENTS
```

Customer identity comes from deployment configuration and server-side
organization resolution.

------------------------------------------------------------------------

# 20. Customer-Specific Experience

Every HMO must receive its own identity.

ABC HMO should see:

``` text
[ABC HMO LOGO]

ABC HEALTH MAINTENANCE
ORGANISATION

ABC HMO Management System
```

XYZ HMO should see:

``` text
[XYZ HMO LOGO]

XYZ HEALTH MAINTENANCE
ORGANISATION

XYZ HMO Management System
```

Never mix identities.

------------------------------------------------------------------------

# 21. Tenant Data Isolation

If a user belongs to ABC HMO:

``` text
User
 ↓
ABC HMO
 ↓
ABC HMO data
```

The user must never receive XYZ HMO data.

This includes:

-   Enrollees
-   Providers/HCPs
-   Provider contracts
-   Preauthorization requests
-   Authorization codes
-   Referrals
-   Claims
-   Vetting
-   Financial records
-   Staff
-   Reports
-   Notifications
-   Organization settings

The backend must enforce isolation.

------------------------------------------------------------------------

# 22. Login Behavior

An organization-specific installation should behave as though it is the
customer's own HMO application.

If the installation belongs to ABC HMO:

``` text
ABC HMO
    |
    v
Login
```

If somebody attempts to authenticate using credentials belonging to
another organization, the user-facing result should simply be:

> **Invalid username or password**

Do not reveal:

-   The other organization
-   That the username exists
-   That the account belongs to another HMO
-   Organization membership information

The backend must enforce the actual authentication and organization
compatibility.

------------------------------------------------------------------------

# 23. First Login

For a new installation:

``` text
Install
   |
   v
MEDiX
   |
   v
Organization Activation / Bootstrap
   |
   v
Login
   |
   v
Authenticated
   |
   v
ABC HMO Dashboard
```

After organization recognition, the customer branding must immediately
appear.

------------------------------------------------------------------------

# 24. Returning User

If the session remains valid:

``` text
Open MEDiX
     |
     v
Recognize Deployment
     |
     v
Restore Secure Session
     |
     v
ABC HMO Dashboard
```

Do not force the user to log in unnecessarily.

------------------------------------------------------------------------

# 25. Logout

Logout must remove the authenticated user session but preserve the
deployment's organization identity.

Flow:

``` text
ABC HMO Dashboard
       |
       v
Logout
       |
       v
Clear/Revoke User Authentication
       |
       v
Preserve Deployment Identity
       |
       v
ABC HMO Public Login/Logout Page
```

------------------------------------------------------------------------

# 26. Organization-Specific Logout Page

This is an important white-label feature.

After logout, display the customer's own organization.

Example:

``` text
┌─────────────────────────────────────┐

            [ABC HMO LOGO]

      ABC HEALTH MAINTENANCE
            ORGANISATION

       You have been logged out.

          [ LOGIN AGAIN ]

      0800 XXX XXXX
      info@abchmo.ng

      Abuja, Nigeria

└─────────────────────────────────────┘
```

Do not show another organization's identity.

Do not replace the customer identity with generic MEDiX branding.

------------------------------------------------------------------------

# 27. Public Organization Configuration

Separate public organization configuration from protected organization
data.

Public:

``` text
Organization Name
Short Name
Logo
Favicon
Primary Color
Secondary Color
Address
Public Phone
Public Email
Website
Public Support Contact
Tagline
```

Protected:

``` text
Enrollees
Providers
Claims
Financials
Staff
Authorization
Referrals
Internal settings
Audit
```

The public logout/login page may only use public information.

------------------------------------------------------------------------

# 28. Organization Branding Layer

Create a centralized organization branding/configuration layer.

Conceptually:

``` text
OrganizationBranding

getName()
getShortName()
getLogo()
getFavicon()
getPrimaryColor()
getSecondaryColor()
getAddress()
getPhone()
getEmail()
getWebsite()
getSupportContact()
getTagline()
```

Do not duplicate branding logic across individual components.

------------------------------------------------------------------------

# 29. No Hard-Coded Customer Identity

Never hard-code:

``` text
ABC HMO
```

into components.

Never hard-code a specific customer's:

-   Logo
-   Phone
-   Email
-   Address
-   Colors
-   Website

Use organization configuration.

------------------------------------------------------------------------

# 30. MEDiX Product Branding

MEDiX remains the underlying product identity.

A subtle:

``` text
Powered by MEDiX
```

may be supported where commercially appropriate.

For a fully white-label deployment, this can be configurable.

The customer organization should remain the dominant identity inside the
HMO workspace.

------------------------------------------------------------------------

# 31. Customer Domain

For web deployments, support customer-specific domains/subdomains.

Example:

``` text
portal.abchmo.ng
```

The backend resolves:

``` text
portal.abchmo.ng
       ↓
ABC HMO
```

This provides a strong sense of ownership.

------------------------------------------------------------------------

# 32. HMO Interface Scope

This document focuses on the **HMO Interface**.

It should integrate the existing HMO operational requirements,
including:

``` text
Dashboard
Enrollees
Providers/HCPs
Preauthorization
Authorization Codes
Referrals
Claims
Vetting
Financial
Reports
Staff
Roles/Permissions
Notifications
Organization Settings
```

Do not rebuild existing business functionality unnecessarily.

------------------------------------------------------------------------

# 33. HMO Dashboard

The dashboard must be organization-specific.

Example:

``` text
Good morning, John.

ABC HEALTH MAINTENANCE ORGANISATION

Today's Overview

Enrollees
12,450

Active Providers
183

Pending Authorization
27

Claims Awaiting Vetting
41

Financial Summary
...
```

No data from another organization may appear.

------------------------------------------------------------------------

# 34. Reports and Documents

Generated PDFs, printouts and reports should use the organization's:

-   Logo
-   Name
-   Address
-   Phone
-   Email
-   Website

Example:

``` text
[ABC HMO LOGO]

ABC HEALTH MAINTENANCE ORGANISATION LTD
Healthcare Management System

Address:
Phone:
Email:
Website:
```

------------------------------------------------------------------------

# 35. Browser and Desktop Titles

Web examples:

``` text
ABC HMO | Dashboard
ABC HMO | Enrollees
ABC HMO | Providers
ABC HMO | Claims
ABC HMO | Financial
ABC HMO | Reports
```

Desktop may use:

``` text
ABC HMO — MEDiX
```

or another organization-specific format.

------------------------------------------------------------------------

# 36. Sidebar

Example:

``` text
[ABC HMO LOGO]

ABC HMO

Dashboard
Enrollees
Providers
Preauthorization
Referrals
Claims
Vetting
Financial
Reports

Administration
Settings

Logout
```

------------------------------------------------------------------------

# 37. Organization Settings

Authorized administrators may manage permitted organization information
such as:

``` text
Organization Profile
Logo
Contact Information
Address
Website
Brand Colors
Public Support Contact
Staff
Roles
Permissions
Accreditation Information
```

Changes are stored centrally by the backend.

------------------------------------------------------------------------

# 38. Cache and Session Isolation

On logout or account change, clear sensitive cached information:

-   User state
-   Enrollee data
-   Provider data
-   Claims
-   Financial data
-   Authorization data
-   Referral data
-   Other protected records

Preserve only the public deployment/organization context necessary to
display the customer's branded login page.

------------------------------------------------------------------------

# 39. Backend Is the Authority

Never trust the client for:

-   Organization authorization
-   Roles
-   Permissions
-   Claim totals
-   Financial totals
-   Approval status
-   Authorization status
-   Trial validity
-   Deployment validity

The backend validates sensitive operations.

Hiding a button in the frontend is not a security control.

------------------------------------------------------------------------

# 40. API Configuration

Centralize the API base URL.

Example:

``` env
VITE_API_BASE_URL=https://api.cybernetsystems.ng
```

Use the existing project configuration mechanism if different.

Do not scatter the API URL throughout components.

------------------------------------------------------------------------

# 41. Error Handling

Do not expose internal technical details to HMO staff.

Never show raw:

``` text
SQL errors
Laravel exceptions
Stack traces
Database names
Microservice names
Internal API failures
```

Instead provide customer-friendly messages:

``` text
We couldn't complete this request.

Please try again. If the problem continues,
contact your organization's administrator.
```

Technical details belong in logs/monitoring.

------------------------------------------------------------------------

# 42. Versioning

The client should identify:

``` text
Product
Version
Platform
Deployment
```

Example:

``` text
MEDiX
Version 1.0.0
Platform: Web
Deployment: ABC HMO
```

The backend may later enforce minimum supported versions.

------------------------------------------------------------------------

# 43. Security and Licensing --- Future Workstream

Security and licensing are acknowledged as major future requirements.

Do NOT attempt to solve the complete security architecture in this
phase.

However, the implementation must leave room for:

``` text
Installation authentication
Deployment authorization
License management
Trial enforcement
Device revocation
Token management
Rate limiting
Audit logging
Package integrity
Desktop tamper resistance
API abuse prevention
Offline policy
Subscription management
```

Do not make architectural decisions that prevent these capabilities
later.

------------------------------------------------------------------------

# 44. Development Instructions for the Code Editor AI

Before modifying the existing MEDiX HMO client:

1.  Inspect the complete project structure.
2.  Identify the frontend framework.
3.  Inspect the existing API client.
4.  Inspect authentication.
5.  Inspect routing.
6.  Inspect organization/tenant functionality.
7.  Inspect existing HMO modules.
8.  Inspect current branding.
9.  Search for hard-coded product/customer identity.
10. Inspect login/logout behavior.
11. Inspect deployment/environment configuration.
12. Inspect existing API endpoints.
13. Reuse existing services/components where practical.
14. Do not duplicate existing business logic unnecessarily.
15. Do not rewrite working HMO modules merely to implement this
    architecture.

Before substantial coding, produce an implementation plan listing:

``` text
Existing component/service
        ↓
Reuse / Modify / Replace / Create
```

------------------------------------------------------------------------

# 45. Implementation Phases

## Phase 1 --- Organization Bootstrap

Implement/verify:

-   Organization context
-   Deployment context
-   Public organization configuration
-   Branding initialization
-   API bootstrap

## Phase 2 --- Authentication

Implement/verify:

-   Login
-   Session restoration
-   Token refresh
-   Logout
-   Authentication guard
-   Session expiry

## Phase 3 --- White-Label Experience

Implement:

-   Organization logo
-   Organization name
-   Organization colors
-   Favicon
-   Browser title
-   Header
-   Sidebar
-   Dashboard identity
-   Organization-specific login
-   Organization-specific logout

## Phase 4 --- Tenant Isolation

Verify:

-   Organization context comes from the backend
-   No arbitrary organization switching
-   Organization-aware API requests
-   Cache isolation
-   Logout cleanup
-   Permission enforcement

## Phase 5 --- Web Deployment

Implement/verify:

-   Domain-based deployment resolution
-   Public bootstrap
-   Customer domain configuration
-   Standard MEDiX Web package deployment model

## Phase 6 --- Desktop Deployment

Implement/verify:

-   Standard MEDiX installer
-   First-launch activation
-   Activation/deployment mechanism
-   Installation identity
-   Organization binding
-   Organization bootstrap

## Phase 7 --- HMO Modules

Integrate existing modules:

-   Enrollees
-   Providers
-   Preauthorization
-   Authorization
-   Referrals
-   Claims
-   Vetting
-   Financial
-   Reports
-   Staff
-   Administration
-   Notifications

Every module must operate inside the authenticated organization context.

------------------------------------------------------------------------

# 46. Acceptance Test --- ABC HMO

The implementation should pass this scenario.

### Step 1 --- Registration

ABC HMO registers through MEDiX.

### Step 2 --- Provisioning

The backend creates:

``` text
ABC HMO
Organization UUID
Deployment
Trial
```

### Step 3 --- Web

ABC deploys the standard MEDiX Web package at:

``` text
portal.abchmo.ng
```

MEDiX resolves:

``` text
portal.abchmo.ng
       ↓
ABC HMO
```

### Step 4 --- Desktop

ABC installs the standard MEDiX installer and activates it.

The server associates:

``` text
Installation
       ↓
ABC HMO
```

### Step 5 --- Branding

MEDiX displays:

``` text
ABC HMO LOGO

ABC HMO
```

### Step 6 --- Login

ABC staff member logs in.

### Step 7 --- Data Isolation

The user sees only:

``` text
ABC HMO data
```

### Step 8 --- Wrong Organization Credentials

A user attempts to authenticate with credentials belonging to another
organization.

The user sees:

> Invalid username or password

No organization membership information is disclosed.

### Step 9 --- Logout

The user logs out.

MEDiX displays:

``` text
ABC HMO LOGO

ABC HMO

You have been logged out.

[ LOGIN AGAIN ]

ABC HMO Contact Information
```

### Step 10 --- Restart

The application is closed and reopened.

The deployment still recognizes:

``` text
ABC HMO
```

### Step 11 --- Re-authentication

The user logs in and returns to:

``` text
ABC HMO Dashboard
```

------------------------------------------------------------------------

# 47. Final Architecture

``` text
                    MEDiX PLATFORM
                          |
                api.cybernetsystems.ng
                          |
          ┌───────────────┼───────────────┐
          |               |               |
          v               v               v
       ABC HMO         XYZ HMO         DEF HMO
          |               |               |
          v               v               v
    Own Domain       Own Domain       Own Domain
          |               |               |
          v               v               v
     Own Branding    Own Branding    Own Branding
          |               |               |
          v               v               v
       Own Users        Own Users        Own Users
          |               |               |
          v               v               v
       Own Data         Own Data         Own Data
```

The technology is centralized.

The customer experience is organization-specific.

The backend remains authoritative.

The client remains lightweight.

The same MEDiX release can serve many HMOs.

------------------------------------------------------------------------

# 48. Final Instruction

Build the **MEDiX HMO Interface** as a production-ready, commercially
saleable organization-specific healthcare application.

The objective is not merely to create a generic multi-tenant SaaS
frontend.

The objective is:

> **One centralized MEDiX technology platform that presents itself to
> each HMO as that HMO's own healthcare management software.**

Use:

``` text
ONE MEDiX WEB APPLICATION
ONE MEDiX DESKTOP APPLICATION
ONE CENTRAL API
MANY ORGANIZATION DEPLOYMENTS
ORGANIZATION-SPECIFIC BRANDING
STRICT ORGANIZATION DATA ISOLATION
```

For Web:

``` text
MEDiX-Web.zip
      ↓
Customer Domain
      ↓
Backend resolves Organization
      ↓
Customer-specific MEDiX
```

For Desktop:

``` text
MEDiX-Setup.exe
      ↓
Activation
      ↓
Deployment
      ↓
Organization Binding
      ↓
Customer-specific MEDiX
```

After successful organization recognition and authentication, users must
see only their organization's workspace and data.

After logout, the application must retain the deployment's organization
identity and return to that organization's branded public login/logout
experience.

Do not implement unnecessary customer-specific source-code copies.

Do not implement complex server-side package generation at this stage.

Do not expose private backend credentials.

Do not trust frontend organization identifiers for authorization.

Do not expose another organization's existence or membership through
authentication errors.

Before writing substantial code, inspect the existing MEDiX project and
produce a concrete implementation plan showing what will be reused,
modified, and newly created.

------------------------------------------------------------------------

# CONSOLIDATED REFERENCE

Current Kora CAC verification documentation:

https://developers.korapay.com/docs/nigeria-certificate-incorporation

This external API contract must be rechecked immediately before
production integration because third-party API documentation may change.

**Final product identity:** MEDiX\
**Central API:** `https://api.cybernetsystems.ng`\
**Standard web package:** `MEDiX-Web.zip`\
**Standard desktop installer:** `MEDiX-Setup.exe`\
**Architecture:** one centralized platform, many organization
deployments, strict backend-controlled tenant isolation.
