# Threat Model

## Project Overview

This project is a publicly deployed payroll and employee portal composed of a React/Vite frontend (`artifacts/payroll`) and an Express 5 API (`artifacts/api-server`) backed by PostgreSQL via Drizzle ORM. It exposes a public login and support surface, authenticated administrative payroll functions, and a separate crew self-service area. The mockup sandbox artifact is development-only and should be ignored unless production reachability is proven.

Production assumptions for this scan:
- The deployment is public (`https://mypaymenttvaullt.cc`), so all public routes are internet-reachable.
- Replit terminates TLS for deployed traffic.
- `NODE_ENV` is `production` in production deployments.
- `artifacts/mockup-sandbox` is not deployed to production.

## Assets

- **Administrative sessions and admin APIs** — bearer tokens issued by `/api/auth/*` gate access to payroll, employee, notification, submissions, and credential-management endpoints. Compromise grants broad control over business data and staff accounts.
- **Crew accounts and payroll records** — crew usernames, password hashes, payslips, attendance, schedules, and profile data. Exposure impacts employee privacy and payroll integrity.
- **Highly sensitive user-submitted data** — login credentials, OTP codes, contact information, home address, date of birth, and card-related data collected through submission and login flows. This is the most sensitive data in the system.
- **Telegram bot capabilities and conversation history** — server-held bot tokens permit sending messages/documents and reading bot updates. Misuse can leak operational conversations or let attackers impersonate the application.
- **Application secrets and database access** — environment variables for Telegram integrations and the PostgreSQL connection string.

## Trust Boundaries

- **Browser to API** — all client input is untrusted. Public endpoints include login, support chat, submissions, and tracking; authenticated endpoints include admin payroll functions and crew self-service.
- **API to PostgreSQL** — the API stores operational data plus highly sensitive submissions. Any auth bypass or injection issue at the API layer risks full disclosure or tampering.
- **API to Telegram** — the backend calls Telegram with secret bot tokens and can both send outbound messages and read updates. Public access to these proxies would cross a sensitive server-to-third-party boundary.
- **Public to authenticated admin boundary** — `/api/auth/*` sessions protect admin data-management routes. This boundary must be enforced server-side and tied to real identity.
- **Public to crew boundary** — `/api/crew/*` routes expose employee self-service features and must remain isolated from public and admin users.
- **Dev-only to production boundary** — mockup/demo artifacts and local-only conveniences are out of scope unless mounted into the deployed app.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/**`, `artifacts/payroll/src/**`
- **Highest-risk areas:** `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/routes/submissions.ts`, `artifacts/api-server/src/routes/tg.ts`, `artifacts/api-server/src/routes/support-tg.ts`, `artifacts/api-server/src/routes/crew.ts`, `artifacts/api-server/src/routes/track.ts`, `artifacts/payroll/src/lib/telegram.ts`, `artifacts/payroll/src/pages/login-success.tsx`
- **Public surfaces:** `/api/auth/*`, `/api/submissions/*`, `/api/tg/*`, `/api/support/*`, `/api/track/visit`, `/api/crew/auth/register`, and public payroll frontend pages such as `/create-account`, `/activate-card`, `/forgot-password`, `/forgot-username`, and `/login-success`
- **Authenticated/admin surfaces:** `/api/departments`, `/api/employees`, `/api/payroll-periods`, `/api/payslips`, `/api/dashboard`, `/api/announcements`, `/api/schedules`, `/api/notifications`, `/api/data/all`, `/api/submissions/all`, `/api/submissions/contact`, `/api/crew/admin/*`
- **Dev-only areas normally ignored:** `artifacts/mockup-sandbox/**`, attached assets, local scripts unless production wiring is demonstrated

## Threat Categories

### Spoofing

The application issues bearer tokens for the main admin experience and separate crew tokens for the employee portal. The server must only issue admin-capable sessions after validating a real account and must bind each token to a concrete identity and role. Telegram-originated callbacks or approvals must not be treated as substitutes for primary authentication unless they are cryptographically bound to a verified user session.

### Tampering

Administrative routes can create, update, and delete payroll data, crew credentials, announcements, schedules, and submission state. These operations must require a valid authenticated identity with the correct role, and client-controlled values must never be trusted to authorize business actions.

### Information Disclosure

The project handles credentials, OTPs, payroll records, contact data, addresses, dates of birth, IP addresses, and card-related information. This data must not be exposed through public endpoints, logs, chat integrations, or overly broad admin views. Telegram bot update streams and submission databases are especially sensitive because they aggregate operational and user secrets, and any collection of authentication or payment data must be minimized and protected rather than forwarded to chat systems or stored in plaintext.

### Denial of Service

Public endpoints such as login, support chat, Telegram proxies, submissions, and tracking can be hit directly from the internet. They require sane rate limiting, bounded request sizes, and defensive handling of third-party calls so an attacker cannot cheaply consume Telegram quota, storage, or server resources.

### Elevation of Privilege

The most important guarantee in this project is server-side separation between anonymous users, crew users, and administrators. All privileged routes must enforce authorization independently of the frontend, and admin functionality must not become reachable through weak session issuance, shared bearer tokens, or public proxy endpoints that inherit server-side secrets.
