# MEDiX HMO Backend Implementation Prompt

**Audience:** Backend/API implementer for the Laravel service at `C:\Users\DELL\Desktop\IX2 App\IX2 App\IX2 App`  
**Priority:** Verify the implemented backend against the supplied MEDiX Frontend Integration Walkthrough and the concrete route contract copied into `MEDiX_HMO_FRONTEND_IMPLEMENTATION_PROMPT.md`. Fix verified gaps and publish a tested contract; do not duplicate working backend features. The frontend integrates only against verified behavior.  
**Release target:** Web-first, one MEDiX codebase and one central API serving multiple HMO deployments. Windows installer work is deferred.

## Objective

Implement the backend side of the MEDiX commercial deployment plan. Customers must receive an organization-specific HMO experience while the backend remains authoritative for identity, deployment resolution, authentication, registration, tenant isolation, and trial status.

Treat this document together with [`MEDiX_HMO_Interface_Commercial_Deployment_Prompt_Consolidated.md`](MEDiX_HMO_Interface_Commercial_Deployment_Prompt_Consolidated.md) as the source requirements. The decisions in this prompt resolve conflicts with that source:

- New HMO registration proceeds automatically only after successful CAC verification, applicant confirmation, and a non-duplicate check. There is no manual organization-approval gate in this release.
- If the verified CAC already belongs to an organization, do not create a second organization or reveal the existing organization’s identity or details. Return a safe “already registered” outcome and provide the staff-login path.
- The applicant’s public website is checked best-effort only. A failed or unavailable website check must not block registration and does not establish portal-domain ownership.
- `https://med-max-hmo.vercel.app/` is the shared initial app URL. The backend must issue an opaque activation context/link so the shared hostname can resolve the correct HMO without accepting an arbitrary client-supplied organization ID.
- HMO-owned portal domains remain supported, subject to a separate domain configuration/verification process.
- The native Windows installer and desktop activation are deferred. Do not build them in this phase.

## Required First Step: Inspect, Then Plan

Before modifying code or schema, inspect the current backend and database. Do not infer schema from documentation or create duplicate tables/services.

Inspect at minimum:

- Current Laravel version, API route groups, middleware aliases, response envelope conventions, authentication guards, and exception handling.
- Current migrations and actual database schema for HMOs, users, organization membership/roles, installations, licenses, branding/settings, and registration-related data.
- `AuthController::registerHmo`, login, logout/session handling, and `validateInstallation`, or their current equivalents.
- `HmoRegistrationService::createHmoWithAdmin`, or the current organization provisioning service.
- Existing HMO, Installation, License, User, role/permission models and tenant scopes.
- All current HMO API controllers and resource ownership checks, including routes for enrollees, providers, code requests, referrals, claims, vetting, billing/financials, reports, staff, permissions, notifications, settings, and private documents.
- Existing CAC/Kora/NHIA integrations, queues/jobs, document storage, audit mechanisms, and environment/configuration practices.
- Existing tests, factories, test database configuration, and transaction behavior.

Before implementation, produce a short `REUSE / MODIFY / CREATE / DEPRECATE` inventory, identify verified schema facts, list migration risks, and state which backend findings remain unverified. Reuse existing organization identity and installation/license foundations wherever they fit. Do not create a second HMO or deployment identity system.

The frontend integration walkthrough supplies these concrete routes and header; verify them against the live Laravel routes/controllers before changing code:

- `GET /api/v1/client/bootstrap`
- `POST /api/v1/auth/hmo-registration/drafts`
- `POST /api/v1/auth/hmo-registration/drafts/{draft}/cac`
- `POST /api/v1/auth/hmo-registration/drafts/{draft}/confirm`
- `POST /api/v1/auth/hmo-registration/drafts/{draft}/submit`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/user`
- `POST /api/v1/auth/logout`
- Shared-host context header: `X-MEDiX-Activation-Context: <opaque-backend-issued-token>`.

Treat the supplied guide as the intended integration contract, not proof that every operation is correctly implemented. If current backend paths or semantics differ, report and reconcile the contract with the frontend owner rather than silently shipping an incompatible API. Preserve verified working functionality and make only necessary changes.

## Implementation Workstreams

### 1. Public Deployment Bootstrap and Resolution

Verify or implement `GET /api/v1/client/bootstrap` using the supplied integration contract. For a configured HMO portal domain, resolve from the validated request host. For the shared Vercel host, resolve using `X-MEDiX-Activation-Context: <opaque-backend-issued-token>`. Confirm the response schema and `Cache-Control: no-store` behavior against the walkthrough and keep them synchronized if changes are needed.

Bootstrap must resolve an active deployment using one of these trusted contexts:

1. A normalized, configured HMO portal host/domain mapped server-side to a deployment and organization.
2. A valid opaque activation context issued by the backend for the shared Vercel host.

Do not let the client select a tenant by submitting `organization_id`, `hmo_id`, or an equivalent arbitrary identifier. The opaque context must be generated using cryptographically secure randomness, stored safely (prefer a hash at rest when it is a bearer secret), scoped to one deployment, and have documented expiry, revocation, and recovery behavior. Decide and document whether it is one-time or reusable. Avoid logging bearer values.

Return only an explicit allowlist of public information, such as organization display/legal name, short name, public logo/favicon URLs, public colors, address, phone, email, website, support contact, tagline, and deployment status. Do not return internal numeric IDs, private membership data, protected settings, documents, CAC provider credentials/raw response, or another organization’s data.

Handle unknown, invalid-context, suspended, expired, and not-yet-active deployments with stable machine-readable error codes and customer-safe messages. Do not expose database IDs, stack traces, SQL errors, licensing internals, or service names. Define caching headers so stale bootstrap data cannot keep a suspended deployment active and so tenant configuration is not cached across hosts.

For customer-owned domains, normalize hostnames safely and define a domain-assignment/verification lifecycle. A successful HTTP request to the organization’s public website is not proof of domain ownership. Keep the official website reachability probe separate from portal-domain validation.

### 2. Registration, CAC/Kora, and Provisioning

Replace the current immediate, unverified registration behavior (inspect `AuthController::registerHmo` and `HmoRegistrationService::createHmoWithAdmin`) with a server-owned registration lifecycle. The browser must not be able to create an active organization or mint its own admin membership by posting arbitrary status/tenant fields.

Support the six conceptual UI steps through backend capabilities:

1. Organization information.
2. CAC corporate registration information and explicit verification consent.
3. Separate NHIA accreditation information.
4. Initial administrator information.
5. Review/confirmation of submitted and verified details.
6. Submission/provisioning result.

Verify or implement the supplied draft workflow routes: `POST /api/v1/auth/hmo-registration/drafts`, `POST /api/v1/auth/hmo-registration/drafts/{draft}/cac`, `POST /api/v1/auth/hmo-registration/drafts/{draft}/confirm`, and `POST /api/v1/auth/hmo-registration/drafts/{draft}/submit`. Verify request/response envelopes and document any changes for the frontend. Backend state names may differ, but must preserve the business meaning below.

#### CAC verification requirements

- Call Kora only from server-side code. Do not put Kora credentials, private headers, or provider URLs/secrets in the browser bundle or a desktop artifact.
- Confirm Kora’s current production API contract at implementation time. The consolidated product prompt references `POST https://api.korapay.com/merchant/api/v1/identities/ng/cac`, but do not assume request fields or response fields without checking the current official contract.
- Keep credentials in server environment/secret configuration; provide an example env key name in backend setup documentation but never commit a real secret.
- Obtain and record explicit, meaningful applicant consent before making the verification request. Consent wording requires business/legal approval; do not fabricate consent or silently set a consent flag.
- Normalize the provider result into MEDiX-owned fields. Persist only fields needed for registration, audit, reconciliation, and legal retention. Do not copy the raw provider response into the primary HMO record. If raw provider data is retained for audit, restrict access, retention, and serialization.
- Distinguish at least `INVALID_VERIFICATION_DATA`, `VERIFICATION_PROVIDER_UNAVAILABLE`, `VERIFICATION_PROVIDER_ERROR`, `INTERNAL_VERIFICATION_ERROR`, and `MANUAL_REVIEW_REQUIRED` internally. Return safe public error codes/messages; never expose raw provider errors or secrets.
- Normalize legal names for case, spacing, punctuation, and common legal suffix formatting. Return the verified legal name and relevant normalized company facts for applicant confirmation. Block or safely route material mismatches; do not treat materially different entities as equivalent.
- Store a verification record with provider, reference, submitted identifier/name, verified name, status, timestamps, and a minimal response summary, using current schema conventions or an additive migration after schema inspection.
- Enforce duplicate CAC uniqueness against the main database, including concurrency/race conditions. A duplicate must not create a second active HMO. Do not disclose another organization’s name, status, contact information, internal ID, or membership. Return a generic conflict/result code that allows the UI to direct the applicant to staff login without confirming which organization matched.
- Recheck uniqueness inside the provisioning transaction, protected by an appropriate unique constraint or locking strategy where supported. Make retries/idempotency safe so client retries cannot create duplicate organizations or administrators.

#### NHIA and documents

CAC verifies corporate identity only; it does not establish NHIA accreditation or regulatory status. Store NHIA accreditation number/type/status/dates/evidence separately from CAC verification. Do not label an HMO NHIA-accredited based only on CAC. Define which NHIA fields are informational and which require review before showing verified/accredited status. Store uploaded evidence using existing private, organization-scoped document patterns; do not expose private files through public bootstrap.

#### Provisioning transaction

After successful Kora verification, applicant confirmation, and a non-duplicate CAC check, provision the new customer immediately; there is no manual organization-approval stage. Use a database transaction and the existing service/model patterns. The transaction must create or bind, as appropriate:

- Immutable organization/HMO UUID and organization profile.
- The initial administrator and organization membership with least-privilege, approved default administrative permissions.
- Public branding/configuration defaults based only on submitted public organization details.
- A web deployment record and configured status.
- Minimal server-owned trial metadata (edition, start, expiry, status) with a duration selected by the product owner; the frontend is never authoritative for trial validity.
- An opaque activation context/link for the shared Vercel app, scoped to the new deployment.
- CAC verification and separate NHIA records, plus any required document ownership references.

If any required provisioning step fails, roll back the transaction so the system does not leave an active organization without its deployment/admin/verification state. If external storage or email cannot participate in the database transaction, use an explicit state machine/outbox/compensation strategy and make retry behavior idempotent. Do not email passwords or log activation secrets. Define secure delivery/recovery of the activation link and avoid putting long-lived bearer secrets in analytics/referrer logs.

The website reachability probe should run asynchronously or with strict timeout/size limits, persist only the result and timestamp if needed, and never prevent successful registration. It must not fetch arbitrary user-selected URLs without SSRF protections: validate schemes/hosts, block private/link-local/reserved IP ranges after DNS resolution, defend against redirects to blocked addresses and DNS rebinding, limit redirects/response bytes/time, and avoid forwarding credentials. If robust SSRF-safe probing cannot be delivered in this slice, omit the network probe and record that limitation rather than shipping an unsafe fetcher.

### 3. Deployment-Bound Authentication and Session Behavior

Verify or implement `POST /api/v1/auth/login`, `GET /api/v1/auth/user`, and `POST /api/v1/auth/logout` as described in the supplied integration walkthrough. Login on the shared host receives `X-MEDiX-Activation-Context`; customer-domain login resolves the deployment from the validated host. Authenticate the submitted human credentials only if that user is an active member of the resolved organization/deployment under backend policy. If valid credentials belong to another HMO, return only the same generic response as invalid credentials, such as `Invalid username or password`. Do not reveal whether an email exists or which organization it belongs to.

Preserve current authentication mechanisms where they are sound, and document how deployment context is conveyed (host, opaque activation context, or server-side deployment session) without trusting client tenant IDs. Do not use `user_id` as deployment identity or an installation UUID as human authentication. The frontend is web-first; desktop installation registration is deferred.

Logout must revoke or invalidate server-side authentication when supported, and return/retain only the public deployment context needed for the branded public login screen. Ensure token/session errors are generic and protected API requests still derive organization scope from the authenticated user and resolved deployment.

### 4. Tenant Isolation Audit

Audit every protected HMO API route, not only list endpoints. For each resource, verify both collection scoping and ownership of individual IDs, nested relationships, exports, downloads, counts, aggregates, and mutation side effects. Cover at least enrollees, providers/HCPs, provider contracts, preauthorization/code requests, authorization codes, referrals, claims, vetting, finance/settlements, reports, staff/users, roles/permissions, notifications, settings, and private documents.

The backend is authoritative. Ignore or reject client-supplied organization identifiers for authorization, including `hmo_id`/`organization_id` in request bodies or query parameters. Preserve existing behavior where ownership checks are correct; fix only verified gaps. Add two-tenant tests proving one HMO cannot enumerate, read, update, delete, export, or infer another HMO’s data. Test guessed IDs and forged tenant fields, not just happy-path role checks.

### 5. Migrations, Configuration, and Operational Safety

- Inspect actual schema and migration history before adding/changing migrations; avoid duplicate tables and destructive changes.
- Keep migrations additive and reversible where practical. Document data backfill and deployment order if needed.
- Add config validation for required Kora credentials and central API/deployment settings. Production must fail safely without secrets; local/test modes must support mocked Kora clients without real network calls.
- Use timeouts, bounded retries, safe logs, request correlation IDs, rate limiting/abuse controls appropriate for public registration/verification, and audit events without PII/secrets in logs.
- Do not log passwords, tokens, raw Kora credentials, activation bearer links, full identity documents, or unnecessary CAC response data.
- Use queues for slow external calls only if the resulting user-facing verification lifecycle and idempotency are explicit and testable.

## API Contract Deliverable (Required Before Frontend Integration)

Publish a backend-owned contract document in the backend repository and provide it to the frontend implementer. It must state the actual route paths and HTTP methods, authentication/middleware, request schemas, response envelopes, field nullability/types, status codes, stable error codes, retry behavior, idempotency behavior, and example success/failure payloads for:

- Bootstrap by configured host and by opaque activation context.
- Registration draft/create/update as needed.
- CAC verification initiation/result and applicant confirmation.
- Duplicate verified-CAC outcome and safe staff-login direction.
- NHIA information/evidence submission.
- Final registration submission and provisioning result.
- Activation-link issuance/resolution, expiry/recovery/revocation.
- Deployment-bound login, session restoration/current-user, and logout.
- Unknown, suspended, expired, malformed, and unavailable deployment states.

Do not require the frontend to infer schemas from Laravel resources or trial-and-error. If route names above differ from the actual application, publish the actual implementation contract. Include OpenAPI updates if that is the project convention.

### Supplied walkthrough details to verify

The frontend walkthrough gives the following concrete request details. Verify these against the backend and include final examples in the published contract:

- Draft creation sends `organization`, `administrator`, `nhia`, and `idempotency_key` to `POST /api/v1/auth/hmo-registration/drafts`. The example administrator object contains name, email, and password. Never persist the plaintext password in a registration draft; retain it only ephemerally until provisioning, then hash using the existing authentication mechanism. If the current design needs a recoverable draft, redesign that contract so no plaintext password is retained.
- CAC verification sends `{ "cac_number": "...", "consent": true }` to `/api/v1/auth/hmo-registration/drafts/{draft}/cac`. Reject false/missing consent before any Kora call. The supplied examples include `VERIFICATION_PROVIDER_UNAVAILABLE` and `DUPLICATE_REGISTRATION`.
- Applicant confirmation uses `/api/v1/auth/hmo-registration/drafts/{draft}/confirm`; the supplied walkthrough does not specify a body. Define whether an empty POST is sufficient or a required explicit confirmation field is needed, and align the frontend contract.
- Final submit uses `/api/v1/auth/hmo-registration/drafts/{draft}/submit`; the example response contains `success`, `deployment.uuid`, `deployment.status`, `activation_context`, and `message`.
- Bootstrap returns `deployment` (`uuid`, `status`, `trial.edition`, `trial.expires_at`) and `organization` public fields (`name`, `short_name`, `logo_url`, `favicon_url`, `colors`, `address`, `phone`, `email`, `website`, `support_contact`, `tagline`, `deployment_status`) and sends `Cache-Control: no-store`.
- Login is `POST /api/v1/auth/login` with email/password and the shared-host activation header when applicable. Current-user and logout paths are `GET /api/v1/auth/user` and `POST /api/v1/auth/logout`. Wrong-HMO and wrong-password failures must be indistinguishable.

### Verified implementation gaps to address

The Laravel routes were checked against the supplied walkthrough. The route names are registered, but the integration is not release-ready until these observed gaps are fixed and regression-tested:

- The configured local API currently returns HTTP 500 HTML for `GET /api/v1/client/bootstrap` without context because the connected MySQL database is missing `hmo_deployments` (`SQLSTATE[42S02]`). Apply/repair the intended migration through the normal reviewed deployment process; convert all unexpected errors into safe JSON responses and never expose SQL/debug output to clients. Do not run migrations blindly against customer or production data.
- The public bootstrap path has no neutral first-visit response for the shared host without activation context. Define a safe way to reach public registration before an HMO deployment exists; do not fabricate a tenant context.
- Duplicate CAC detection occurs at final submit rather than the CAC verification step in the walkthrough. Align the documented UI contract with the implemented behavior or move the safe duplicate check earlier; keep a final transactional uniqueness check to protect against races.
- Invalid-password responses currently differ from missing/wrong-deployment responses (`Invalid login credentials` versus `Invalid username or password`). Normalize them to the same status/body/message so organization membership cannot be inferred.
- The login validator accepts an activation context in the JSON body, but deployment resolution reads the `X-MEDiX-Activation-Context` header. Make the contract unambiguous and ensure header-based shared-host resolution works consistently.
- Final submit returns activation context but does not establish an authenticated administrator session. The walkthrough frontend therefore must perform the documented login call afterward. Keep this behavior explicit unless the contract is intentionally changed.

Resolve these integration ambiguities as backend-owned contract decisions before frontend release:

1. The activation context is returned in JSON and is also required in a header, while the walkthrough prohibits URL-query transport and insecure persistence. Specify a secure first-delivery and reload mechanism end-to-end, including whether the API sets a suitable secure cookie or provides a short-lived exchange flow. Document CORS/cookie requirements for the shared Vercel host. Do not rely on localStorage by default, and never log the context.
2. The shared-host bootstrap needs a deployment context, but a first-time visitor needs to reach public registration before an HMO deployment exists. Define how the neutral/public registration entry point is served without exposing or guessing a tenant.
3. A duplicate response must not reveal the existing HMO, but the applicant should be routed to staff login for that HMO. Define a privacy-preserving backend-supported login resolution mechanism; do not require the client to infer the existing organization from CAC or email.
4. The walkthrough shows final submit returning activation context but does not say whether it creates an authenticated session. Define whether the frontend must subsequently call `/api/v1/auth/login` and how the deployment context is attached.
5. Define exact status codes and error body schemas for validation, consent rejection, invalid CAC, mismatch, provider outage, duplicate, expired draft, invalid activation context, and deployment status failures. Keep provider/private details out of customer-facing responses.

## Required Tests and Acceptance Criteria

Add focused automated tests using the project’s current test framework and isolated database/configuration. Do not run tests against production or real customer data.

### Deployment/bootstrap

- A verified customer domain resolves only its assigned active deployment.
- The shared Vercel host resolves an HMO only with a valid opaque activation context; missing, malformed, expired, revoked, or cross-deployment contexts fail safely.
- Activation context has adequate entropy, is scoped correctly, is not returned in logs, and follows documented one-time/reusable semantics.
- Bootstrap returns only allowlisted public fields and never private organization, user, CAC, or protected data.
- Unknown, suspended, expired, and unconfigured deployments have stable safe errors and correct non-cache behavior.
- Host normalization rejects malformed/untrusted host forwarding and does not allow arbitrary host-header tenant switching.

### Registration/CAC/provisioning

- Consent is explicit and persisted before Kora is called; absent consent causes no provider request.
- Valid Kora result returns normalized data and requires applicant confirmation before provisioning.
- Invalid input, provider unavailable, provider error, internal error, and material name mismatch have distinct internal handling and safe public responses.
- Provider secrets/raw errors never reach API response or logs.
- Duplicate verified CAC returns the safe duplicate path, creates no second organization/admin/deployment/trial, and reveals no existing organization details.
- Concurrent duplicate attempts cannot both provision the same verified CAC.
- A new verified/confirmed CAC provisions HMO UUID, admin membership/permissions, branding, deployment, activation context, verification/NHIA references, and trial metadata consistently.
- Provisioning failure rolls back or follows the documented recoverable state without an apparently active partial tenant.
- NHIA remains independent of CAC; CAC success alone never produces an NHIA-verified state.
- Public website probe timeout/failure does not block registration. If probing is implemented, include SSRF/redirect/private-address/timeout/size tests.
- Retries and repeated submit/confirm calls are idempotent or safely rejected.

### Authentication and isolation

- Correct user for the resolved deployment can authenticate.
- Credentials for another organization and invalid credentials return indistinguishable generic responses.
- User/session restoration is deployment-compatible; expired/invalid sessions are rejected without leaking identity.
- Logout invalidates authentication and preserves only public deployment resolution.
- ABC cannot enumerate/read/mutate/export XYZ resources across all audited resource families, including by guessing resource IDs or forging organization fields.
- Existing correct tenant scopes and HMO module behavior remain intact.

## Backend Completion Handoff

Do not mark the backend work complete until all are delivered:

1. `REUSE / MODIFY / CREATE / DEPRECATE` inventory with verified schema facts.
2. Implemented backend changes and migrations with rollback/deployment notes.
3. Published API contract required above, with final route paths and sample payloads.
4. Kora setup notes listing configuration variable names only (no secrets), current contract reference/date, and mocked local/test setup.
5. Focused registration, bootstrap, deployment, auth, and two-tenant isolation test results.
6. Known gaps/release gates, including approved consent wording, NHIA review semantics, activation-link delivery/recovery, customer portal-domain verification, and trial duration if not resolved.
7. A clear signal to the frontend implementer that the contract and test environment are ready. Frontend work must not guess or implement backend behavior independently.

## Explicitly Deferred

- Windows installer/desktop activation and installation registration.
- Per-customer source copies, generated customer-specific application packages, or customer-specific EXEs.
- Subscription billing, full licensing enforcement, device revocation, offline grace policy, version enforcement, refresh-token redesign, and desktop tamper resistance.
- Manual organization review/approval after successful CAC verification; this conflicts with the agreed automatic provisioning decision.
- Any rewrite of functioning HMO operational business logic not required to fix a verified tenant/security defect.
