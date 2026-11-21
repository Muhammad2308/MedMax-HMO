# MEDiX HMO Frontend Implementation Prompt

**Audience:** Frontend implementer for the Next.js application in this repository.  
**Dependency:** The backend integration contract below has been supplied. Verify it against the implemented backend before integrating; do not invent or silently change endpoint details. If the implementation differs, report the mismatch and update the contract with the backend owner first.  
**Release target:** Web-first, one MEDiX release for multiple HMO deployments. Native Windows installer work is deferred.

## Objective

Implement the MEDiX HMO commercial-deployment experience in the existing frontend. Each customer must see its own HMO identity and be authenticated within the deployment resolved by the backend, while existing HMO operational modules continue working.

Read [`MEDiX_HMO_Interface_Commercial_Deployment_Prompt_Consolidated.md`](MEDiX_HMO_Interface_Commercial_Deployment_Prompt_Consolidated.md) and verify the concrete integration contract in this document against the Laravel implementation before coding. The routes, payloads, headers, and response shapes below are the supplied integration contract. Do not invent endpoint names, payloads, response envelopes, or business transitions. Where an interaction is not specified, report the gap to the backend owner rather than guessing.

## Agreed Product Decisions

- One frontend codebase and one central API serve multiple HMO deployments; do not create a source copy or package per customer.
- Web-first delivery. Do not build the Windows installer or desktop activation flow in this phase.
- A new organization proceeds only after successful server-side Kora CAC verification, applicant confirmation, and a non-duplicate result. There is no manual organization-approval stage in this release.
- If the verified CAC is already registered, do not show another organization’s private data. Present a safe already-registered result and direct the applicant to staff login.
- CAC and NHIA are separate concepts and statuses. CAC success must never be presented as NHIA accreditation.
- The public website reachability check is informational and non-blocking. It is not portal-domain ownership verification.
- The shared app URL is `https://med-max-hmo.vercel.app/`. The backend issues/resolves opaque activation context for the correct deployment. Never derive or accept tenant identity from an arbitrary client-supplied organization/HMO ID.
- The backend is authoritative for deployment status, organization membership, permissions, registration transitions, provisioning, duplicate decisions, and trial validity.

## Required First Step: Read the Backend Contract

Before editing frontend API calls or onboarding behavior:

1. Verify each endpoint below, including the common API origin `/api/v1`, request/response envelopes, and middleware, against the Laravel implementation or its generated API spec.
2. Confirm how activation context is initially delivered without a URL query, how an unrecognized shared-host visitor can access public registration, and how a duplicate applicant reaches the existing deployment's staff login without receiving its private identity.
3. Confirm the exact staff-login route, the confirmation request body (if any), and whether final submit establishes an authenticated session or requires the documented login call afterward.
4. Do not integrate a route that differs from this contract until the backend owner updates the documented API contract. Do not duplicate backend validation, Kora calls, duplicate detection, tenant authorization, or provisioning logic in the browser.

## Supplied Backend Integration Contract

Use the configured central MEDiX API origin plus `/api/v1`. Do not hard-code Kora endpoints or credentials in the frontend. Use the existing API client only after confirming it preserves these response shapes.

### Bootstrap

`GET /api/v1/client/bootstrap`

For a customer portal domain, send the normal request and let the backend resolve the host. For the shared Vercel app, send:

```http
X-MEDiX-Activation-Context: <opaque-backend-issued-token>
```

Never send `organization_id`, `hmo_id`, or an arbitrary tenant selector. The success response contains `deployment: { uuid, status, trial: { edition, expires_at } }` and `organization: { name, short_name, logo_url, favicon_url, colors, address, phone, email, website, support_contact, tagline, deployment_status }`. Nullable fields and examples are specified in the supplied walkthrough. Use only these public fields; no private IDs, member data, CAC data, or internal configuration are exposed. The backend sends `Cache-Control: no-store`; do not cache bootstrap across hosts or contexts. Example errors include `DEPLOYMENT_NOT_FOUND` and `INVALID_DEPLOYMENT_CONTEXT`; use the server's actual codes for other failure states.

### Create registration draft

`POST /api/v1/auth/hmo-registration/drafts`

Submit:

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
		"password": "StrongPassword123!"
	},
	"nhia": {
		"accreditation_number": "NHIA-12345",
		"status": "pending_review"
	},
	"idempotency_key": "hmo-registration-001"
}
```

The example response is `{ "draft_id": "<uuid>", "state": "draft", "cac": { "status": null, "verified_name": null } }`. Use the backend's idempotency semantics. Never persist the administrator password in localStorage/sessionStorage, logs, analytics, or a recoverable draft; retain it only in memory until accepted by the backend.

### CAC verification and confirmation

After the user explicitly accepts consent, call `POST /api/v1/auth/hmo-registration/drafts/{draft}/cac` with:

```json
{ "cac_number": "RC1234567", "consent": true }
```

Consent must be unchecked by default. No verification request may be sent without consent; never call Kora from the browser. Success includes `draft_id`, `state: "verified"`, and normalized `cac.status` / `cac.verified_name`. Handle `VERIFICATION_PROVIDER_UNAVAILABLE` with a retry state. Handle `DUPLICATE_REGISTRATION` without revealing the matching HMO.

After the user reviews and confirms the normalized CAC details, call `POST /api/v1/auth/hmo-registration/drafts/{draft}/confirm`. The supplied success example returns `draft_id`, `state: "confirmed"`, and normalized CAC status/name. No request body is specified: confirm with the backend owner whether an empty body is accepted or an explicit confirmation field is required. Do not guess.

### Final submit and provisioning

After confirmation and completion of the required registration details, call `POST /api/v1/auth/hmo-registration/drafts/{draft}/submit`. Example success response:

```json
{
	"success": true,
	"deployment": { "uuid": "deploy-uuid-123", "status": "active" },
	"activation_context": "<opaque-64-char-token>",
	"message": "Registration completed. Keep the activation context private."
}
```

The activation context is a bearer secret. Do not log it, send it to analytics/tracing, display it in the console, put it in a URL query, or expose it through referrers. Retain it only by the backend-approved secure app/session mechanism, preferably a backend-managed secure cookie/session if implemented. The walkthrough does not specify a browser-safe persistence mechanism for a token returned in JSON; resolve this with the backend owner before persisting it. Do not assume localStorage is secure.

### Deployment-bound authentication

`POST /api/v1/auth/login` accepts `{ "email": "...", "password": "..." }`. On the shared host include `X-MEDiX-Activation-Context` with the active deployment context. Do not submit a tenant ID. Success includes `success`, `message`, `token`, `is_recognized`, `user`, `hmo`, and `provider`. Continue the existing token handling pattern after auditing it; never use response `hmo.id` or user claims as client-side authorization.

Invalid credentials, wrong app, and wrong deployment must render the same `Invalid username or password` message. Restore sessions with `GET /api/v1/auth/user` using the Sanctum token. Log out with `POST /api/v1/auth/logout`. Preserve public deployment context, but clear authentication and all protected React Query data/cache.

### Contract gaps that block affected UI flows

The walkthrough does not define the following. Get a backend answer and update the API contract before implementing these transitions:

- How an unrecognized shared-host visitor can access public registration when bootstrap has no activation context and cannot yet identify an HMO.
- How a duplicate applicant reaches the existing HMO's staff login when the duplicate response reveals no tenant identity and no activation context is described.
- How initial activation context is delivered without a query parameter, and how the context returned by final submit is safely retained across reloads.
- Whether final submit also creates an authenticated session or the frontend must call `/auth/login` afterward.
- The exact confirmation request body, validation/error schemas and status codes, and complete deployment error-code set.

Backend verification has additionally found these implementation mismatches that must not be papered over in the UI:

- Routes exist, but the configured local API's bootstrap currently returns HTTP 500 HTML because its MySQL database lacks the `hmo_deployments` table. The frontend shows a safe generic unavailable state; deployment is blocked until the backend applies/fixes the intended migration and returns safe JSON.
- Duplicate CAC may be returned by final submit rather than CAC verification. Handle `DUPLICATE_REGISTRATION` at both verification and final submit until the backend contract is aligned.
- The backend currently returns a different invalid-password message than the wrong-deployment message. The UI normalizes 401/403/422 credential failures to the generic `Invalid username or password`; the backend still must normalize its response to avoid information leakage outside the UI.
- The backend login resolver reads activation context from `X-MEDiX-Activation-Context`; do not rely on a JSON-body context field.
- The final submit response does not create an authenticated session; use the login operation afterward, as implemented in the registration flow.

Until clarified, use a neutral MEDiX public registration state or leave that transition blocked; never select an HMO from registration fields or response IDs to work around the gaps.

## Frontend Workstreams

### 1. Typed Deployment Bootstrap

Add a typed API layer and deployment/organization context using the backend’s published contract. Bootstrap must be resolved before rendering tenant-specific public/authenticated UI so the user never briefly sees the wrong HMO or generic customer identity.

Support both contract-approved entry paths:

- Customer-owned configured portal domain, resolved by the backend from the request host.
- Shared Vercel app entered through a backend-issued opaque activation link/context.

Treat opaque context as sensitive bearer material unless the backend explicitly documents otherwise. Avoid logging it, storing it in analytics, putting it into external referrers, or exposing it to unrelated API calls. Persist only the minimum backend-approved deployment identity needed for subsequent bootstrap/session restoration. Do not store a client-selected `organization_id` or use it for authorization.

Use explicit loading, retry, and failure states for unknown deployment, invalid/expired activation context, suspended deployment, expired trial, and transient API outage. Render safe customer-facing text from known error codes; never show raw response bodies, stack traces, SQL messages, internal service names, Kora errors, or implementation details. Do not cache deployment bootstrap across different hostnames or activation contexts. Respect server cache/status policy.

### 2. Central Organization Branding

Create one typed organization-branding/configuration layer that consumes public bootstrap data. Avoid repeating fallback logic and customer identity strings across components.

Apply the resolved branding consistently to:

- Public landing and onboarding screens.
- Login and logged-out state.
- Application title and route-specific browser titles.
- Favicon and logo.
- Header, sidebar, dashboard, and organization settings.
- Public support/contact information where returned by bootstrap.
- Existing print/report/document identity only where those outputs are rendered by this frontend and backend-approved public branding data is available.

The organization is the dominant identity inside its HMO workspace. MEDiX may appear as subtle “Powered by MEDiX” attribution if configurable by deployment. Do not hard-code a customer organization, logo, phone, email, website, address, or colors. Do not display “IX2 HMO” or “MEDIX HMO Portal” as the customer-facing product identity; use MEDiX as product identity where appropriate and the resolved customer identity as the organization identity.

Apply colors through centralized CSS variables/tokens and maintain readable contrast. Branding must not change permission behavior or imply authority that belongs to the backend.

### 3. Registration Wizard

Replace or extend the current short registration page with the six-step flow using only backend-supported states and routes:

1. Organization information.
2. Corporate registration/CAC information and explicit verification consent.
3. NHIA information and evidence, separate from CAC.
4. Initial administrator information.
5. Review, including the normalized CAC verification result and applicant confirmation.
6. Submission/provisioning outcome, including the backend-issued activation path.

Use the backend’s actual field names and validation rules. Preserve user input across steps as appropriate without placing passwords, identity documents, or sensitive verification payloads in unsafe browser storage. Submit consent explicitly; do not pre-check consent or call a verification endpoint before consent is confirmed.

CAC experience must include:

- CAC number, registered name, and registration type fields exactly as supported by the backend contract.
- Verification-in-progress state and submit protection against duplicate clicks.
- A normalized verification result for applicant review (verified name and only the documented public/submission-relevant fields).
- Explicit applicant confirmation before final provisioning.
- Safe retry on invalid input or provider outage, distinguishing only the documented customer-facing outcomes.
- Clear treatment for material name mismatch according to backend response; never silently override a submitted legal name.
- A duplicate-CAC result that does not disclose an existing organization’s details and directs the applicant to the staff login path.

Do not claim CAC proves NHIA accreditation. Show NHIA as its own information/status flow. Do not invent a manual approval/review step; only show backend-provided status/result messages. The public website availability check is informational and cannot block registration.

### 4. Authentication and Session Lifecycle

Integrate login with the current deployment context using the backend contract. Credentials must not include a user-selected HMO ID. Display the same generic invalid-credentials message for invalid credentials and credentials incompatible with the resolved HMO, as required by the backend.

Preserve working session restoration: on app load, resolve/retain the deployment context, validate the existing user session through the documented API, and show protected pages only after authentication is confirmed. Expired or invalid sessions must return to the currently resolved HMO’s login screen without dropping public branding.

On logout or account change:

- Call backend logout/revocation where the contract supports it.
- Clear tokens, user state, and all protected React Query data/cache, including enrollees, providers, claims, codes, referrals, financials, reports, staff, and settings.
- Preserve only the backend-approved public deployment context/configuration needed to show that HMO’s branded login/logout page.
- Prevent a prior user’s cached data from appearing during account or deployment changes.
- Make logout/retry behavior safe if the network is unavailable, while still clearing local sensitive state.

Do not treat browser storage or UI guards as tenant security; backend authorization remains authoritative.

### 5. Existing HMO Modules and Focused Cleanup

Preserve the existing dashboard, enrollees, providers, call-center/preauthorization, authorization codes, referrals, claims, vetting, billing/financial, reports, staff, roles/permissions, notifications, tariffs, and settings workflows. Do not rebuild functioning business modules as part of white-label deployment work.

Review relevant current implementation anchors:

- API and auth: `src/api/apiClient.ts`, `src/api/auth.ts`.
- Registration/bootstrap: `src/app/onboarding/page.tsx`, `src/app/landing/page.tsx`, `src/hooks/useInstallationId.ts`.
- Session/cache: `src/context/AuthContext.tsx`, `src/components/Providers.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/AppShell.tsx`.
- Shared branding: `src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Sidebar.tsx`, `src/app/settings/page.tsx`, and report/print surfaces.
- Existing fixed tenant input: `src/app/enrollees/register/page.tsx` currently sends `hmo_id: 1`; remove it from the client request if the backend contract confirms tenant identity is derived from authenticated deployment/user. Do not replace it with another client-controlled tenant identifier.
- `src/api/providers.ts` and `src/api/claims.ts` contain comments about tenant exposure; verify them against the implemented backend before changing/removing them. Do not present frontend scoping as a security fix.

Update API error handling so staff receive user-friendly messages, while technical details stay in server logs/monitoring. Keep diagnosis/retry state useful but do not leak provider or backend internals.

### 6. Accessibility, Responsive Behavior, and User States

Use the existing application design system and patterns. Ensure every wizard step, consent control, error, and verification result works with keyboard and screen readers. Associate labels and validation messages with controls, announce loading/error/success state changes, manage focus when advancing/backing through steps, and keep focus within any modal/dialog.

Design explicit states for loading, empty, validation errors, network outage, retry, verification pending, verified-but-unconfirmed, duplicate, provisioning success, and deployment unavailable. Keep user-entered data when safe to retry. Prevent double-submit and provide responsive layouts for mobile and desktop. Never use fake progress or imply success before the backend confirms it.

## Required Frontend Tests and Acceptance Criteria

Use the repository’s current test setup if present. If no UI/e2e runner exists, propose the smallest suitable addition and get approval before adding a large testing stack. Do not test against a production customer account or store real Kora credentials in test fixtures.

### Bootstrap and branding

- A customer domain resolves and renders only the organization returned by backend bootstrap.
- The shared Vercel app requires valid backend-issued activation context to resolve an HMO; missing/invalid/expired context shows a safe state.
- Unknown, suspended, expired, and transiently unavailable states are distinct where the backend contract says so and never render stale branding/data from a previous deployment.
- Public bootstrap UI consumes only public fields; protected data is not requested or rendered before authentication.
- Brand name/logo/favicon/colors/title/contact details update consistently across landing, login, shell, sidebar, dashboard, settings, and logout.

### Registration

- All six steps validate against the documented contract and preserve safe entered data on navigation/retry.
- Consent is explicit and required before CAC verification; no provider call is made before it.
- CAC pending, normalized success, confirmation, invalid input, provider outage, material mismatch, and retry states render correctly.
- Duplicate result reveals no existing organization and directs the user to staff login.
- NHIA remains separate and is never inferred from CAC.
- Website reachability failure does not block the flow.
- New organization is shown as provisioned/ready only after the backend confirms it and returns the deployment/activation result.

### Auth/cache/isolation behavior

- A valid user restores into the correct deployment; expired sessions return to its branded login.
- Wrong-HMO and invalid credential responses use the same generic UI message.
- Logout clears user/token and protected query cache but preserves public deployment identity.
- Switching deployment/account cannot show prior cached protected data.
- Existing module navigation and API behavior remain intact after branding/bootstrap changes.

### Commands and release smoke tests

Run and report the actual results of:

- `npx eslint` on touched files (or the project-wide lint command if the repository’s configured command is appropriate).
- `npx tsc --noEmit`.
- `npm run build`.
- Focused browser/e2e tests for bootstrap, onboarding, auth, logout, and cache clearing.
- Production-like smoke test against the configured central API and Vercel deployment, including the required DNS/TLS/CORS behavior. Do not claim custom-domain support is production-ready until routing and host resolution are verified.

## Frontend Completion Handoff

Before declaring the frontend done, provide:

1. The backend contract version/location used, including final endpoint paths and status/error codes.
2. The organization/deployment context storage and cache-clearing behavior.
3. The onboarding states implemented and any backend response not yet represented.
4. Test commands/results and browser acceptance coverage.
5. Environment variables required for API origin and any non-secret public configuration.
6. Known gaps and release gates, especially activation-link delivery/recovery, customer-domain routing, approved CAC consent wording, NHIA semantics, and trial status.

## Explicitly Deferred

- Windows installer, desktop activation, Windows-native installation identity, and desktop-specific session flows.
- Generating a separate HMO app/source/ZIP/EXE per customer.
- Full subscription billing, client-side or frontend-authoritative trial enforcement, device revocation, offline grace, and version enforcement.
- Rewriting existing HMO operational modules that already work and are correctly tenant-scoped.
- Implementing Kora, duplicate detection, tenant authorization, provisioning, or deployment status decisions in the frontend.
