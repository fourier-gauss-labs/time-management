# Sprint 1 — Identity & Security Baseline

**Primary Epic:** EPIC 1 — Identity, Authentication & User Isolation

**Sprint Intent**
Establish a secure authentication foundation using AWS Cognito that enables per-user data isolation and ensures all API access is authenticated. No feature development can proceed without this identity layer in place.

---

## Goals

Define what success looks like for this sprint.

- Secure user authentication via AWS Cognito Hosted UI
- Protected API Gateway with Cognito authorizer
- User identity available in all Lambda contexts
- Per-user data isolation enforced at the architectural level

---

## In Scope

Explicitly list what this sprint will cover.

- AWS Cognito User Pool infrastructure via CDK
- Cognito Hosted UI configuration and deployment
- Frontend login/logout flow with Cognito integration
- API Gateway HTTP API with Cognito authorizer
- Lambda context enrichment with authenticated user identity
- IAM least-privilege policies for Lambda execution roles
- Secure environment variable handling for Cognito configuration
- CI pipeline update to include CDK synth validation

---

## Out of Scope

Explicitly list what this sprint will _not_ attempt to do.

- OAuth federation with Google or Microsoft (deferred to Sprint 9)
- Multi-factor authentication (MFA) configuration
- Custom authentication flows or challenges
- User profile management UI
- Password reset customization
- Email template customization
- Production environment deployment (only dev environment)
- DynamoDB table creation (deferred to Sprint 2)
- Actual API endpoints beyond a health check or auth verification endpoint

> This section exists to prevent scope creep and over-eager AI assistance.

---

## System Context & Assumptions

Describe the system-level truths and constraints that apply during this sprint.

- **Dependency on Sprint 0:** Repository structure, linting, formatting, and CI baseline are complete
- **Architecture:** Serverless architecture using AWS Lambda, API Gateway, and Cognito
- **Environment:** Dev environment only; QA and Prod are scaffolded but not active
- **Security posture:** Zero unauthenticated API access permitted
- **User model:** Each user is uniquely identified by Cognito `sub` claim
- **Data isolation:** All future data operations will be scoped to authenticated user's `sub`
- **Frontend framework:** React + Vite with TypeScript
- **Infrastructure:** AWS CDK for all cloud resource provisioning
- **Region:** Single AWS region deployment (to be parameterized in Sprint 2)

---

## Functional Requirements

Describe the business-level behaviors the system must support as a result of this sprint.
Each requirement should be independently testable.

### FR-1: User Registration

**Description**
New users can create an account using the Cognito Hosted UI with email and password.

**Acceptance Criteria**

- Given a user visits the application for the first time, when they click "Sign Up", then they are redirected to the Cognito Hosted UI registration page
- Given a user completes registration with valid credentials, when they submit the form, then they receive a verification email
- Given a user verifies their email, when they log in, then they are redirected back to the application with valid authentication tokens

---

### FR-2: User Login

**Description**
Existing users can authenticate via the Cognito Hosted UI and receive valid session tokens.

**Acceptance Criteria**

- Given a registered and verified user, when they click "Log In", then they are redirected to the Cognito Hosted UI login page
- Given a user enters valid credentials, when they submit the login form, then they are redirected back to the application with authentication tokens
- Given authentication tokens are present, when the frontend makes an API request, then the tokens are included in the Authorization header

---

### FR-3: User Logout

**Description**
Authenticated users can log out, which clears their session and tokens.

**Acceptance Criteria**

- Given an authenticated user, when they click "Log Out", then their session tokens are cleared from browser storage
- Given a logged-out user, when they attempt to access the application, then they are redirected to the login flow
- Given a logged-out user, when they attempt to call the API, then requests are rejected with 401 Unauthorized

---

### FR-4: API Authentication Enforcement

**Description**
All API requests must include valid Cognito authentication tokens; unauthenticated requests are rejected.

**Acceptance Criteria**

- Given an unauthenticated request to any API endpoint, when the request is processed, then it is rejected with 401 Unauthorized
- Given a request with an expired token, when the request is processed, then it is rejected with 401 Unauthorized
- Given a request with a valid token, when the request is processed, then the request proceeds to the Lambda handler

---

### FR-5: User Identity in Lambda Context

**Description**
All Lambda functions handling authenticated API requests have access to the authenticated user's identity (Cognito `sub`).

**Acceptance Criteria**

- Given an authenticated API request, when it reaches a Lambda handler, then the Lambda context contains the user's Cognito `sub`
- Given the user's `sub` is available, when Lambda code executes, then it can access the `sub` for data scoping and logging
- Given multiple users make concurrent requests, when Lambda processes them, then each request is correctly associated with its respective user

---

## Non-Functional Requirements

List only the non-functional requirements that are relevant _for this sprint_.

### Security

- All authentication flows must use HTTPS
- Cognito User Pool must enforce minimum password requirements (8+ characters, uppercase, lowercase, number)
- Lambda execution roles must follow least-privilege IAM policies (no wildcard permissions)
- Cognito tokens must be stored securely in browser (httpOnly cookies or secure localStorage pattern)
- No sensitive credentials or secrets in frontend code
- API Gateway must reject all requests without valid Cognito authorizer validation

### Performance

- Authentication redirect flow completes within 3 seconds under normal network conditions
- API Gateway authorizer caching enabled to minimize latency on subsequent requests
- Lambda cold start impact minimized for auth-related functions

### Reliability & Error Handling

- Clear error messages for authentication failures (invalid credentials, unverified email)
- Network failures during login gracefully handled with user-friendly error messages
- Token refresh logic handles transient Cognito service issues

### Developer Experience

- CDK stack deploys cleanly with `cdk deploy`
- Local development workflow documented for testing authenticated flows
- Unit tests for Lambda authorizer validation logic
- Integration tests verify end-to-end authentication flow
- CI includes CDK synth validation to catch infrastructure errors early

---

## Data & State Changes

Describe any changes to persisted data or system state.

- **Cognito User Pool:** New AWS resource storing user accounts, emails, and hashed passwords
- **User attributes:** Cognito stores `email`, `email_verified`, and `sub` (unique user ID)
- **Session state:** Authentication tokens (ID token, access token, refresh token) stored in browser
- **No DynamoDB changes:** User data storage deferred to Sprint 2; this sprint establishes identity only

> Do not include implementation code here—describe intent.

---

## API & Integration Touchpoints

Include this section only if APIs or integrations are affected.

- **New endpoint:** `GET /api/auth/verify` — health check endpoint to verify authentication is working
  - Returns user's `sub` and email from Cognito claims
  - Used to validate end-to-end authentication flow
- **API Gateway configuration:**
  - Cognito authorizer attached to all `/api/*` routes
  - Authorizer configured to validate JWT tokens from Cognito User Pool
- **Authentication flow:**
  - Frontend → Cognito Hosted UI (redirect)
  - Cognito Hosted UI → Frontend (callback with authorization code)
  - Frontend → Cognito Token Endpoint (exchange code for tokens)
  - Frontend → API Gateway (requests include ID token in Authorization header)

---

## Testing Strategy

Describe how correctness will be validated for this sprint.

- **Unit tests:**
  - Lambda handler correctly extracts `sub` from authorizer context
  - IAM policy definitions adhere to least-privilege principles
- **Integration tests:**
  - End-to-end authentication flow (register → verify → login → call API)
  - Token validation and rejection scenarios (expired, malformed, missing tokens)
  - Logout flow clears session and prevents API access
- **Manual testing:**
  - Deploy to dev environment and manually test registration, login, logout
  - Verify unauthenticated requests are blocked
  - Verify authenticated requests succeed
- **Edge cases:**
  - Expired tokens correctly rejected
  - Concurrent logins from same user handled correctly
  - Browser refresh maintains authentication state

---

## Observability & Diagnostics

If relevant, describe expectations for visibility into system behavior.

- **Logging:**
  - Lambda functions log authenticated user `sub` for all requests
  - Authentication failures logged with reason (expired token, invalid token, etc.)
- **Metrics:**
  - Cognito user pool sign-up and sign-in metrics available in CloudWatch
  - API Gateway 401 errors tracked to identify authentication issues
- **Tracing:**
  - API Gateway request IDs logged for correlation with Lambda execution

---

## Open Questions & Decisions

Capture known uncertainties without blocking progress.

- **Decision:** Use Cognito Hosted UI or build custom authentication UI?
  - **Resolution:** Use Hosted UI for Sprint 1 to minimize frontend complexity; custom UI can be added later if needed
- **Decision:** Store tokens in localStorage or httpOnly cookies?
  - **Resolution:** Use secure localStorage pattern for Sprint 1; evaluate cookie-based approach in future sprint
- **Question:** Should password policy be stricter than Cognito defaults?
  - **Owner:** Security review in Sprint 12
  - **Target timing:** Before early access launch

---

## Exit Criteria

Restate the conditions under which this sprint is considered complete.

- ✅ Authenticated user can successfully call `/api/auth/verify` and receive their `sub` and email
- ✅ Unauthenticated requests to any API endpoint return 401 Unauthorized
- ✅ User can register, verify email, log in, and log out via Cognito Hosted UI
- ✅ Lambda functions have access to authenticated user's `sub` in request context
- ✅ CDK stack deploys cleanly to dev environment with all Cognito and API Gateway resources
- ✅ IAM policies follow least-privilege principles (verified via code review)
- ✅ CI pipeline includes CDK synth validation step
- ✅ Clear data ownership boundary established (all future operations scoped to user `sub`)
- ✅ Local development workflow documented in README or developer guide

> If all exit criteria are met, the sprint is done.

---

## Notes

- This sprint establishes the security perimeter for all future work
- No application features can be built without this identity foundation
- Sprint 2 will build on this by adding DynamoDB with per-user data partitioning
- OAuth federation (Google, Microsoft) deferred to Sprint 9 to maintain sprint focus
- Consider adding `email` to Lambda context alongside `sub` for logging and debugging
- Cognito User Pool configuration (password policy, MFA settings) should be parameterized in CDK for future flexibility
