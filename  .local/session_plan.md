# Objective
Perform an in-depth production security scan across the deployed application and shared libraries, with emphasis on exploitable auth, authorization, data-exfiltration, and sensitive-data handling issues.

# Relevant information
- Deployment is public at `https://mypaymenttvaullt.replit.app`.
- Production-relevant code: `artifacts/payroll`, `artifacts/api-server`, `lib/db`, `lib/api-*`.
- Treat `artifacts/mockup-sandbox` as dev-only unless production reachability is demonstrated.
- Scanner kickoff already showed high-signal results for a committed Telegram bot token and public frontend Telegram data flows.
- Existing relevant vulnerabilities live under `.local/existing_vulnerabilities/authentication-and-access-control/`.

# Tasks

### T001: Validate authentication and session issuance
- **Blocked By**: []
- **Details**:
  - Confirm whether `/api/auth/login`, `/api/auth/send-otp`, and `/api/auth/verify-otp` enforce real credential and OTP checks.
  - Trace pending-session and full-session handling, production reachability, and resulting access to protected APIs.
  - Update any matching existing vulnerabilities and write a new one if re-discovered.
  - Files: `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/lib/pending-sessions.ts`, `artifacts/api-server/src/lib/sessions.ts`, `artifacts/api-server/src/routes/index.ts`, `artifacts/api-server/src/app.ts`
  - Acceptance: Clear conclusion on whether an unauthenticated internet user can obtain a valid bearer token.

### T002: Validate authorization on protected payroll routes
- **Blocked By**: []
- **Details**:
  - Check whether protected routes bind requests to a trusted user identity or role, or merely require token presence.
  - Assess whether this is a real production vulnerability rather than an intended single-role design.
  - Update any matching existing vulnerabilities and write a new one if re-discovered.
  - Files: `artifacts/api-server/src/middleware/require-auth.ts`, `artifacts/api-server/src/routes/index.ts`, `artifacts/api-server/src/routes/departments.ts`, `artifacts/api-server/src/routes/employees.ts`, `artifacts/api-server/src/routes/payroll-periods.ts`, `artifacts/api-server/src/routes/payslips.ts`, `artifacts/api-server/src/routes/dashboard.ts`, `lib/db/src/schema/users.ts`
  - Acceptance: Confirmed finding or justified dismissal with evidence.

### T003: Validate sensitive-data exfiltration from public frontend flows
- **Blocked By**: []
- **Details**:
  - Trace all public and post-auth frontend flows that collect credentials, OTPs, card data, identity data, uploaded files, or geolocation and determine where that data is sent.
  - Confirm whether secrets enabling those transmissions are shipped in production configuration.
  - Write grouped findings for direct exfiltration if confirmed.
  - Files: `artifacts/payroll/src/lib/telegram.ts`, `artifacts/payroll/src/pages/login.tsx`, `artifacts/payroll/src/pages/verify.tsx`, `artifacts/payroll/src/pages/verify-card.tsx`, `artifacts/payroll/src/pages/activate-card.tsx`, `artifacts/payroll/src/pages/create-account.tsx`, `artifacts/payroll/src/pages/forgot-username.tsx`, `artifacts/payroll/src/pages/forgot-password.tsx`, `artifacts/payroll/src/pages/step4.tsx`, `.replit`
  - Acceptance: Clear evidence of what sensitive fields leave the browser, to which destination, and whether it is production-reachable.

### T004: Sweep remaining production server/shared code for additional high-impact issues
- **Blocked By**: []
- **Details**:
  - Review remaining production API and shared DB code for additional exploitable issues not already covered by T001-T003, prioritizing injection, unsafe external calls, and public data exposure.
  - Files: `artifacts/api-server/src/routes/*.ts`, `artifacts/api-server/src/lib/*.ts`, `lib/db/src/schema/*.ts`, `lib/api-spec/openapi.yaml`
  - Acceptance: Either additional confirmed issues or evidence that no other high-impact production flaws were found.
