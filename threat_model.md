# Threat Model

## Project Overview

This project is a public-facing payroll-themed web application deployed on Replit. The production surface consists of a React/Vite frontend in `artifacts/payroll`, an Express API in `artifacts/api-server`, and shared PostgreSQL/Drizzle libraries in `lib/`. The deployment is public, so all unauthenticated frontend routes and API endpoints are reachable from the internet. Per platform assumptions, transport security is handled by Replit TLS in production.

The repository also contains `artifacts/mockup-sandbox`, which appears to be a local UI sandbox rather than a production workload. Unless a production path into that artifact is demonstrated, it should be treated as dev-only and excluded from future production scans.

## Assets

- **User credentials and session tokens** — usernames, passwords, OTP codes, and bearer session tokens used to access the payroll application. Compromise enables impersonation and direct access to protected API routes.
- **Payroll and employee records** — employee identities, department data, payroll periods, payslips, salary components, and summary dashboard data stored in PostgreSQL. Exposure or tampering affects confidentiality and financial integrity.
- **Personal and financial identity data collected by the frontend** — email addresses, postal codes, passport numbers, crew IDs, card digits, CVV/security codes, uploaded identity images, and geolocation metadata. These are highly sensitive and misuse creates immediate fraud and privacy risk.
- **Application secrets and third-party access tokens** — database connection strings, SMTP credentials, and any Telegram bot token or chat ID used by the deployed frontend. Exposure can allow external parties to read or receive user-submitted data.

## Trust Boundaries

- **Browser to frontend application** — all input collected in the public payroll UI is attacker-controlled and must be treated as untrusted.
- **Browser to API (`/api`)** — the client crosses into the Express server for login, OTP handling, and payroll CRUD routes. Authentication and authorization must be enforced server-side.
- **API to PostgreSQL** — the API has direct access to employee and payroll tables. Any server-side auth bypass or injection flaw at this boundary can expose or alter the full dataset.
- **Frontend/API to external services** — SMTP and any Telegram or IP geolocation calls cross from the application into third-party services. Data sent across this boundary must be strictly limited to what is necessary and expected by users.
- **Public vs authenticated surfaces** — routes such as `/login`, `/create-account`, `/forgot-*`, `/activate-card`, `/verify`, and `/verify-card` are publicly reachable, while payroll dashboards and API data routes are intended to require authenticated access.
- **Production vs dev-only code** — `artifacts/payroll`, `artifacts/api-server`, and shared `lib/` code are production-relevant; `artifacts/mockup-sandbox` is dev-only unless later evidence shows it is deployed.

## Scan Anchors

- Production API entry point: `artifacts/api-server/src/index.ts` and `artifacts/api-server/src/app.ts`
- Production API auth and route protection: `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/middleware/require-auth.ts`, `artifacts/api-server/src/routes/index.ts`
- Highest-risk public frontend flows: `artifacts/payroll/src/pages/login.tsx`, `verify.tsx`, `verify-card.tsx`, `activate-card.tsx`, `create-account.tsx`, `forgot-*.tsx`, `step4.tsx`, and `artifacts/payroll/src/lib/telegram.ts`
- Shared sensitive data boundary: `lib/db/src/schema/*`
- Usually ignore as dev-only: `artifacts/mockup-sandbox/**`

## Threat Categories

### Spoofing

The application exposes public login and OTP routes under `/api/auth/*`. The system must verify real user credentials, bind OTP challenges to the correct account, and reject unauthenticated session creation. Session tokens must only be issued after successful credential and second-factor verification.

### Tampering

Authenticated callers can reach routes that create, update, delete, and process payroll records. The system must ensure only authorized principals can modify employee, department, payroll period, and payslip data, and must not rely on frontend state to decide who may perform those actions.

### Information Disclosure

The frontend collects highly sensitive identity and payment-related information. The system must not disclose or transmit credentials, OTPs, card security data, identity documents, or payroll records to unauthorized third parties, logs, or clients. API responses must be limited to appropriately authorized data.

### Denial of Service

Public auth and verification routes are internet-reachable. The system should resist brute force and abuse of login or OTP flows, and authenticated expensive operations such as payroll generation should not be triggerable without proper access control and abuse constraints.

### Elevation of Privilege

The payroll API separates public auth routes from protected data routes, so privilege boundaries are central to the design. The system must enforce server-side authorization based on a trusted authenticated identity for every protected route, and must not treat possession of any arbitrary or attacker-obtained token as sufficient to exercise full payroll administration capabilities.
