# IX2 HMO White-Label Client Architecture & Implementation Plan

## Document Purpose

This document is the implementation specification for the **IX2 HMO Client Application**.

The application is a commercial healthcare-management product that will be licensed/sold to individual HMOs across Nigeria.

Each HMO customer must experience the application as **their own HMO software**.

Although the client application communicates with the central IX2/Cybernet Systems backend at:

`https://api.cybernetsystems.ng`

the customer-facing interface must never expose the platform as a generic multi-tenant product.

The application must dynamically present the authenticated organization's:

- Legal/registered organization name
- Short/display name
- Logo
- Brand identity
- Address
- Phone numbers
- Email
- Website
- Support/contact information
- Accreditation information where configured
- Organization-specific welcome/logout screens
- Organization-specific dashboard context
- Organization-specific users, roles, providers, enrollees, claims, authorizations and financial records

The final result should feel like a **dedicated HMO software product licensed to that organization**, not a shared SaaS dashboard.

---

# 1. Product Positioning

## 1.1 Commercial Model

The product is sold to HMO organizations individually.

Deployment may be:

1. Web application installed on the customer's domain/subdomain
2. Desktop application packaged as ZIP/EXE
3. Future mobile application

All installations communicate with the central backend API:

`https://api.cybernetsystems.ng`

The central API remains the authoritative source of:

- Authentication
- Organization identity
- Tenant isolation
- User authorization
- HMO data
- Business rules
- Verification
- Organization configuration
- Audit
- Notifications
- Core healthcare services

The client application is the presentation and interaction layer.

---

# 2. Core Architectural Principle

## NEVER treat the frontend as the authority for organization ownership.

The frontend may know which organization it is presenting, but it must never be trusted to determine which organization's data a user can access.

The authoritative chain is:

```text
Authenticated User
        |
        v
Organization Membership
        |
        v
Organization/Tenant Context
        |
        v
Backend Authorization
        |
        v
Organization-Owned Data
```

The frontend must never be allowed to switch organizations simply by changing:

```text
organization_id
tenant_id
slug
localStorage
URL parameter
```

The backend must derive and enforce the organization context.

---

# 3. White-Label Requirement

The most important business requirement is:

> Each HMO must feel as if the software belongs exclusively to that HMO.

For example, if the customer is:

**ABC Health Maintenance Organisation Ltd**

the application should display:

```text
ABC HMO

ABC HMO Management System

ABC HMO logo
ABC HMO address
ABC HMO contact details
```

A different customer:

**XYZ Health Maintenance Organisation Ltd**

must see:

```text
XYZ HMO

XYZ HMO Management System

XYZ HMO logo
XYZ HMO address
XYZ HMO contact details
```

The same underlying client codebase can serve both customers.

The organization configuration is dynamic.

---

# 4. No Generic Platform Branding Inside Customer Workspace

After an HMO has been registered and its client is bound to that organization:

### Do NOT display:

- MEDIX
- MEDiX HMO Portal
- Generic "Multi-Tenant HMO Platform"
- Another customer's name
- Another organization's logo
- Generic organization data
- Internal platform branding in customer-facing application screens

Do not hard-code customer branding.

Do not hard-code a single HMO.

Do not use a generic tenant name after organization configuration has been loaded.

The central backend domain:

`api.cybernetsystems.ng`

is an infrastructure/API endpoint and should not be unnecessarily exposed in the visual UI.

---

# 5. Public Landing Page

The public landing page should remain simple.

For the web/desktop client, unauthenticated users should see:

```text
[Organization/Configured Product Logo]

[Organization Product Name]

Secure Healthcare Management Platform

        [ LOGIN ]

        ─────────

New Organization?

        [ REGISTER YOUR HMO ]
```

## Important

The public landing page may initially show neutral IX2 product branding before an organization is identified.

However, once an installation is bound to a customer organization, the customer organization's branding must take precedence.

For a customer-specific deployment, the landing page should preferably show the customer's:

- Logo
- Name
- Contact information
- Product title

rather than generic platform branding.

---

# 6. Registration

Registration is a **server-side organization provisioning process**.

The client provides the registration user interface.

The actual organization is created and verified by the backend.

The registration workflow should be professionally presented as a multi-step wizard.

Recommended flow:

```text
01 Organization
      |
02 Corporate Registration
      |
03 NHIA Information
      |
04 Administrator
      |
05 Review
      |
06 Submission
      |
07 Verification
      |
08 Activation
```

---

# 7. Organization Registration Data

The registration interface should support at minimum:

## Organization

- Legal name
- Short/display name
- Organization type
- State
- City/LGA where appropriate
- Registered address
- Operational address
- Official email
- Official phone
- Website
- Logo
- Organization description

## Corporate Registration

- CAC registration number
- Registration type
- Date of incorporation
- Registered address
- Corporate documents where required

## NHIA

- NHIA accreditation number
- Accreditation type
- Accreditation status
- Accreditation date
- Expiry date where applicable
- Supporting documents where required

## Administrator

- First name
- Last name
- Email
- Phone
- Password
- Confirmation

---

# 8. Organization Verification

The backend must perform verification.

Potential verification services include:

- CAC/company verification
- Organization uniqueness
- NHIA accreditation verification where an authorized API exists
- Internal approval
- Document verification

Kora/CAC credentials must remain server-side.

The client must NEVER contain:

- Kora API keys
- Private verification credentials
- Backend secrets
- Database credentials

---

# 9. Organization Uniqueness

The backend must enforce uniqueness.

At minimum:

```text
normalized_legal_name
normalized_short_name
registration_number
```

must be protected against duplicate organization creation according to the platform's business rules.

The client should display a clear message when the backend reports that an organization already exists.

Example:

```text
An organization with this CAC registration number
is already registered on the IX2 platform.

If you are an authorized administrator, please use
the organization activation/recovery process.
```

---

# 10. Organization Activation

After successful registration and approval:

```text
Organization
      |
      v
Verified
      |
      v
Approved
      |
      v
Activated
```

Activation should provision the organization for client access.

The backend should provide the client with the organization configuration necessary to initialize the installation.

---

# 11. Client Installation Binding

Each customer deployment must be associated with an organization.

There are two primary deployment models.

## Web

The customer's domain/subdomain identifies the intended organization.

Example:

```text
https://hmo.customer-domain.ng
```

The frontend asks the backend for public organization configuration.

The backend resolves the organization from a trusted deployment/domain mapping.

Example conceptual request:

```http
GET /api/v1/client/bootstrap
Host: hmo.customer-domain.ng
```

The backend returns the appropriate organization configuration.

Do not trust a frontend-supplied `organization_id`.

---

## Desktop

Each EXE installation should be provisioned/bound to a specific organization.

The installation may contain a non-secret public installation configuration such as:

```json
{
    "installation_type": "desktop",
    "deployment_key": "PUBLIC_ORGANIZATION_BINDING"
}
```

Do not put private API credentials into the EXE.

The backend must validate the installation binding.

If a desktop package is specifically generated for an HMO, the package can contain a public organization/deployment identifier, while authentication and authorization remain server-side.

---

# 12. Organization Bootstrap

Every client installation should have a bootstrap process.

Conceptually:

```text
Application Starts
        |
        v
Load Installation Configuration
        |
        v
Request Organization Bootstrap
        |
        v
API
        |
        v
Resolve Organization
        |
        v
Return Public Organization Configuration
        |
        v
Initialize Branding
        |
        v
Initialize Authentication
```

Example response:

```json
{
    "organization": {
        "id": "uuid",
        "name": "ABC Health Maintenance Organisation",
        "short_name": "ABC HMO",
        "logo_url": "...",
        "email": "info@abchmo.ng",
        "phone": "08000000000",
        "address": "Abuja, Nigeria",
        "website": "..."
    },
    "branding": {
        "primary_color": "#...",
        "secondary_color": "#...",
        "favicon_url": "...",
        "login_background_url": "..."
    },
    "installation": {
        "status": "active"
    }
}
```

The actual API contract must follow the backend implementation.

---

# 13. Authentication Flow

The client must implement authentication as:

```text
Application Starts
       |
       v
Bootstrap Organization
       |
       v
Check Authentication
       |
   +---+---+
   |       |
 Valid    Invalid
   |       |
   v       v
Dashboard Login
```

A user who has a valid session should not see the login page every time they open the application.

---

# 14. Persistent Authentication

Use secure authentication mechanisms appropriate to the platform.

## Web

Prefer:

- Secure cookies
- HttpOnly cookies where applicable
- SameSite protection
- Server-managed sessions or secure token rotation

## Desktop

Use the platform's secure credential/token storage where possible.

## Mobile

Future implementation should use:

- Android Keystore
- iOS Keychain
- Secure storage APIs

Do not store long-lived authentication secrets in ordinary localStorage if a safer platform mechanism is available.

---

# 15. Logout Requirement

Logout must be explicit.

When a user clicks:

```text
Logout
```

the application must:

1. Revoke/invalidate the authentication session where supported
2. Clear access credentials
3. Clear user-specific cached data
4. Clear sensitive application state
5. Keep the non-sensitive organization installation context
6. Load the organization's public logout/landing configuration
7. Redirect to the organization-specific logged-out page

This distinction is critical.

### Do NOT erase the organization identity during logout.

The application must still know which customer deployment it belongs to.

---

# 16. Organization-Specific Logout Page

This is a major commercial/white-label feature.

After logout, the user must NOT be redirected to a generic MEDIX/IX2 platform landing page.

Instead, show the organization's own branded logout page.

Example:

```text
------------------------------------------------

              [ LARGE HMO LOGO ]

        ABC HEALTH MAINTENANCE
             ORGANISATION

        You have been securely logged out.

        Thank you for using the
        ABC HMO Management System.

        Need assistance?

        0800 XXX XXXX
        support@abchmo.ng

        Abuja, Nigeria

              [ LOGIN AGAIN ]

------------------------------------------------
```

There should be no unrelated platform branding.

---

# 17. Logout Page Data

The organization logout page can use:

```text
organization.name
organization.short_name
organization.logo
organization.address
organization.email
organization.phone
organization.website
organization.support_email
organization.support_phone
organization.primary_color
organization.secondary_color
organization.tagline
```

Optional:

```text
organization.background_image
organization.favicon
organization.login_message
organization.footer_text
```

---

# 18. Important Security Rule for Logout Page

The logout page is public.

Therefore it must only display **public organization information**.

Never display:

- Staff information
- Enrollee information
- Claims
- Financial information
- Internal API data
- Private configuration
- Authentication tokens
- Internal organization IDs if not necessary
- Secrets

The public configuration should be deliberately separated from private organization data.

---

# 19. User Data Isolation

This is the most important technical requirement.

If:

```text
Organization A
```

has:

```text
10,000 enrollees
500 providers
5,000 authorization requests
```

and:

```text
Organization B
```

has:

```text
20,000 enrollees
800 providers
10,000 authorization requests
```

a user from Organization A must never receive Organization B's data.

This must be enforced on the backend.

---

# 20. Multi-Tenant API Rule

Never rely on:

```http
GET /api/enrollees?organization_id=123
```

as the security boundary.

Instead:

```http
GET /api/v1/enrollees
Authorization: Bearer <authenticated-session>
```

The backend determines:

```text
Authenticated User
       |
       v
Membership
       |
       v
Organization
       |
       v
Query Scope
       |
       v
Organization Data
```

---

# 21. Frontend Organization Context

The frontend may maintain a read-only organization context:

```text
OrganizationContext
```

containing:

```text
organization.id
organization.name
organization.short_name
organization.logo
organization.contact
organization.branding
```

This context is used for:

- Header
- Sidebar
- Login
- Logout
- Dashboard
- Reports
- PDF headers
- Print layouts
- Email templates where appropriate
- Browser title
- Favicon
- Notifications
- Empty states
- Error pages

But this context must NOT be treated as the authorization mechanism.

---

# 22. Branding System

Create a centralized branding service/context.

Example conceptual interface:

```text
BrandingService

getOrganizationName()
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

Never repeat hard-coded organization names throughout the application.

Avoid:

```text
"MEDIX"
"MEDiX HMO Portal"
```

inside individual components.

Use:

```text
branding.shortName
branding.name
```

instead.

---

# 23. Browser Title

The browser/document title must be organization-specific.

Instead of:

```text
MEDIX HMO Portal
```

use:

```text
ABC HMO | Dashboard
```

or:

```text
ABC HMO Management System
```

Examples:

```text
ABC HMO | Enrollees
ABC HMO | Providers
ABC HMO | Claims
ABC HMO | Reports
ABC HMO | Administration
```

---

# 24. Favicon

The organization's logo should be usable as the favicon where technically appropriate.

The favicon should be loaded dynamically from organization configuration.

---

# 25. Header

The application header should display the customer's organization.

Example:

```text
[ABC HMO LOGO]  ABC HMO

Dashboard        Notifications      User
```

Not:

```text
[IX2] MEDIX
```

---

# 26. Sidebar

The sidebar should use the organization's name/logo.

Example:

```text
┌──────────────────────────┐
│ [LOGO]                   │
│ ABC HMO                  │
│                          │
│ Dashboard                │
│ Enrollees                │
│ Providers                │
│ Preauthorization         │
│ Referrals                │
│ Claims                   │
│ Vetting                  │
│ Financial                │
│ Reports                  │
│ Administration           │
│                          │
│ Settings                 │
│                          │
│ Logout                   │
└──────────────────────────┘
```

---

# 27. Dashboard

The dashboard should immediately communicate ownership.

Example:

```text
Good morning, John.

ABC HEALTH MAINTENANCE ORGANISATION

Today's Overview

Enrollees
12,450

Active Providers
183

Pending Authorizations
27

Claims Awaiting Vetting
41

Financial Summary
...
```

The user should feel that this is the HMO's own operational system.

---

# 28. Reports and Printed Documents

This white-label concept must extend beyond the UI.

Generated:

- PDF
- Excel reports
- Authorization documents
- Claim reports
- Provider lists
- Enrollee lists
- Financial reports
- Letters

should use organization information.

Example PDF header:

```text
[ABC HMO LOGO]

ABC HEALTH MAINTENANCE ORGANISATION LTD
Healthcare Management System

Address:
Phone:
Email:
Website:
```

Do not use generic platform branding unless required internally or contractually.

---

# 29. Notifications

Notifications displayed to staff should identify their organization.

Example:

```text
ABC HMO

New authorization request received
from Sunrise Medical Centre.
```

Avoid generic messages such as:

```text
MEDIX: New request
```

---

# 30. API Errors

Backend errors should be transformed into customer-friendly messages.

Do not expose:

```text
api.cybernetsystems.ng
Laravel exception
SQL error
microservice name
database table
stack trace
```

to ordinary users.

Instead:

```text
We couldn't complete this request.

Please try again. If the problem continues,
contact your organization's administrator.
```

Provide technical details only in developer/admin logs.

---

# 31. Organization-Specific Contact

Customer support information should prioritize the organization's configured contacts.

Example:

```text
Need Help?

ABC HMO Support

Phone:
0800 XXX XXXX

Email:
support@abchmo.ng
```

The central platform support channel may exist separately in technical documentation or controlled admin interfaces, but should not replace the organization's own identity in the normal customer workspace.

---

# 32. Domain Deployment

For customers purchasing web deployment, the recommended model is:

```text
Customer Domain
        |
        v
Customer Web Client
        |
        v
https://api.cybernetsystems.ng
```

Example:

```text
https://portal.abchmo.ng
        |
        v
IX2 Client
        |
        v
https://api.cybernetsystems.ng
```

Another customer:

```text
https://portal.xyzhmo.ng
        |
        v
Same IX2 Client Architecture
        |
        v
https://api.cybernetsystems.ng
```

The backend determines the correct organization for the deployment.

---

# 33. Desktop Deployment

For desktop customers:

```text
ABC-HMO-Management.exe
        |
        v
ABC HMO branded application
        |
        v
api.cybernetsystems.ng
```

The executable should contain the appropriate public deployment configuration.

Do not embed secrets.

Do not create a separate backend per customer unless the commercial/technical deployment model later requires it.

---

# 34. One Codebase, Multiple Organizations

The development team should maintain:

```text
ONE CLIENT CODEBASE
        |
        +---- Organization A
        |
        +---- Organization B
        |
        +---- Organization C
        |
        +---- Organization D
```

The differences should come from:

```text
Organization Configuration
```

not duplicated source code.

Avoid creating:

```text
abc-hmo-project
xyz-hmo-project
another-hmo-project
```

unless a future contractual requirement explicitly requires source-level customization.

---

# 35. Organization Configuration vs Organization Data

Separate these concepts.

## Public Organization Configuration

Safe to expose to unauthenticated clients:

```text
name
short_name
logo
colors
address
phone
email
website
tagline
public support information
```

## Protected Organization Data

Requires authentication:

```text
enrollees
providers
staff
claims
authorization
referrals
payments
financial records
audit
internal settings
```

This separation is essential.

---

# 36. Authentication Guard

Implement a central route guard.

Conceptually:

```text
Public Routes
    |
    ├── /
    ├── /login
    ├── /register
    └── /logged-out
```

Protected routes:

```text
Protected Routes
    |
    ├── /dashboard
    ├── /enrollees
    ├── /providers
    ├── /authorization
    ├── /claims
    ├── /reports
    └── /administration
```

The protected router checks:

```text
authenticated?
organization active?
user active?
permissions valid?
```

before rendering.

---

# 37. Logout Routing

Implement:

```text
logout()
    |
    +-- revoke session
    +-- clear auth state
    +-- clear user-sensitive cache
    |
    +-- preserve installation context
    |
    +-- load organization public configuration
    |
    +-- navigate to organization logout page
```

Example route:

```text
/logout
```

or:

```text
/organization-logout
```

The route must dynamically render the organization-specific public page.

Do not hard-code a generic logout page.

---

# 38. Session Expiry vs Logout

These are different states.

## Explicit Logout

Show:

```text
You have been securely logged out.
```

## Session Expired

Show:

```text
Your session has expired.

Please sign in again to continue.
```

## Account Revoked

Show:

```text
Your account is no longer active.

Please contact your organization's administrator.
```

## Organization Suspended

Show:

```text
Organization access is currently restricted.

Please contact your organization's administrator.
```

Do not use the same message for all cases.

---

# 39. Organization Switching

For the normal HMO client:

**Do not provide organization switching.**

A user belongs to an organization context.

If multi-organization users are required later, implement an explicit backend-controlled organization switch mechanism.

Do not implement:

```text
Change Organization
```

by simply changing a frontend variable.

---

# 40. Cache Isolation

React Query/Redux/other client-state caches must be organization-aware.

Do not allow cached data from one organization to remain available after:

- logout
- organization change
- account change
- installation reassignment

On logout:

```text
clearSensitiveCache()
```

must run.

Public organization configuration may remain.

---

# 41. Local Storage Rules

Local storage may contain non-sensitive installation preferences.

Examples:

```text
theme
language
sidebar state
installation identifier
public organization configuration cache
```

Do not store:

```text
password
private API keys
database credentials
long-lived sensitive tokens
enrollee medical information
claims
financial records
```

unless explicitly justified and securely protected.

---

# 42. Organization Rebranding

The backend should allow authorized organization administrators to update permitted branding information.

For example:

```text
Organization Settings

Logo
Organization Name
Short Name
Tagline
Primary Color
Secondary Color
Phone
Email
Address
Website
Support Contact
```

After saving:

```text
Backend
   |
   v
Organization Configuration
   |
   v
Client Refresh
   |
   v
Updated Branding
```

The customer does not need a new EXE merely because their logo or contact details changed, provided the desktop application obtains branding dynamically from the API.

---

# 43. Important Desktop Recommendation

Even if the customer receives a branded EXE such as:

```text
ABC-HMO-System.exe
```

the application should still retrieve organization branding from the backend.

The EXE's branding should be considered a bootstrap/default identity.

The server remains authoritative.

This allows:

```text
Logo change
Address change
Phone change
Email change
Brand color change
```

without rebuilding the application.

---

# 44. Installation Identity

Each installation should have a unique installation identifier.

Conceptually:

```text
installation_uuid
organization_uuid
platform
version
status
last_seen_at
```

Example:

```text
Installation:
9d8c....

Organization:
abc-hmo-uuid

Platform:
Windows Desktop

Version:
1.0.4

Status:
active
```

The server can revoke an installation if necessary.

---

# 45. Security Model

The client must assume:

> Everything in the client can potentially be inspected or modified.

Therefore:

- Never trust client organization IDs
- Never trust client roles
- Never trust client permissions
- Never trust client prices
- Never trust client claim totals
- Never trust client approval status
- Never trust client installation configuration as authorization
- Never embed backend secrets

The server must validate all sensitive operations.

---

# 46. Role-Based Access

The organization may have roles such as:

```text
Organization Administrator
HMO Administrator
Call Center Agent
Operations Officer
Head of Operations
Claims Officer
Finance Officer
Provider Management Officer
Report Officer
Viewer
```

The exact roles should come from backend configuration.

The frontend uses permissions returned by the API to control visibility.

But hiding a button is NOT security.

The backend must independently enforce authorization.

---

# 47. Registration Does Not Equal Access

The following states must remain separate:

```text
Registered
Verified
Approved
Activated
Suspended
Rejected
```

A registered organization should not automatically have unrestricted access.

The backend determines whether it is active.

---

# 48. Installation State Machine

The client should be able to handle:

```text
UNKNOWN
   |
   v
BOOTSTRAPPING
   |
   +----> ORGANIZATION_NOT_CONFIGURED
   |
   +----> ORGANIZATION_ACTIVE
   |
   +----> ORGANIZATION_SUSPENDED
   |
   +----> INSTALLATION_REVOKED
```

If:

```text
ORGANIZATION_ACTIVE
```

continue normally.

If:

```text
INSTALLATION_REVOKED
```

stop protected access and show an appropriate recovery/contact screen.

---

# 49. Version and Update Management

The client should identify itself to the API.

Example:

```text
X-IX2-Client-Version: 1.0.0
X-IX2-Client-Platform: web
```

Desktop:

```text
X-IX2-Client-Platform: windows
```

The backend may return:

```json
{
    "minimum_supported_version": "1.0.0",
    "latest_version": "1.0.5"
}
```

If an outdated version is blocked:

```text
A new version of your HMO application is required.

Please update to continue.
```

The update message should still be customer-branded.

---

# 50. Development Rules for the Code Editor AI

The coding AI must follow these rules strictly.

## Rule 1

Do not hard-code organization names.

Bad:

```js
const appName = "MEDIX HMO Portal";
```

Good:

```js
const appName = organization.short_name;
```

---

## Rule 2

Do not hard-code logos.

Bad:

```html
<img src="/medix-logo.png">
```

Good:

```html
<img src={organization.logo_url}>
```

---

## Rule 3

Do not hard-code customer contacts.

Bad:

```text
support@medix.com
```

Good:

```text
organization.support_email
```

---

## Rule 4

Do not expose organization IDs as a security mechanism.

---

## Rule 5

Do not create a frontend-only tenant switch.

---

## Rule 6

Do not store private authentication credentials in localStorage.

---

## Rule 7

Do not expose API errors directly to customers.

---

## Rule 8

Do not show generic platform branding after organization bootstrap.

---

## Rule 9

Do not erase organization installation context during logout.

---

## Rule 10

Always clear authenticated user data during logout.

---

# 51. Required Application Services

Create centralized services/modules similar to:

```text
services/
│
├── api/
│   ├── client
│   ├── auth
│   ├── organization
│   ├── installation
│   ├── enrollees
│   ├── providers
│   ├── authorization
│   ├── referrals
│   ├── claims
│   ├── financial
│   └── reports
│
├── auth/
│   ├── session
│   ├── token
│   └── logout
│
├── organization/
│   ├── bootstrap
│   ├── context
│   └── branding
│
└── security/
    ├── permissions
    ├── cache
    └── installation
```

Use the actual framework/project structure where appropriate.

---

# 52. Required Frontend Contexts

If the frontend framework supports application contexts/providers, create centralized contexts for:

```text
OrganizationContext
AuthContext
PermissionContext
Theme/BrandingContext
```

The organization context should be initialized before the protected application shell.

---

# 53. Recommended Startup Sequence

Implement the application startup process approximately as:

```text
START
 |
 v
Load local installation configuration
 |
 v
Bootstrap organization
 |
 v
Validate installation
 |
 v
Load public branding
 |
 v
Check authentication
 |
 +---- unauthenticated ---> Public Landing/Login
 |
 +---- authenticated -----> Validate session
                              |
                              +---- valid ---> Application
                              |
                              +---- invalid -> Login
```

Do not render a generic customer workspace before organization bootstrap has completed.

---

# 54. Loading State

While organization configuration is loading, show a professional branded loading state.

If branding is unavailable:

```text
Loading application...
```

Once branding loads:

```text
[Organization Logo]

Loading ABC HMO...
```

Avoid showing another organization's identity.

---

# 55. Error State

If organization bootstrap fails:

```text
Unable to connect to your organization's
healthcare management service.

Please check your internet connection and try again.

[ Retry ]
```

Do not expose internal API URLs or stack traces.

---

# 56. Offline Behavior

The application may support offline-aware UI where required, but cached sensitive data must be carefully controlled.

For now:

- Public branding may be cached
- Non-sensitive UI preferences may be cached
- Authentication should remain server-authoritative
- Sensitive HMO records should not be exposed merely because a previous session existed

Future offline functionality must have its own security design.

---

# 57. Customer-Specific URL Strategy

For web deployments, prefer organization-specific domains/subdomains.

Example:

```text
portal.abchmo.ng
portal.xyzhmo.ng
portal.examplehmo.ng
```

The backend maintains a domain-to-organization mapping:

```text
domain
organization_id
status
```

Conceptually:

```text
portal.abchmo.ng
       |
       v
ABC HMO
```

and:

```text
portal.xyzhmo.ng
       |
       v
XYZ HMO
```

Same API.

Different organization context.

---

# 58. Customer-Specific Desktop Strategy

Desktop builds can be distributed as:

```text
ABC-HMO-Management.exe
XYZ-HMO-Management.exe
```

but the source code remains the same.

The deployment configuration binds each build/installation to the appropriate organization.

Do not fork the application code.

---

# 59. Backend API Contract Required From the Client

The client should expect backend capabilities approximately equivalent to:

```text
GET    /api/v1/client/bootstrap

POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/session

POST   /api/v1/organizations/register
POST   /api/v1/organizations/verify

GET    /api/v1/organization/profile
GET    /api/v1/organization/branding

GET    /api/v1/organization/staff
GET    /api/v1/organization/roles

GET    /api/v1/enrollees
GET    /api/v1/providers
GET    /api/v1/authorization
GET    /api/v1/referrals
GET    /api/v1/claims
GET    /api/v1/financial
GET    /api/v1/reports
```

The exact endpoints must be aligned with the existing backend.

Do not invent duplicate backend functionality if an existing endpoint already provides it.

---

# 60. API Base URL

Centralize the API base URL.

Example:

```env
VITE_API_BASE_URL=https://api.cybernetsystems.ng
```

or the equivalent configuration for the current framework.

Never scatter:

```text
https://api.cybernetsystems.ng
```

throughout individual components.

---

# 61. Environment Configuration

Use environment/configuration variables for:

```text
API_BASE_URL
APPLICATION_MODE
DEPLOYMENT_TYPE
INSTALLATION_ID
ORGANIZATION_BOOTSTRAP_KEY
```

Only values that are safe for the client may be exposed.

No private secrets.

---

# 62. What Must Never Be Duplicated Per Customer

Do NOT create separate business logic for:

```text
ABC HMO
XYZ HMO
PQR HMO
```

The application should be:

```text
One codebase
+
Dynamic organization configuration
+
Backend tenant isolation
```

This is what makes the product scalable.

---

# 63. What Can Be Customized Per Customer

The platform should support:

- Logo
- Organization name
- Short name
- Colors
- Favicon
- Address
- Contact
- Website
- Tagline
- Login message
- Logout message
- Support details
- Report header
- Document footer
- Optional background image
- Feature flags where supported
- Organization-specific modules/permissions

---

# 64. Future White-Label Expansion

The architecture should leave room for deeper white-labeling later.

Potential future features:

```text
Custom domain
Custom email templates
Custom SMS sender
Custom PDF templates
Custom report templates
Custom login page
Custom dashboard widgets
Custom terminology
Custom notification branding
Custom mobile app branding
Custom desktop installer branding
```

These should be configuration-driven rather than requiring source-code forks wherever possible.

---

# 65. Recommended Commercial Architecture

The final product should effectively be:

```text
                    IX2 PLATFORM
                         |
                 api.cybernetsystems.ng
                         |
          ┌──────────────┼──────────────┐
          |              |              |
          v              v              v
       ABC HMO        XYZ HMO        PQR HMO
          |              |              |
          v              v              v
     Web/Desktop     Web/Desktop     Web/Desktop
       Client          Client          Client
          |              |              |
          +--------------+--------------+
                         |
                  Shared API Platform
```

Each HMO experiences:

```text
"OUR HMO SOFTWARE"
```

while the business maintains:

```text
ONE PLATFORM
ONE CODEBASE
ONE API
ONE CENTRAL DEVELOPMENT PIPELINE
```

---

# 66. Acceptance Criteria

The implementation is not complete until all of the following work.

## Organization

- [ ] Organization can be registered through the registration workflow
- [ ] Organization uniqueness is enforced by backend
- [ ] Organization verification is server-side
- [ ] Organization activation is server-side
- [ ] Organization configuration can be retrieved by the client

## Branding

- [ ] Organization logo loads dynamically
- [ ] Organization name loads dynamically
- [ ] Organization contacts load dynamically
- [ ] Organization colors load dynamically
- [ ] Browser title is organization-specific
- [ ] Favicon can be organization-specific
- [ ] Dashboard identifies the organization
- [ ] Reports identify the organization
- [ ] Logout page identifies the organization
- [ ] No inappropriate generic platform branding appears in the customer workspace

## Authentication

- [ ] Login works
- [ ] Session persistence works
- [ ] Token/session refresh works
- [ ] Logout works
- [ ] Session expiry works
- [ ] Revoked accounts are blocked
- [ ] Suspended organizations are blocked
- [ ] Logout does not destroy organization installation context

## Tenant Isolation

- [ ] Organization A cannot access Organization B's records
- [ ] Frontend organization IDs cannot bypass backend authorization
- [ ] Cached organization data is cleared on logout
- [ ] Backend derives organization context from authenticated identity
- [ ] Organization switching is not available by default

## Deployment

- [ ] Web deployment can bind a domain to an organization
- [ ] Desktop deployment can bind an installation to an organization
- [ ] Same codebase supports multiple organizations
- [ ] API base URL is centralized
- [ ] No private backend credentials exist in the client

---

# 67. Final Design Philosophy

The application must not feel like:

> "You are using a shared IX2/MEDIX SaaS application."

It should feel like:

> "You are using your HMO's own healthcare management system."

Technically, the platform remains centralized.

Commercially, each customer receives a dedicated experience.

The correct mental model is:

```text
CENTRALIZED TECHNOLOGY
        +
ORGANIZATION-SPECIFIC IDENTITY
        +
STRICT TENANT ISOLATION
        +
CUSTOMER-SPECIFIC DEPLOYMENT
        =
SALEABLE ENTERPRISE HMO SOFTWARE
```

---

# 68. Instruction to the Code Editor AI

Before changing code:

1. Inspect the existing client application structure.
2. Inspect the current authentication implementation.
3. Inspect the existing API client.
4. Inspect existing organization/tenant-related code.
5. Inspect current routing.
6. Inspect current login/logout behavior.
7. Inspect current branding implementation.
8. Identify any hard-coded MEDIX/IX2/customer identity.
9. Identify where organization context is currently stored.
10. Identify existing API endpoints before creating new abstractions.

Then prepare an implementation plan.

Do not blindly rewrite the application.

Do not duplicate existing services.

Do not create unnecessary files if an existing service/context can be extended.

---

# 69. Implementation Priority

Implement in this order:

### Phase 1 — Organization Bootstrap

- Organization bootstrap service
- Installation identity
- Organization context
- Public organization configuration
- Branding initialization

### Phase 2 — Authentication

- Login
- Session restoration
- Token refresh
- Authentication guard
- Logout
- Session expiry

### Phase 3 — White Label

- Logo
- Name
- Colors
- Favicon
- Browser title
- Header
- Sidebar
- Dashboard
- Public landing
- Logout page

### Phase 4 — Tenant Isolation

- API context
- Permission handling
- Cache isolation
- Organization-aware queries
- Error handling

### Phase 5 — Registration

- Registration wizard
- Organization details
- Corporate details
- NHIA details
- Administrator
- Review
- Submission
- Backend integration

### Phase 6 — Deployment

- Web domain binding
- Desktop installation binding
- Environment configuration
- Version detection
- Installation status

### Phase 7 — Existing HMO Modules

Integrate the existing HMO functionality without breaking:

- Enrollees
- Providers
- Preauthorization
- Referrals
- Claims
- Vetting
- Financials
- Reports
- Staff
- Administration
- Notifications

---

# 70. Final Instruction

Build this as a **commercial, production-ready, white-label HMO client application**.

The customer organization must be the visible identity of the application after installation/bootstrap.

The backend at:

`https://api.cybernetsystems.ng`

is the centralized infrastructure and system of record.

The client must never compromise tenant isolation.

The client must never expose another organization's data.

The client must never depend on hard-coded organization branding.

The client must never use frontend organization identifiers as the authorization boundary.

After logout, the user must be returned to a **beautiful organization-specific public logout/login experience**, displaying the organization's own logo, name, contact information and branding.

The result should be suitable for distributing as:

- Customer-specific web deployment
- Customer-specific ZIP deployment
- Customer-specific Windows EXE
- Future customer-specific mobile application

while maintaining:

**ONE CODEBASE + ONE API PLATFORM + MANY ORGANIZATIONS + STRICT DATA ISOLATION + CUSTOMER-SPECIFIC BRANDING.**

Do not expose internal architecture unnecessarily to the customer.

Do not display "MEDIX HMO Portal" or another generic platform identity where the customer expects to see their own software.

The objective is not merely to make a multi-tenant application.

The objective is to make a **multi-tenant technology platform that presents itself as a dedicated HMO product for each customer.**
