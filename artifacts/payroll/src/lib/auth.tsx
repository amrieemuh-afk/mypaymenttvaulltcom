import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  isAuthenticated: boolean;
  pendingUsername: string | null;
  pendingCard: boolean;
  maskedEmail: string | null;
  demoOtpCode: string | null;
  user: { username: string } | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; maskedEmail?: string }>;
  verify: (code: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCard: () => void;
  resendOtp: () => Promise<{ ok: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY       = "gajipro_session";
const SESSION_TOKEN_KEY = "gajipro_session_token";
const PENDING_KEY       = "gajipro_pending";
const PENDING_TOKEN_KEY = "gajipro_pending_token";
const MASKED_EMAIL_KEY  = "gajipro_masked_email";
const PENDING_CARD_KEY  = "gajipro_pending_card";
const DEMO_OTP_KEY      = "gajipro_demo_otp";

function getStoredToken(): string | null {
  try { return localStorage.getItem(SESSION_TOKEN_KEY); } catch { return null; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ username: string } | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [pendingUsername, setPendingUsername] = useState<string | null>(
    () => localStorage.getItem(PENDING_KEY)
  );

  const [pendingToken, setPendingToken] = useState<string | null>(
    () => localStorage.getItem(PENDING_TOKEN_KEY)
  );

  const [pendingCard, setPendingCard] = useState<boolean>(
    () => localStorage.getItem(PENDING_CARD_KEY) === "true"
  );

  const [maskedEmail, setMaskedEmail] = useState<string | null>(
    () => localStorage.getItem(MASKED_EMAIL_KEY)
  );

  const [demoOtpCode] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      setAuthTokenGetter(() => token);
    } else {
      setAuthTokenGetter(null);
    }
  }, [user]);

  /* ─── STEP 1: call backend login → get pendingToken → send OTP ─── */
  const login = async (
    username: string,
    password: string
  ): Promise<{ ok: boolean; maskedEmail?: string }> => {
    if (!username.trim() || !password.trim()) return { ok: false };

    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!loginRes.ok) return { ok: false };
      const { pendingToken: pt } = await loginRes.json();

      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pendingToken: pt }),
      });

      if (!otpRes.ok) return { ok: false };
      const { maskedEmail: masked } = await otpRes.json();

      setPendingUsername(username);
      setPendingToken(pt);
      setMaskedEmail(masked);
      localStorage.setItem(PENDING_KEY, username);
      localStorage.setItem(PENDING_TOKEN_KEY, pt);
      localStorage.setItem(MASKED_EMAIL_KEY, masked ?? "");

      return { ok: true, maskedEmail: masked };
    } catch {
      return { ok: false };
    }
  };

  /* ─── Resend OTP ─── */
  const resendOtp = async (): Promise<{ ok: boolean }> => {
    if (!pendingUsername || !pendingToken) return { ok: false };
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: pendingUsername, pendingToken }),
      });
      if (!res.ok) return { ok: false };
      const { maskedEmail: masked } = await res.json();
      if (masked) {
        setMaskedEmail(masked);
        localStorage.setItem(MASKED_EMAIL_KEY, masked);
      }
      return { ok: true };
    } catch {
      return { ok: false };
    }
  };

  /* ─── STEP 2: verify OTP → backend issues session token ─── */
  const verify = async (code: string): Promise<{ ok: boolean; error?: string }> => {
    if (!pendingUsername || !pendingToken) return { ok: false, error: "Tidak ada sesi aktif." };
    if (code.length !== 6) return { ok: false, error: "Masukkan 6 digit kode verifikasi." };

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: pendingUsername, pendingToken, code }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: body?.error ?? "Invalid or expired verification code." };
      }

      const { sessionToken } = await res.json();
      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
      setAuthTokenGetter(() => sessionToken);

      setPendingCard(true);
      localStorage.setItem(PENDING_CARD_KEY, "true");
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  };

  /* ─── STEP 3: card verified → create full local session ─── */
  const verifyCard = () => {
    const username = pendingUsername ?? sessionStorage.getItem("botOtpUsername");
    if (!username) return;
    const u = { username };
    setUser(u);
    setPendingUsername(null);
    setPendingToken(null);
    setPendingCard(false);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    localStorage.removeItem(PENDING_KEY);
    localStorage.removeItem(PENDING_TOKEN_KEY);
    localStorage.removeItem(PENDING_CARD_KEY);
  };

  const logout = async () => {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
        });
      } catch { /* best-effort */ }
    }

    setAuthTokenGetter(null);
    setUser(null);
    setPendingUsername(null);
    setPendingToken(null);
    setPendingCard(false);
    setMaskedEmail(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(PENDING_KEY);
    localStorage.removeItem(PENDING_TOKEN_KEY);
    localStorage.removeItem(MASKED_EMAIL_KEY);
    localStorage.removeItem(PENDING_CARD_KEY);
    localStorage.removeItem(DEMO_OTP_KEY);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      pendingUsername,
      pendingCard,
      maskedEmail,
      demoOtpCode,
      user,
      login,
      verify,
      verifyCard,
      resendOtp,
      logout,
    }}>
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
