import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api, getToken, setToken, clearToken, type Employee } from "./api";

interface AuthContextType {
  isAuthenticated: boolean;
  employee: Employee | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const EMPLOYEE_KEY = "portalkru_employee";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(() => {
    try {
      const stored = localStorage.getItem(EMPLOYEE_KEY);
      return stored && getToken() ? (JSON.parse(stored) as Employee) : null;
    } catch {
      return null;
    }
  });

  const login = async (
    username: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!username.trim() || !password.trim()) {
      return { ok: false, error: "Mohon isi kode kru dan kata sandi." };
    }
    try {
      const res = await api<{ sessionToken: string; employee: Employee }>(
        "/auth/login",
        { method: "POST", body: { username, password }, auth: false },
      );
      setToken(res.sessionToken);
      setEmployee(res.employee);
      localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(res.employee));
      return { ok: true };
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Gagal masuk. Coba lagi.";
      return { ok: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* best-effort */
    }
    clearToken();
    setEmployee(null);
    try {
      localStorage.removeItem(EMPLOYEE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!employee, employee, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
