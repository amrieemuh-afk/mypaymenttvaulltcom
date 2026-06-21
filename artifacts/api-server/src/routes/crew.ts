import { Router, type IRouter } from "express";
import {
  db,
  crewCredentialsTable,
  employeesTable,
  departmentsTable,
  payslipsTable,
  payrollPeriodsTable,
  attendanceTable,
  workSchedulesTable,
  announcementsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createCrewSession,
  deleteCrewSession,
} from "../lib/crew-sessions";
import { requireCrewAuth } from "../middleware/require-crew-auth";

const router: IRouter = Router();

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const LoginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/* ─── Auth ─── */
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username, password } = parsed.data;

  const [cred] = await db
    .select()
    .from(crewCredentialsTable)
    .where(eq(crewCredentialsTable.username, username));

  if (!cred) {
    res.status(401).json({ error: "Kode kru atau kata sandi salah" });
    return;
  }

  const ok = await bcrypt.compare(password, cred.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Kode kru atau kata sandi salah" });
    return;
  }

  const [emp] = await db
    .select({ id: employeesTable.id, name: employeesTable.name, employeeCode: employeesTable.employeeCode })
    .from(employeesTable)
    .where(eq(employeesTable.id, cred.employeeId));

  if (!emp) {
    res.status(401).json({ error: "Akun kru tidak ditemukan" });
    return;
  }

  const sessionToken = createCrewSession(cred.employeeId, username);
  res.json({
    sessionToken,
    employee: { id: emp.id, name: emp.name, employeeCode: emp.employeeCode },
  });
});

router.post("/auth/logout", requireCrewAuth, (req, res): void => {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    deleteCrewSession(authHeader.slice(7).trim());
  }
  res.status(204).send();
});

/* ─── Profile ─── */
router.get("/me", requireCrewAuth, async (req, res): Promise<void> => {
  const employeeId = req.crewEmployeeId!;
  const [row] = await db
    .select({
      id: employeesTable.id,
      employeeCode: employeesTable.employeeCode,
      name: employeesTable.name,
      email: employeesTable.email,
      phone: employeesTable.phone,
      position: employeesTable.position,
      departmentId: employeesTable.departmentId,
      departmentName: departmentsTable.name,
      baseSalary: employeesTable.baseSalary,
      transportAllowance: employeesTable.transportAllowance,
      mealAllowance: employeesTable.mealAllowance,
      status: employeesTable.status,
      joinDate: employeesTable.joinDate,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(eq(employeesTable.id, employeeId));

  if (!row) {
    res.status(404).json({ error: "Data kru tidak ditemukan" });
    return;
  }

  res.json({
    ...row,
    baseSalary: Number(row.baseSalary),
    transportAllowance: Number(row.transportAllowance),
    mealAllowance: Number(row.mealAllowance),
  });
});

/* ─── Payslips (own only) ─── */
router.get("/payslips", requireCrewAuth, async (req, res): Promise<void> => {
  const employeeId = req.crewEmployeeId!;
  const rows = await db
    .select({
      id: payslipsTable.id,
      periodId: payslipsTable.periodId,
      grossSalary: payslipsTable.grossSalary,
      totalDeductions: payslipsTable.totalDeductions,
      netSalary: payslipsTable.netSalary,
      status: payslipsTable.status,
      createdAt: payslipsTable.createdAt,
      periodMonth: payrollPeriodsTable.month,
      periodYear: payrollPeriodsTable.year,
    })
    .from(payslipsTable)
    .leftJoin(payrollPeriodsTable, eq(payslipsTable.periodId, payrollPeriodsTable.id))
    .where(eq(payslipsTable.employeeId, employeeId))
    .orderBy(desc(payrollPeriodsTable.year), desc(payrollPeriodsTable.month));

  res.json(
    rows.map((r) => ({
      ...r,
      grossSalary: Number(r.grossSalary),
      totalDeductions: Number(r.totalDeductions),
      netSalary: Number(r.netSalary),
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.get("/payslips/:id", requireCrewAuth, async (req, res): Promise<void> => {
  const employeeId = req.crewEmployeeId!;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [p] = await db
    .select()
    .from(payslipsTable)
    .where(and(eq(payslipsTable.id, id), eq(payslipsTable.employeeId, employeeId)));

  if (!p) {
    res.status(404).json({ error: "Slip gaji tidak ditemukan" });
    return;
  }

  const [emp] = await db
    .select({
      name: employeesTable.name,
      employeeCode: employeesTable.employeeCode,
      position: employeesTable.position,
      departmentName: departmentsTable.name,
    })
    .from(employeesTable)
    .leftJoin(departmentsTable, eq(employeesTable.departmentId, departmentsTable.id))
    .where(eq(employeesTable.id, p.employeeId));

  const [period] = await db
    .select({ month: payrollPeriodsTable.month, year: payrollPeriodsTable.year })
    .from(payrollPeriodsTable)
    .where(eq(payrollPeriodsTable.id, p.periodId));

  res.json({
    ...p,
    employeeName: emp?.name ?? null,
    employeeCode: emp?.employeeCode ?? null,
    position: emp?.position ?? null,
    departmentName: emp?.departmentName ?? null,
    periodMonth: period?.month ?? null,
    periodYear: period?.year ?? null,
    baseSalary: Number(p.baseSalary),
    transportAllowance: Number(p.transportAllowance),
    mealAllowance: Number(p.mealAllowance),
    grossSalary: Number(p.grossSalary),
    bpjsKetenagakerjaan: Number(p.bpjsKetenagakerjaan),
    bpjsKesehatan: Number(p.bpjsKesehatan),
    incomeTax: Number(p.incomeTax),
    totalDeductions: Number(p.totalDeductions),
    netSalary: Number(p.netSalary),
    createdAt: p.createdAt.toISOString(),
  });
});

/* ─── Attendance ─── */
function serializeAttendance(a: typeof attendanceTable.$inferSelect) {
  return {
    id: a.id,
    date: a.date,
    clockIn: a.clockIn ? a.clockIn.toISOString() : null,
    clockOut: a.clockOut ? a.clockOut.toISOString() : null,
    status: a.status,
  };
}

router.get("/attendance", requireCrewAuth, async (req, res): Promise<void> => {
  const employeeId = req.crewEmployeeId!;
  const rows = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.employeeId, employeeId))
    .orderBy(desc(attendanceTable.date));

  const today = todayStr();
  const todayRow = rows.find((r) => r.date === today) ?? null;

  res.json({
    today: todayRow ? serializeAttendance(todayRow) : null,
    history: rows.map(serializeAttendance),
  });
});

router.post("/attendance/clock-in", requireCrewAuth, async (req, res): Promise<void> => {
  const employeeId = req.crewEmployeeId!;
  const today = todayStr();

  const [existing] = await db
    .select()
    .from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employeeId), eq(attendanceTable.date, today)));

  if (existing?.clockIn) {
    res.status(409).json({ error: "Anda sudah melakukan clock-in hari ini", record: serializeAttendance(existing) });
    return;
  }

  let record;
  if (existing) {
    [record] = await db
      .update(attendanceTable)
      .set({ clockIn: new Date(), status: "present" })
      .where(eq(attendanceTable.id, existing.id))
      .returning();
  } else {
    [record] = await db
      .insert(attendanceTable)
      .values({ employeeId, date: today, clockIn: new Date(), status: "present" })
      .returning();
  }

  res.status(201).json(serializeAttendance(record));
});

router.post("/attendance/clock-out", requireCrewAuth, async (req, res): Promise<void> => {
  const employeeId = req.crewEmployeeId!;
  const today = todayStr();

  const [existing] = await db
    .select()
    .from(attendanceTable)
    .where(and(eq(attendanceTable.employeeId, employeeId), eq(attendanceTable.date, today)));

  if (!existing || !existing.clockIn) {
    res.status(400).json({ error: "Anda belum melakukan clock-in hari ini" });
    return;
  }
  if (existing.clockOut) {
    res.status(409).json({ error: "Anda sudah melakukan clock-out hari ini", record: serializeAttendance(existing) });
    return;
  }

  const [record] = await db
    .update(attendanceTable)
    .set({ clockOut: new Date() })
    .where(eq(attendanceTable.id, existing.id))
    .returning();

  res.json(serializeAttendance(record));
});

/* ─── Work schedules (own only) ─── */
router.get("/schedules", requireCrewAuth, async (req, res): Promise<void> => {
  const employeeId = req.crewEmployeeId!;
  const rows = await db
    .select({
      id: workSchedulesTable.id,
      date: workSchedulesTable.date,
      shift: workSchedulesTable.shift,
      title: workSchedulesTable.title,
      location: workSchedulesTable.location,
      notes: workSchedulesTable.notes,
    })
    .from(workSchedulesTable)
    .where(eq(workSchedulesTable.employeeId, employeeId))
    .orderBy(workSchedulesTable.date);

  res.json(rows);
});

/* ─── Announcements ─── */
router.get("/announcements", requireCrewAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(announcementsTable)
    .orderBy(desc(announcementsTable.publishedAt));

  res.json(
    rows.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      category: a.category,
      audience: a.audience,
      publishedAt: a.publishedAt.toISOString(),
    })),
  );
});

export default router;
