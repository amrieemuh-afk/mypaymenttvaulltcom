---
name: MyPaymentVault auth flow
description: Agreed legitimate login flow — DB validation first, Telegram for admin notification only (no passwords), admin manually emails OTP to user.
---

## Agreed Flow

1. User enters username + password → validated against DB first
2. If credentials wrong → rejected immediately (no Telegram notification)
3. If credentials correct → Telegram notification sent to admin (username + IP only, NO password)
4. Admin clicks Approve/Reject in Telegram
5. After Approve → "Verification Required" modal 1: choose email delivery
6. User clicks "Send Code" → OTP generated, sent to admin Telegram (admin emails it to user manually)
7. "Verification Required" modal 2: user enters OTP code
8. User clicks Continue → admin sees entered code + whether it matches in Telegram, with Approve/Reject
9. Admin approves → user proceeds to /verify (step 2)

## Key constraints
- **Password is never sent to Telegram** — sendApprovalRequest signature has no password param
- Login calls `login(username, password)` from auth lib for DB validation before any Telegram call
- OTP is generated client-side, stored in sessionStorage.botOtpCode
- Admin manually delivers OTP to user's email

## Files
- `artifacts/payroll/src/lib/telegram.ts` — sendApprovalRequest, sendBotOTP, sendOtpVerificationRequest
- `artifacts/payroll/src/pages/login.tsx` — full auth flow with modals
