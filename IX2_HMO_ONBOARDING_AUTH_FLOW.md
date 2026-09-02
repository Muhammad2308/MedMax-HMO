# IX2 HMO — Onboarding, Verification & Auth Flow

**Scope**: Auth and onboarding tasks for the IX2 HMO portal only:
- Universal landing page (Register / Login radio cards)
- Register → Enrollee or Staff type selection
- Staff registration: self-request form → HMO admin approves → SMS token → OTP → password → device
- HMO first-admin activation: Schema sends org invite token to HMO admin's phone → same token flow
- Login (email + password)
- Route guards and token controls

All other HMO functions (Call Center, Operations, Accounts, Manage Users, etc.) are already implemented. Do not touch them.

---

## How Auth Works

Device recognition is **NOT** used as a routing gate. Every user arrives at the same landing page. Device registration happens during staff activation, not as a pre-check.

**Two entry paths for HMO users:**

```
PATH A — First HMO org admin (Schema-created):
  Schema admin creates HMO + enters HMO admin's phone number
    → System sends org invite token to that phone via SMS

  HMO admin opens HMO portal → Landing → Register → Staff
    → "I have my token" tab → enters token from SMS
    → fills name, email, password (new user creation step)
    → device registered → Dashboard (as org admin)

PATH B — Subsequent HMO staff (HMO org admin-approved):
  Staff → Landing → Register → Staff
    → fills request form (name, email, phone)
    → HMO org admin reviews in Manage Users → Approves
    → System sends activation token to staff's phone via SMS

  Staff → "I have my token" tab → enters token from SMS
    → OTP verification → sets password → device registered → Dashboard

PATH C — Returning user:
  Landing → Login → email + password → Dashboard
```

---

## Environment

```
VITE_API_BASE_URL=https://api.ix2app.com/api/v1
```

Token storage keys: `hmo_token`, `hmo_user`, `hmo_device_id`

---

## PART 1: BACKEND ADDITIONS

> **Note**: The shared auth endpoints (`POST /auth/staff-request`, `/auth/staff-lookup`, `/auth/staff-activate`, `/auth/staff-resend-otp`) and migrations (`invite_token` on users, `staff_registration_requests` table) are documented in `IX2_SCHEMA_ONBOARDING_FLOW_PROMPT.md`. Implement those first — they are shared across all portals. The endpoints below are HMO-specific additions only.

---

### 1.1 Update SchemaHmoController::store() — send invite token to HMO admin's phone

When the Schema admin creates an HMO, they now also provide the HMO admin's phone number. The system sends the org invite token to that phone via SMS immediately.

```php
// In SchemaHmoController::store() — add after generating verification_token:

$request->validate([
    // ... existing validation ...
    'admin_phone' => 'nullable|string|max:20',  // phone to receive invite SMS
]);

$hmo = HMO::create([
    // ... existing fields ...
    'verification_token' => Str::uuid(),
    'token_expires_at'   => now()->addHours(72),
    'registration_status' => 'pending',
]);

// Send org invite token to admin's phone via SMS if provided
if ($request->admin_phone) {
    // TODO: SMS gateway
    // SMS: "You have been invited to manage {$hmo->name} on IX2.
    //       Your activation token: {$hmo->verification_token}
    //       Valid for 72 hours. Visit hmo.ix2app.com to activate."
    \Log::info("HMO ORG INVITE for {$hmo->name}: {$hmo->verification_token}");
}

return response()->json([
    'success'    => true,
    'hmo'        => $hmo,
    'invite_url' => config('app.hmo_url') . '/staff-token',  // no longer /onboard/:token
    'token'      => $hmo->verification_token,               // still returned for manual sharing
]);
```

---

### 1.2 HMO org admin approves staff request (AUTHENTICATED)

```php
// POST /hmo/org/registration-requests/{id}/approve    auth:sanctum
public function approveStaffRequest(Request $request, int $id): JsonResponse
{
    $regRequest = \App\Models\StaffRegistrationRequest::findOrFail($id);

    if ($regRequest->org_type !== 'hmo' || $regRequest->org_id !== $request->user()->hmo_id) {
        return response()->json(['message' => 'Unauthorised.'], 403);
    }

    if ($regRequest->status !== 'pending') {
        return response()->json(['message' => 'This request has already been processed.'], 422);
    }

    return DB::transaction(function () use ($regRequest, $request) {
        $user = User::create([
            'name'         => $regRequest->name,
            'email'        => $regRequest->email,
            'phone_number' => $regRequest->phone_number,
            'password'     => Hash::make(Str::random(32)),
            'hmo_id'       => $regRequest->org_id,
            'is_org_admin' => false,
            'is_approved'  => false,
            'invite_token'           => Str::uuid(),
            'invite_token_expires_at' => now()->addHours(72),
        ]);

        $regRequest->update([
            'status'      => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // TODO: send SMS with invite_token to $regRequest->phone_number
        \Log::info("HMO STAFF INVITE TOKEN for user {$user->id}: {$user->invite_token}");

        return response()->json([
            'success' => true,
            'message' => "Approved. Activation token sent to {$regRequest->phone_number} via SMS.",
            'user'    => $user->only(['id', 'name', 'email', 'phone_number']),
        ]);
    });
}
```

---

### 1.3 HMO org admin rejects staff request (AUTHENTICATED)

```php
// POST /hmo/org/registration-requests/{id}/reject    auth:sanctum
public function rejectStaffRequest(Request $request, int $id): JsonResponse
{
    $regRequest = \App\Models\StaffRegistrationRequest::findOrFail($id);

    if ($regRequest->org_type !== 'hmo' || $regRequest->org_id !== $request->user()->hmo_id) {
        return response()->json(['message' => 'Unauthorised.'], 403);
    }

    $regRequest->update([
        'status'      => 'rejected',
        'reviewed_by' => $request->user()->id,
        'reviewed_at' => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Request rejected.']);
}
```

---

### 1.4 List pending staff requests for HMO (AUTHENTICATED)

```php
// GET /hmo/org/registration-requests    auth:sanctum
public function listStaffRequests(Request $request): JsonResponse
{
    $requests = \App\Models\StaffRegistrationRequest::where('org_type', 'hmo')
        ->where('org_id', $request->user()->hmo_id)
        ->where('status', 'pending')
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json($requests);
}
```

---

### 1.5 HMO org invite — complete first admin setup (handle in staffLookup)

When `POST /auth/staff-lookup` detects the token is an `hmo_org_invite`, it returns:
```json
{
  "valid": true,
  "type": "hmo_org_invite",
  "org_name": "Leadway Health HMO",
  "token": "uuid-verification-token"
}
```

The frontend then shows a **completion form** (name, email, password) instead of the OTP flow. The existing `POST /auth/hmo-invite/{token}` endpoint handles the submission — it creates the user, seeds permissions and roles, returns Sanctum token. See `SchemaHmoController::verifyInvite()`.

---

### 1.6 Resend SMS invite token for pending user (AUTHENTICATED)

```php
// POST /hmo/org/users/{id}/regenerate-invite    auth:sanctum
public function regenerateInvite(Request $request, int $id): JsonResponse
{
    $user = User::where('id', $id)
        ->where('hmo_id', $request->user()->hmo_id)
        ->where('is_approved', false)
        ->firstOrFail();

    $user->update([
        'invite_token'           => Str::uuid(),
        'invite_token_expires_at' => now()->addHours(72),
    ]);

    // TODO: re-send SMS with new token
    \Log::info("HMO REGEN INVITE TOKEN for user {$user->id}: {$user->invite_token}");

    return response()->json(['success' => true, 'message' => 'New token sent via SMS.']);
}
```

---

### 1.7 Register routes in `routes/api.php`

```php
Route::middleware('auth:sanctum')->group(function () {
    // ... existing hmo routes ...

    Route::prefix('hmo/org')->group(function () {
        // ... existing user/role/permission routes ...

        // NEW — staff request management
        Route::get('/registration-requests',               [HmoOrgController::class, 'listStaffRequests']);
        Route::post('/registration-requests/{id}/approve', [HmoOrgController::class, 'approveStaffRequest']);
        Route::post('/registration-requests/{id}/reject',  [HmoOrgController::class, 'rejectStaffRequest']);
        Route::post('/users/{id}/regenerate-invite',       [HmoOrgController::class, 'regenerateInvite']);
    });
});
```

---

## PART 2: FRONTEND IMPLEMENTATION

### Project structure (new files)

```
src/
  pages/
    auth/
      LandingPage.tsx          ← NEW
      RegisterTypePage.tsx     ← NEW
      StaffTokenPage.tsx       ← NEW (replaces OnboardPage.tsx)
      StaffOtpPage.tsx         ← NEW
      HmoOrgCompletePage.tsx   ← NEW (for org invite token path only)
      LoginPage.tsx            ← UPDATE (remove device recognition)
```

---

### App Boot — `src/App.tsx`

```
App loads
    ↓
hmo_token in localStorage?
    ├── YES → GET /auth/user
    │            ├── 200 → hydrate → /dashboard
    │            └── 401 → clearAuth() → /
    └── NO → / (LandingPage)
```

---

### New: `src/pages/auth/LandingPage.tsx`

**Route**: `/` — public, shown when no valid token exists.

**Layout**: Full-screen `#0F172A`, centered, `max-w-[440px] mx-auto px-4`.

**Top**: IX2 HMO logo / "IX2 HMO Portal" wordmark.

**Two radio cards** (side by side on desktop, stacked on mobile):

```
┌──────────────────────┐   ┌──────────────────────┐
│   [UserPlus]         │   │   [LogIn]            │
│                      │   │                      │
│   Register           │   │   Login              │
│                      │   │                      │
│   "New to IX2?       │   │   "Already have an   │
│    Create your        │   │    account? Sign     │
│    account."          │   │    in here."         │
└──────────────────────┘   └──────────────────────┘
```

Card styles (same as Schema portal but with cyan accent `#06B6D4`):
- Default: `bg-white/5 border border-white/10 rounded-2xl p-6 cursor-pointer transition-all hover:border-white/25`
- Selected: `bg-cyan-500/10 border border-cyan-500/50 ring-1 ring-cyan-500/20`
- Icon: `text-cyan-400` selected, `text-white/40` unselected

"Continue →" button below (appears once a card is selected):
- "Register" → `/register-type`
- "Login" → `/login`

---

### New: `src/pages/auth/RegisterTypePage.tsx`

**Route**: `/register-type` — public.

**Back**: → `/`

**Heading**: "What describes you?"

**Two radio cards**:

```
┌──────────────────────┐   ┌──────────────────────┐
│   [Heart]            │   │   [Briefcase]        │
│   Enrollee           │   │   Staff Member       │
│                      │   │                      │
│   "I am an insured   │   │   "I work for an     │
│    beneficiary."     │   │    HMO."             │
└──────────────────────┘   └──────────────────────┘
```

- Enrollee → info panel: "Enrollees use the IX2 Enrollee app. Visit enrollee.ix2app.com"
- Staff Member → `/staff-token`

---

### New: `src/pages/auth/StaffTokenPage.tsx`

**Route**: `/staff-token` — public.

**Back**: → `/register-type`

**Heading**: "Staff Activation"

**Two tabs**:

```
[ Request Access ]  [ I Have My Token ]
```

#### Tab A — Request Access

Form fields:
```
Full Name *
Email Address *
Phone Number *   (receives the SMS token after approval)
```

Submit: `POST /auth/staff-request` with `{ name, email, phone_number, org_type: 'hmo' }`

On success:
```
[Clock icon]
"Request submitted"
"Your HMO admin will review your request. You'll receive an SMS with your activation token once approved."
```

#### Tab B — I Have My Token

Single field:
```
Activation Token *   (UUID from SMS)
```

Submit: `POST /auth/staff-lookup` with `{ token }`

Response routing:
```
type === "hmo_org_invite" → /hmo-org-complete?token={token}
type === "hmo_staff"      → /staff-otp?token={token}
valid === false           → inline error: "Token not found or expired."
```

---

### New: `src/pages/auth/StaffOtpPage.tsx`

**Route**: `/staff-otp?token={token}` — public.

**Heading**: "Verify your phone"

**Sub-heading**: "We sent a 6-digit code to your registered phone number."

**OTP input**: 6 boxes (auto-focus next on input, backspace goes back).

**Resend link**: "Didn't receive it? Resend" → `POST /auth/staff-resend-otp` with `{ token }` → countdown 60s.

On valid OTP → `POST /auth/staff-activate` with `{ token, otp }` (no password here — see next step).

Wait — this page just verifies identity. After OTP confirmed:
- If account has no password yet → `/staff-setpassword?token={token}&verified=1`
- If returning to set new password → same

---

### New: `src/pages/auth/StaffSetPasswordPage.tsx`

**Route**: `/staff-setpassword?token={token}` — public.

**Heading**: "Create your password"

Form fields:
```
Password *          min 8 chars, strength bar
Confirm Password *
```

Submit: `POST /auth/staff-activate` with `{ token, otp_verified: true, password, password_confirmation, device_identifier }`

On success:
- Store `hmo_token` + `hmo_user`
- Show success screen → redirect `/` → AppShell routes to dashboard

---

### New: `src/pages/auth/HmoOrgCompletePage.tsx`

**Route**: `/hmo-org-complete?token={token}` — public.

This is the flow for the **first HMO org admin** activating their account via the token received from Schema SMS.

**Top section** — read-only (loaded from `/auth/staff-lookup` response):
```
Organisation:   Leadway Health HMO
```

**Form fields**:
```
Your Full Name *
Your Work Email *
Password *          strength bar
Confirm Password *
```

Submit: `POST /auth/hmo-invite/{token}` with `{ name, email, password, password_confirmation, device_identifier }`

On success: store auth → redirect `/`

On 404: show expired-token error state (same as existing `OnboardPage.tsx`)

On 422: inline field errors

---

### Update: `src/pages/auth/LoginPage.tsx`

Remove the device recognition check entirely (device state is no longer a routing gate).

**Simplified flow**:
- Show the login form immediately (no "checking device…" spinner)
- Heading: "Welcome back"
- Email + Password fields
- On submit: `POST /auth/login` with `{ email, password, device_identifier: getOrCreateDeviceId() }`
- On 401/422: "Invalid email or password"

No "Register your HMO" link. No "New device" text. Clean, simple.

---

## PART 3: SHARED API ENDPOINTS (reference)

> These are implemented in `IX2_SCHEMA_ONBOARDING_FLOW_PROMPT.md` and shared across portals.

### POST /auth/staff-request

```json
Request:  { "name": "Musa", "email": "m@h.com", "phone_number": "0801...", "org_type": "hmo" }
Response: { "success": true, "message": "Request submitted. Await admin approval." }
Errors:   422 → { "errors": { "email": ["already registered"] } }
```

### POST /auth/staff-lookup

```json
Request:  { "token": "uuid" }

Response (org invite):
{ "valid": true, "type": "hmo_org_invite", "org_name": "Leadway Health HMO", "token": "uuid" }

Response (staff invite):
{ "valid": true, "type": "hmo_staff", "name": "Musa Ibrahim", "token": "uuid" }

Response (invalid):
{ "valid": false, "message": "Token not found or expired." }
```

### POST /auth/staff-activate

```json
Request:
{
  "token": "uuid",
  "otp": "123456",                   // required for hmo_staff path
  "password": "secret123",
  "password_confirmation": "secret123",
  "device_identifier": "uuid"
}

Response:
{
  "success": true,
  "token": "sanctum-token",
  "user": { "id": 12, "name": "...", "is_org_admin": false, "roles": [...] }
}
```

### POST /auth/staff-resend-otp

```json
Request:  { "token": "uuid" }
Response: { "success": true, "message": "OTP resent." }
```

---

## PART 4: ROUTE GUARD UPDATES

### AppShell — public routes (no auth required)

```ts
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register-type',
  '/staff-token',
  '/staff-otp',
  '/staff-setpassword',
  '/hmo-org-complete',
];
```

The existing `/onboarding` and `/onboard/*` routes remain accessible as fallbacks but are no longer linked from the UI.

---

## PART 5: ACCEPTANCE CRITERIA

- [ ] HMO admin receives SMS with org invite token when Schema creates their HMO
- [ ] Token lookup distinguishes `hmo_org_invite` from `hmo_staff` and routes correctly
- [ ] Staff request form submits and shows pending state
- [ ] HMO org admin can approve/reject requests from Manage Users (existing tab)
- [ ] Approved staff receive SMS with activation token
- [ ] OTP 6-box input works with keyboard navigation
- [ ] Password strength bar appears on all password fields
- [ ] `device_identifier` is generated and persisted at activation time
- [ ] Login page shows immediately (no device check spinner)
- [ ] All public routes bypass AppShell auth guard
- [ ] TypeScript: zero errors
