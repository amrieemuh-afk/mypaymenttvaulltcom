# SEO Strategy

## In scope
- Public auth and recovery routes in `artifacts/payroll`:
  - `/login`
  - `/create-account`
  - `/forgot-username`
  - `/forgot-password`
  - `/activate-card`
  - `/verify`
  - `/verify-card`
- Shared HTML shell, static hosting rules, and public metadata for the payroll web artifact

## Out of scope
- Authenticated payroll dashboard routes wrapped in `ProtectedRoute`
- API endpoints under `/api`
- Internal/admin workflows that require an authenticated session

## Product intent
- Source code indicates a private payroll and account-access portal branded as “Sistem Penggajian” / “MyPaymentVault”, not a public marketing site.

## SEO objective
- Prevent login-gated and utility URLs from polluting search results.
- Ensure any public URLs that remain indexable or shareable have trustworthy metadata and policy links.

## Target audience
- Existing employees or account holders using the payroll portal.

## Primary keywords
- None targeted from source; this appears to be a utility/authentication product surface rather than a marketing SEO surface.

## Dismissed categories
- (None yet)
