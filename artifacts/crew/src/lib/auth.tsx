import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api, getToken, setToken, clearToken, type Employee } from "./api";

interface AuthContextType {
  isAuthenticated: boolean;
  employee: Employee | null;
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string; mustChangePassword?: boolean }>;
  logout: () => Promise<void>;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const EMPLOYEE_KEY = "portalkru_employee";
const MUST_CHANGE_KEY = "portalkru_must_change_password";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(() => {
    try {
      const stored = localStorage.getItem(EMPLOYEE_KEY);
      return stored && getToken() ? (JSON.parse(stored) as Employee) : null;
    } catch {
      return null;
    }
  });
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUST_CHANGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const login = async (
    username: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string; mustChangePassword?: boolean }> => {
    if (!username.trim() || !password.trim()) {
      return { ok: false, error: "Mohon isi username dan kata sandi." };
    }
    try {
      const res = await api<{ sessionToken: string; employee: Employee; mustChangePassword: boolean }>(
        "/auth/login",
        { method: "POST", body: { username, password }, auth: false },
      );
      setToken(res.sessionToken);
      setEmployee(res.employee);
      setMustChangePassword(res.mustChangePassword ?? false);
      localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(res.employee));
      localStorage.setItem(MUST_CHANGE_KEY, String(res.mustChangePassword ?? false));
      return { ok: true, mustChangePassword: res.mustChangePassword ?? false };
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
    setMustChangePassword(false);
    try {
      localStorage.removeItem(EMPLOYEE_KEY);
      localStorage.removeItem(MUST_CHANGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const clearMustChangePasswordState = () => {
    setMustChangePassword(false);
    try {
      localStorage.setItem(MUST_CHANGE_KEY, "false");
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!employee, employee, mustChangePassword, login, logout, clearMustChangePassword: clearMustChangePasswordState }}
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

export function ProtectedRoute({ children, allowMustChange = false }: { children: React.ReactNode; allowMustChange?: boolean }) {
  const { isAuthenticated, mustChangePassword } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (mustChangePassword && !allowMustChange) {
      navigate("/ganti-password");
    }
  }, [isAuthenticated, mustChangePassword, allowMustChange, navigate]);
  if (!isAuthenticated) return null;
  if (mustChangePassword && !allowMustChange) return null;
  return <>{children}</>;
}
