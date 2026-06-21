const TOKEN_KEY = "portalkru_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/crew${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

/* ─── Types ─── */
export interface Employee {
  id: number;
  name: string;
  employeeCode: string;
}

export interface Profile {
  id: number;
  employeeCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  departmentId: number | null;
  departmentName: string | null;
  baseSalary: number;
  transportAllowance: number;
  mealAllowance: number;
  status: string;
  joinDate: string | null;
}

export interface PayslipSummary {
  id: number;
  periodId: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  createdAt: string;
  periodMonth: number | null;
  periodYear: number | null;
}

export interface PayslipDetail {
  id: number;
  employeeId: number;
  periodId: number;
  employeeName: string | null;
  employeeCode: string | null;
  position: string | null;
  departmentName: string | null;
  periodMonth: number | null;
  periodYear: number | null;
  baseSalary: number;
  transportAllowance: number;
  mealAllowance: number;
  grossSalary: number;
  bpjsKetenagakerjaan: number;
  bpjsKesehatan: number;
  incomeTax: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: number;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: string;
}

export interface AttendanceResponse {
  today: AttendanceRecord | null;
  history: AttendanceRecord[];
}

export interface WorkSchedule {
  id: number;
  date: string;
  shift: string;
  title: string;
  location: string | null;
  notes: string | null;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  category: string;
  audience: string;
  publishedAt: string;
}
