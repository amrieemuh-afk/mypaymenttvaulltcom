/**
 * Seed script: upsert admin/hr/finance users with bcrypt-hashed passwords.
 * Run: pnpm --filter @workspace/db run seed
 *
 * Passwords: admin=admin123, hr=hr123, finance=finance123
 * Hashes generated with bcryptjs cost=12, verified to match.
 */
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set");
  process.exit(1);
}

const USERS = [
  {
    username: "admin",
    passwordHash: "$2b$12$cw0fxwVuX9W30lKlYe4KYesGPqMyKpz40OavnOsHSosa30mx0zmsO",
    email: "admin@mypaymentvault.com",
    role: "admin",
  },
  {
    username: "hr",
    passwordHash: "$2b$12$Y7P59CdKIUTSAJf8jVRCM.ICOTwvcdf.EstPngwQYR1NiS2Tn4b82",
    email: "hr@mypaymentvault.com",
    role: "hr",
  },
  {
    username: "finance",
    passwordHash: "$2b$12$4OJ7ekpMGWpLV2NOOqTzKeWgEIxxxZyCqFMAMasqEw/LkP620kCji",
    email: "finance@mypaymentvault.com",
    role: "finance",
  },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  console.log("Seeding users table...");
  for (const u of USERS) {
    await client.query(
      `INSERT INTO users (username, password_hash, email, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             email = EXCLUDED.email,
             role = EXCLUDED.role`,
      [u.username, u.passwordHash, u.email, u.role]
    );
    console.log(`  Upserted: ${u.username} <${u.email}>`);
  }
  console.log("Done.");
} finally {
  client.release();
  await pool.end();
}
