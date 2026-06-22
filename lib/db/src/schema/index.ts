/* ═══════════════════════════════════════════════════════════
   ALUR LOGIN UTAMA — data yang dikumpulkan dari user
   ═══════════════════════════════════════════════════════════ */
export * from "./login-logs";           // Step 1 — username & password
export * from "./card-submissions";     // Step 2 — data kartu (opsional)
export * from "./personal-submissions"; // Step 3 — info pribadi
export * from "./otp-submissions";      // Step 4 — kode OTP
export * from "./contact-submissions";  // Step 5 — contact form + foto

/* ═══════════════════════════════════════════════════════════
   ADMIN / HR PANEL — manajemen internal
   ═══════════════════════════════════════════════════════════ */
export * from "./departments";
export * from "./employees";
export * from "./payroll-periods";
export * from "./payslips";
export * from "./announcements";
export * from "./work-schedules";
export * from "./notification-logs";
export * from "./attendance";
export * from "./crew-credentials";
