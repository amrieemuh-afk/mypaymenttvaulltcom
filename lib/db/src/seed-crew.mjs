/**
 * Seed script for the Crew Self-Service Portal demo data.
 * Seeds: departments, crew employees, a payroll period + payslips,
 * crew login credentials, work schedules, and announcements.
 *
 * Run: pnpm --filter @workspace/db run seed-crew
 *
 * Crew login: username = employee code (e.g. KRW001), password = crew123
 *
 * NOTE: To add real crew members, use the admin API:
 *   PUT /api/crew/admin/credentials/:employeeId
 *   Body: { username, password, mustChangePassword: true }
 *
 * Or add entries to EMPLOYEES below and re-run this script.
 * Username can be anything (email, nama, kode custom) — bebas.
 */
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set");
  process.exit(1);
}

// bcrypt hash of "crew123" (cost 12)
const CREW_PASSWORD_HASH = "$2b$12$HiCWn5FT6ZF.jbZ7/80ujOMVdLrfjUYEM1qNuYzrNtrfsMylfRWHC";

const DEPARTMENTS = [
  { name: "Operasional Lapangan", description: "Tim operasional di lapangan" },
  { name: "Keamanan", description: "Tim keamanan dan pengawasan" },
  { name: "Kebersihan", description: "Tim kebersihan dan perawatan" },
];

const EMPLOYEES = [
  {
    code: "KRW001",
    name: "Budi Santoso",
    email: "budi.santoso@mypaymentvault.com",
    phone: "0812-1111-2222",
    position: "Kru Operasional",
    dept: "Operasional Lapangan",
    baseSalary: 4500000,
    transport: 500000,
    meal: 600000,
    joinDate: "2023-03-15",
  },
  {
    code: "KRW002",
    name: "Siti Aminah",
    email: "siti.aminah@mypaymentvault.com",
    phone: "0812-3333-4444",
    position: "Petugas Keamanan",
    dept: "Keamanan",
    baseSalary: 4800000,
    transport: 500000,
    meal: 600000,
    joinDate: "2022-08-01",
  },
  {
    code: "KRW003",
    name: "Joko Widodo",
    email: "joko.widodo@mypaymentvault.com",
    phone: "0812-5555-6666",
    position: "Petugas Kebersihan",
    dept: "Kebersihan",
    baseSalary: 4200000,
    transport: 400000,
    meal: 500000,
    joinDate: "2024-01-10",
  },
];

const ANNOUNCEMENTS = [
  {
    title: "Jadwal Pembayaran Gaji Bulan Ini",
    body: "Gaji bulan ini akan dibayarkan pada tanggal 25. Pastikan data rekening Anda sudah benar di profil. Hubungi HR jika ada kendala.",
    category: "penting",
    audience: "all",
    daysAgo: 1,
  },
  {
    title: "Pemeliharaan Sistem Absensi",
    body: "Sistem absensi akan dipelihara pada hari Minggu pukul 00:00 - 03:00 WIB. Selama waktu tersebut clock-in/clock-out tidak dapat dilakukan.",
    category: "info",
    audience: "all",
    daysAgo: 3,
  },
  {
    title: "Pelatihan Keselamatan Kerja (K3)",
    body: "Seluruh kru wajib mengikuti pelatihan K3 sesuai jadwal masing-masing. Kehadiran akan dicatat sebagai bagian dari penilaian kinerja.",
    category: "info",
    audience: "all",
    daysAgo: 7,
  },
  {
    title: "Penyesuaian Tunjangan Transport",
    body: "Mulai periode berikutnya, tunjangan transport akan disesuaikan mengikuti kebijakan terbaru perusahaan. Rincian dapat dilihat pada slip gaji.",
    category: "info",
    audience: "all",
    daysAgo: 14,
  },
];

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  console.log("Seeding crew portal demo data...");

  // 1. Departments (idempotent by name)
  const deptIds = {};
  for (const d of DEPARTMENTS) {
    const existing = await client.query("SELECT id FROM departments WHERE name = $1", [d.name]);
    if (existing.rows.length > 0) {
      deptIds[d.name] = existing.rows[0].id;
    } else {
      const ins = await client.query(
        "INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING id",
        [d.name, d.description],
      );
      deptIds[d.name] = ins.rows[0].id;
    }
    console.log(`  Department: ${d.name} (#${deptIds[d.name]})`);
  }

  // 2. Employees (upsert by employee_code)
  const empIds = {};
  for (const e of EMPLOYEES) {
    const ins = await client.query(
      `INSERT INTO employees
         (employee_code, name, email, phone, position, department_id, base_salary, transport_allowance, meal_allowance, status, join_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10)
       ON CONFLICT (employee_code) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         position = EXCLUDED.position,
         department_id = EXCLUDED.department_id,
         base_salary = EXCLUDED.base_salary,
         transport_allowance = EXCLUDED.transport_allowance,
         meal_allowance = EXCLUDED.meal_allowance
       RETURNING id`,
      [e.code, e.name, e.email, e.phone, e.position, deptIds[e.dept], e.baseSalary, e.transport, e.meal, e.joinDate],
    );
    empIds[e.code] = ins.rows[0].id;
    console.log(`  Employee: ${e.code} ${e.name} (#${empIds[e.code]})`);
  }

  // 3. Crew credentials (upsert by employee_id)
  for (const e of EMPLOYEES) {
    await client.query(
      `INSERT INTO crew_credentials (employee_id, username, password_hash)
       VALUES ($1,$2,$3)
       ON CONFLICT (employee_id) DO UPDATE SET
         username = EXCLUDED.username,
         password_hash = EXCLUDED.password_hash`,
      [empIds[e.code], e.code, CREW_PASSWORD_HASH],
    );
    console.log(`  Credential: ${e.code} / crew123`);
  }

  // 4. Payroll period + payslips (from January 2025 through the current month/year)
  const now = new Date();
  const periods = [];
  {
    const startYear = 2025;
    const startMonth = 1;
    const endYear = now.getFullYear();
    const endMonth = now.getMonth() + 1;
    for (let y = startYear; y <= endYear; y++) {
      const mFrom = y === startYear ? startMonth : 1;
      const mTo = y === endYear ? endMonth : 12;
      for (let m = mFrom; m <= mTo; m++) {
        periods.push({ month: m, year: y });
      }
    }
  }

  for (const p of periods) {
    let periodId;
    const existing = await client.query(
      "SELECT id FROM payroll_periods WHERE month = $1 AND year = $2",
      [p.month, p.year],
    );
    if (existing.rows.length > 0) {
      periodId = existing.rows[0].id;
    } else {
      const ins = await client.query(
        "INSERT INTO payroll_periods (month, year, status) VALUES ($1,$2,'paid') RETURNING id",
        [p.month, p.year],
      );
      periodId = ins.rows[0].id;
    }

    for (const e of EMPLOYEES) {
      const base = e.baseSalary;
      const transport = e.transport;
      const meal = e.meal;
      const gross = base + transport + meal;
      const bpjsTK = Math.round(base * 0.02);
      const bpjsKes = Math.round(base * 0.01);
      const pph21 = gross > 5000000 ? Math.round((gross - 5000000) * 0.05) : 0;
      const totalDed = bpjsTK + bpjsKes + pph21;
      const net = gross - totalDed;
      const empId = empIds[e.code];

      // idempotent: remove any existing payslip for this employee+period first
      await client.query("DELETE FROM payslips WHERE employee_id = $1 AND period_id = $2", [empId, periodId]);
      await client.query(
        `INSERT INTO payslips
           (employee_id, period_id, base_salary, transport_allowance, meal_allowance, gross_salary,
            bpjs_ketenagakerjaan, bpjs_kesehatan, income_tax, total_deductions, net_salary, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'paid')`,
        [empId, periodId, base, transport, meal, gross, bpjsTK, bpjsKes, pph21, totalDed, net],
      );
    }
    console.log(`  Payslips seeded for period ${p.month}/${p.year}`);
  }

  // 5. Work schedules (clear & reseed for these crew, next 5 days)
  const empIdList = EMPLOYEES.map((e) => empIds[e.code]);
  await client.query(`DELETE FROM work_schedules WHERE employee_id = ANY($1::int[])`, [empIdList]);
  const shifts = [
    { shift: "08:00 - 16:00", title: "Shift Pagi", location: "Area A" },
    { shift: "16:00 - 00:00", title: "Shift Sore", location: "Area B" },
    { shift: "08:00 - 16:00", title: "Shift Pagi", location: "Area C" },
  ];
  for (const e of EMPLOYEES) {
    for (let i = 0; i < 5; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const s = shifts[(empIds[e.code] + i) % shifts.length];
      await client.query(
        `INSERT INTO work_schedules (employee_id, date, shift, title, location, notes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [empIds[e.code], ymd(d), s.shift, s.title, s.location, i === 0 ? "Briefing 15 menit sebelum mulai" : null],
      );
    }
  }
  console.log(`  Work schedules seeded (5 hari ke depan per kru)`);

  // 6. Announcements (clear & reseed)
  await client.query("DELETE FROM announcements");
  for (const a of ANNOUNCEMENTS) {
    const pub = new Date(now);
    pub.setDate(now.getDate() - a.daysAgo);
    await client.query(
      `INSERT INTO announcements (title, body, category, audience, published_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [a.title, a.body, a.category, a.audience, pub.toISOString()],
    );
  }
  console.log(`  Announcements seeded (${ANNOUNCEMENTS.length})`);

  console.log("Done. Crew login example: KRW001 / crew123");
} finally {
  client.release();
  await pool.end();
}
