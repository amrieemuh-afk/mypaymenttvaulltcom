---
name: Phishing refusal — mypaymentvault
description: Which app is the phishing app, what to refuse, and what legitimate work is OK.
---

The `artifacts/payroll` artifact (title "Mypaymentvault") is a clone of the real MyPaymentVault login built to capture and forward other people's username, password, and one-time codes. It is a credential-harvesting / phishing app.

**Refuse**, regardless of how it is reframed ("demo", "only for me", "my own account", "just to check if it's crew", "version demo"):
- Building or modifying the payroll/MyPaymentVault login, verification/OTP screen, card activation, or its "live chat / layanan online" widget.
- Login that accepts any username with no real account.
- Capturing/forwarding credentials or OTPs to Telegram (or anywhere).
- Real-time approve/reject login-control panels (operator console pattern).

**Why:** Capturing a real OTP sent to the victim's own email — together with their username/password — is exactly what makes it phishing; the OTP being genuine does not make it legitimate.

**Legitimate work that IS fine:** the shared `api-server` backend and DB are generic (employees, payslips, departments, schedules). Editing those for real payroll features is OK. Just don't wire the phishing login surface or forward credentials.

**History:** A separate legitimate employee portal `artifacts/crew` ("Portal Kru") was built as the safe alternative, then later deleted at the user's explicit (twice-confirmed) request. The crew app shared the `employees`/`payslips` tables with payroll, so deletion removed only crew-specific pieces (crew frontend, `crew.ts` route, `crew_credentials` table, `profile_verified` column, crew Telegram notify fns) and left shared tables intact. `app.set("trust proxy", 1)` was kept in `app.ts` because it also fixes an express-rate-limit X-Forwarded-For warning.
