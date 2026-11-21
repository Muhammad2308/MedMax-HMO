# MEDiX Backend-to-Frontend Alignment Prompt

**Audience:** Laravel backend implementer for `C:\Users\DELL\Desktop\IX2 App\IX2 App\IX2 App`  
**Purpose:** Align the implemented API and database with the frontend integration already implemented in the MEDiX HMO Next.js app. This is a focused alignment/fix task, not a request to rebuild backend features that already work.  
**Frontend contract source:** `docs/MEDiX_HMO_FRONTEND_IMPLEMENTATION_PROMPT.md` and the in-repo API modules/components listed below.  
**Release scope:** Web-first; no Windows installer or desktop activation in this task.

## Objective

Make the Laravel backend reliably satisfy the actual browser requests and response shapes used by the frontend. Verify the current implementation first, preserve correct behavior, and fix only confirmed gaps. The backend remains authoritative for deployment identity, tenant authorization, registration state, CAC verification, provisioning, and trial status.

The frontend already calls the draft registration API, bootstraps deployment branding, sends the opaque activation context header, performs login after provisioning, and gates protected screens on bootstrap. Do not create a competing API or change route names/payloads without coordinating a synchronized frontend contract change.

## Existing Frontend Contract

The frontend API base URL is `NEXT_PUBLIC_API_BASE_URL` and is expected to include `/api/v1`. API wrappers use these relative paths and consume direct JSON response bodies as documented here; do not wrap these responses in the HMO operational `{ success, message, data, meta }` envelope unless both frontend types and code are changed and verified together.

### 1. Deployment bootstrap

`GET /api/v1/client/bootstrap`

The frontend calls this on configured customer domains without a tenant ID. On the shared Vercel host, it calls only when it has the backend-issued activation context and sends:

```http
X-MEDiX-Activation-Context: <opaque-backend-issued-token>
```

Expected success body:

```json
{
  "deployment": {
    "uuid": "public-uuid",
    "status": "active",
    "trial": {
      "edition": "trial",
      "expires_at": "2030-01-01T00:00:00+00:00"
    }
  },
  "organization": {
    "name": "Example HMO",
    "short_name": null,
    "logo_url": null,
    "favicon_url": null,
    "colors": [],
    "address": null,
    "phone": null,
    "email": null,
    "website": null,
    "support_contact": null,
    "tagline": null,
    "deployment_status": "active"
  }
}
```

Return only these public fields. Include `Cache-Control: no-store` on success and failure. Return safe JSON errors, for example `DEPLOYMENT_NOT_FOUND` or `INVALID_DEPLOYMENT_CONTEXT`; never return HTML debug pages, SQL details, stack traces, or internal IDs.

### 2. Create a registration draft

`POST /api/v1/auth/hmo-registration/drafts`

This request is public and intentionally does not require bootstrap or an existing HMO context so an unrecognized first-time visitor can begin registration on the shared host. The client body is:

```json
{
  "organization": {
    "name": "BrightCare HMO",
    "email": "hello@brightcarehmo.com",
    "phone": "+2348000000000",
    "state": "Lagos",
    "city": "Ikeja",
    "address": "1 Marina Road, Lagos",
    "website": "https://brightcarehmo.com"
  },
  "administrator": {
    "name": "Ada Okafor",
    "email": "ada@brightcarehmo.com",
    "password": "<entered-in-memory>"
  },
  "nhia": {
    "accreditation_number": "NHIA-12345",
    "status": "pending_review"
  },
  "idempotency_key": "<browser-generated-uuid>"
}
```

The administrator password is sent because submit does not establish a session and the frontend later logs in with these credentials. Never store or log it in plaintext. If held by the draft, encrypt it using the backend's approved encryption/key-management mechanism, restrict draft access, expire drafts, and decrypt only inside the trusted provisioning path before immediately hashing with the existing Laravel authentication hasher. Never return the password in any response. Do not alter request semantics without coordinating a frontend update.

Expected success body is direct JSON:

```json
{
  "draft_id": "<uuid>",
  "state": "draft",
  "cac": { "status": null, "verified_name": null }
}
```

The endpoint must support the documented idempotency key so a network retry does not create multiple drafts. It must not create an active HMO, deployment, or administrator yet.

### 3. Verify CAC with explicit consent

`POST /api/v1/auth/hmo-registration/drafts/{draft}/cac`

Body:

```json
{ "cac_number": "RC1234567", "consent": true }
```

The frontend shows an unchecked consent control and sends this request only after the applicant accepts. Reject missing/false consent before calling Kora. Kora is server-only; the browser never receives credentials or calls Kora directly.

Expected success body is direct JSON:

```json
{
  "draft_id": "<uuid>",
  "state": "verified",
  "cac": {
    "status": "verified",
    "verified_name": "BRIGHTCARE HEALTH LIMITED"
  }
}
```

Normalize Kora outcomes into safe public error objects. At minimum support the frontend's `VERIFICATION_PROVIDER_UNAVAILABLE` retry state and safe `DUPLICATE_REGISTRATION` result. The current implementation reportedly detects duplicates at submit rather than CAC verification; either move a privacy-safe duplicate check earlier or keep submit as the authoritative final check and ensure both stages return consistent codes. The frontend handles `DUPLICATE_REGISTRATION` at either stage.

### 4. Applicant confirmation

`POST /api/v1/auth/hmo-registration/drafts/{draft}/confirm`

The current frontend sends an empty POST body after the applicant reviews the returned verified legal name. Accept the empty body and perform confirmation server-side, or coordinate an explicit body change with the frontend before deploying it. Do not provision at this step.

Expected direct response:

```json
{
  "draft_id": "<uuid>",
  "state": "confirmed",
  "cac": {
    "status": "verified",
    "verified_name": "BRIGHTCARE HEALTH LIMITED"
  }
}
```

Reject confirmation if CAC is not verified or the draft is expired/invalid.

### 5. Final submit/provisioning

`POST /api/v1/auth/hmo-registration/drafts/{draft}/submit`

The frontend calls this only after confirmation. New organizations are provisioned immediately only after successful CAC verification, applicant confirmation, and a final duplicate check. Do not create an approval queue for this agreed release. Keep the final duplicate check inside the transaction and protect concurrent attempts.

Expected success body is direct JSON:

```json
{
  "success": true,
  "deployment": {
    "uuid": "deploy-uuid-123",
    "status": "active"
  },
  "activation_context": "<opaque-backend-issued-token>",
  "message": "Registration completed. Keep the activation context private."
}
```

Provision HMO UUID/profile, initial administrator and organization membership/permissions, branding defaults, web deployment, minimal server-authoritative trial metadata, CAC verification and separate NHIA data atomically or through an explicit recoverable state machine. Do not let client status or tenant fields set the HMO/deployment active.

The frontend stores the returned activation context in `sessionStorage`, then calls bootstrap and login. It sends the value in `X-MEDiX-Activation-Context` on subsequent API requests. This is a bearer value accessible to same-origin JavaScript; assess XSS/CSP/session risk and coordinate a safer HttpOnly-cookie or exchange design if required, updating frontend and CORS behavior together. Never log or return it except at the documented issuance point.

### 6. Login, current-user, and logout

- `POST /api/v1/auth/login` accepts `{ "email": "...", "password": "..." }`. Shared-host requests include `X-MEDiX-Activation-Context`; configured customer-domain requests rely on the server's validated deployment mapping. The frontend does not submit `hmo_id` or `organization_id`.
- `GET /api/v1/auth/user` uses the Sanctum bearer token for session restoration.
- `POST /api/v1/auth/logout` invalidates the current token/session where supported.

Wrong password, nonexistent account, and valid credentials belonging to a different deployment must be indistinguishable to the client. Return a consistent safe error, with message `Invalid username or password`, same status/body shape, and no membership/org detail. The frontend normalizes 401/403/422 to this message, but backend normalization is required to prevent leakage outside the UI.

The final submit endpoint does not log the administrator in. The frontend calls `/auth/login` afterward using the draft administrator email/password and activation-context header. Keep that behavior explicit unless a coordinated contract change is made.

## Critical Host and CORS Resolution Requirement

Do not assume the central API receives the customer portal hostname as its HTTP `Host` header. In a browser request from `https://portal.customer.ng` to `https://api.cybernetsystems.ng/api/v1/client/bootstrap`, the API request's `Host` is `api.cybernetsystems.ng`; the browser controls the page `Origin` but cannot set the HTTP `Host` header to the portal hostname.

Implement customer-domain resolution using a trusted, verified mechanism, for example:

- Resolve the browser `Origin` against an explicit active-domain allowlist, with strict scheme/host/port normalization and correct CORS policy; do not trust an arbitrary Origin as tenant identity.
- Or use a reverse proxy that injects a canonical original-host field only after stripping untrusted inbound forwarded-host headers and accepting traffic exclusively from trusted proxies.

The current frontend sends `X-MEDiX-Activation-Context`, but does not send a custom `X-MEDiX-Portal-Host` header. Do not require an undocumented custom header. If the frontend must send a new field, define and coordinate it before implementation. For shared Vercel requests, resolve from the activation context header, not from the shared Vercel hostname.

Configure CORS for the intended customer origins and `https://med-max-hmo.vercel.app`. Preflight must allow `Authorization`, `Content-Type`, and `X-MEDiX-Activation-Context`; expose only necessary response headers. If adopting HttpOnly cookies, specify `credentials` behavior, `SameSite`, `Secure`, domain scope, CSRF protections, and exact allowed origins. Do not use wildcard credentialed CORS.

## Verified Backend Gaps Requiring Immediate Resolution

These are observed, not hypothetical:

1. The configured local bootstrap request currently returns HTTP 500 HTML because the connected MySQL database has no `hmo_deployments` table (`SQLSTATE[42S02]`). Inspect migration history and actual schema, apply/repair the intended migration through the normal reviewed deployment process, and ensure API exceptions return safe JSON. Do not run production migrations blindly.
2. Bootstrap without context on the shared host has no neutral tenant response. Registration drafts are public and can be created without bootstrap; preserve that so first-time onboarding works. A no-context bootstrap may return a safe deployment-not-found result, but it must not block the public landing/onboarding pages.
3. Duplicate CAC detection currently happens on final submit, while the walkthrough suggests CAC verification. Align the implementation and published contract. Regardless of timing, retain a final concurrency-safe uniqueness check and never reveal the existing HMO identity.
4. Invalid-password response differs from wrong/missing deployment response. Normalize status and body to a generic error.
5. Login may validate an `activation_context` body field, but deployment resolution reads the header. Make the header the documented source or coordinate a single alternative; do not leave a misleading unused body field.
6. Duplicate registration directs the frontend to `/login`, but the shared host has no existing organization activation context. Design a privacy-preserving login handoff for an existing deployment that reveals no HMO identity and does not allow credentials from another HMO. Coordinate the resulting response/link/context lifecycle with the frontend.
7. Secure activation context delivery/retention needs an explicit decision. The current frontend uses sessionStorage and a custom header; if the backend requires a cookie/exchange flow, coordinate and test the change on both sides.

## Backend Implementation Rules

- Inspect Laravel routes, service/controller behavior, migrations, and the actual database schema before edits. The API routes have been observed to exist, but route registration alone does not prove the schema is applied or runtime behavior is correct.
- Reuse existing HMO, user, Installation, License, role/membership, and verification structures if they fit. Do not create duplicate tenant/deployment identity systems.
- Apply schema changes only after identifying the missing/incorrect migration and checking existing data. Make migrations reviewable, safe for existing records, and reversible where practical.
- Kora credentials remain server secrets. Never commit secrets or place them in frontend/Vercel client configuration.
- Do not trust client organization IDs, registration status, activation status, role, permission, CAC status, or trial status.
- Do not disclose private existing-HMO information through duplicate checks, login errors, bootstrap, or logs.
- Preserve working HMO modules; make only verified security/runtime fixes needed for this contract.

## Required Tests and Acceptance Criteria

### Runtime/API contract

- Bootstrap returns direct JSON with the documented public fields and `Cache-Control: no-store`; unknown/context failures are safe JSON, not HTML debug responses.
- Bootstrap works for a configured HMO portal origin and for the shared host with a valid activation-context header; invalid/missing/expired contexts fail safely.
- Public draft creation works without bootstrap/tenant context and does not provision a tenant.
- All draft/CAC/confirm/submit endpoints accept the exact frontend request bodies and return direct JSON shapes. Empty confirm POST is supported or a coordinated contract change is published.
- CAC consent rejection provably causes no Kora request; provider failures are normalized; secrets/raw errors never appear in responses/logs.
- Duplicate CAC cannot provision duplicates under concurrency and reveals no organization identity. The returned duplicate flow can reach staff login without selecting an arbitrary tenant.
- Final submit returns the activation context exactly once at the defined issuance point, provisions all required records consistently, and does not return plaintext password or private CAC data.
- Login with the shared activation header works; wrong credentials and wrong-deployment credentials have indistinguishable status/body/message.
- Current-user and logout routes work with Sanctum; tenant context cannot conflict with the authenticated token.

### Host, CORS, and tenant isolation

- Test customer-domain resolution using real browser `Origin` behavior or the trusted proxy header configured in deployment. Prove an arbitrary forged Origin/forwarded-host cannot select a tenant.
- CORS preflight allows only approved customer origins and the shared Vercel origin, with required headers; no wildcard credentials.
- ABC credentials cannot read XYZ data. Test collection endpoints, guessed IDs, nested resources, exports/downloads, aggregates, and writes across all protected modules.
- Shared activation context resolves only its assigned deployment; cross-deployment and suspended/expired contexts fail safely.
- Logs contain no passwords, access tokens, activation contexts, Kora secrets, or unnecessary identity data.

### Database/deployment

- The test database and a staging-like MySQL database have all required deployment/registration migrations applied from a clean setup and an upgrade setup.
- Bootstrap no longer raises missing-table SQL errors in the configured local/staging database.
- Migration/deployment notes state prerequisites, backfill/default strategy, and rollback considerations. Do not execute migrations against production without the normal approval process.

## Required Completion Handoff to Frontend

When complete, update the backend API contract and give the frontend implementer:

1. Final route paths, methods, exact request/response JSON, status codes, and error codes.
2. Confirmed context resolution rule for configured customer domains and shared Vercel.
3. Activation context issuance, transport, expiry, revocation, and secure persistence/session requirements.
4. Duplicate response and the safe way to route existing HMO staff to login.
5. CORS and environment requirements, listing secret variable names only.
6. Migration identifiers and staging verification; no secrets or private data.
7. Focused feature/integration test commands and results, including two-HMO isolation tests.
8. Explicit statement that the frontend contract is ready for integration, or a list of remaining blockers.

## Explicitly Deferred

- Windows installer/desktop activation.
- Separate app source, ZIP, or EXE per customer.
- Subscription billing, full license/device revocation, offline grace, and version enforcement.
- Rebuilding functioning HMO operational modules unrelated to a verified contract/security defect.
