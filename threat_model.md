# Threat Model

## Project Overview

This project is a publicly deployed payroll and account-management application branded as MyPaymentVault. Production code consists of a React/Vite frontend in `artifacts/payroll`, an Express 5 API in `artifacts/api-server`, and shared database/API libraries in `lib/*`. The backend uses PostgreSQL through Drizzle ORM. The current deployment is public, so all browser-delivered frontend code and all public API routes must be treated as reachable from the internet.

Per deployment assumptions, TLS is platform-managed. `NODE_ENV=production` should be assumed in production. The `artifacts/mockup-sandbox` app is considered dev-only unless future evidence shows it is shipped in production.

## Assets

- **User credentials and sessions** — usernames, passwords, OTP codes, bearer session tokens, and any approval artifacts used during login. Compromise enables account takeover and unauthorized payroll access.
- **Payroll and employee records** — employee identities, salaries, allowances, payslips, departments, and payroll-period data. This is sensitive financial and HR data.
- **Identity and card-verification data** — passport numbers, crew IDs, card numbers, CVV/security codes, postal codes, uploaded identity images, and other account-recovery details collected by the frontend.
- **Application secrets and third-party tokens** — database credentials, SMTP credentials, and any frontend- or backend-accessible tokens used to call external services.
- **Administrative actions** — creation, modification, deletion, and payroll processing operations that change financial records.

## Trust Boundaries

- **Browser to frontend bundle** — all client code is fully visible to end users. Any secret or privileged workflow implemented in browser JavaScript must be considered exposed.
- **Browser to API (`/api`)** — the browser is untrusted. Every protected API route must authenticate the caller and enforce authorization server-side.
- **API to PostgreSQL** — the API has direct access to payroll and employee data. Query construction and route scoping must prevent unauthorized read/write access.
- **Frontend/API to external services** — this project contains flows that call third-party services such as SMTP and Telegram. Data sent across this boundary can leave organizational control and must be tightly justified and scoped.
- **Public to authenticated surface** — `/api/healthz` and login-related pages are public; payroll, employee, department, and payslip functionality is intended to be restricted.
- **Authenticated to privileged operations** — write actions such as employee creation, payroll processing, and payslip or department mutation must be restricted by server-side role/permission checks, not just by login state.
- **Production to dev-only areas** — `artifacts/mockup-sandbox` is assumed non-production and normally ignored during scans unless evidence shows production reachability.

## Scan Anchors

- **Production entry points:** `artifacts/payroll/src/main.tsx`, `artifacts/payroll/src/App.tsx`, `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`
- **Route/auth hot spots:** `artifacts/api-server/src/routes/*.ts`, `artifacts/api-server/src/middleware/require-auth.ts`, `artifacts/api-server/src/lib/sessions.ts`, `artifacts/api-server/src/lib/pending-sessions.ts`
- **Sensitive browser flows:** `artifacts/payroll/src/pages/login.tsx`, `verify.tsx`, `verify-card.tsx`, `activate-card.tsx`, `create-account.tsx`, `forgot-*.tsx`, `step4.tsx`, `artifacts/payroll/src/lib/telegram.ts`
- **Data model:** `lib/db/src/schema/*`
- **Dev-only by default:** `artifacts/mockup-sandbox/**`, local scripts and seed helpers unless production reachability is demonstrated

## Threat Categories

### Spoofing

The application uses custom bearer tokens and a multi-step login flow implemented partly in the browser and partly in the API. The system must verify real user credentials and second factors on the server before issuing a session, and session tokens must map to a specific authenticated user identity. Browser-side approval flows or client-controlled tokens must not be trusted as proof of identity.

### Tampering

Authenticated users can reach routes that create, update, delete, and process payroll records. The system must ensure payroll calculations and record mutations occur only for authorized roles and cannot be triggered by arbitrary authenticated or unauthenticated users. The client must never be the enforcement point for business-critical state changes.

### Information Disclosure

This project handles payroll data, card-related verification data, identity data, and uploaded documents. The frontend and backend must not disclose this information to unauthorized users, logs, or third-party services without an explicit product requirement and secure control boundary. Secrets and service tokens must not be embedded in public client code or other user-accessible artifacts.

### Denial of Service

Public authentication and recovery flows must resist brute-force and abuse. Login, OTP issuance, OTP verification, and any expensive processing endpoints should have meaningful rate limits and bounded work so the public deployment cannot be trivially exhausted.

### Elevation of Privilege

All protected API endpoints must enforce both authentication and authorization on the server. Role-bearing data in the database must be used consistently, and sensitive operations such as payroll processing, employee management, and access to payslips must not be exposed through weak session handling, demo-mode authentication, or missing role checks.