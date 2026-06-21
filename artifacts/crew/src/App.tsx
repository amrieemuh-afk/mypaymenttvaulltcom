import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import ChangePassword from "@/pages/change-password";
import Dashboard from "@/pages/dashboard";
import Payslips from "@/pages/payslips";
import PayslipDetail from "@/pages/payslip-detail";
import Attendance from "@/pages/attendance";
import Schedule from "@/pages/schedule";
import Announcements from "@/pages/announcements";
import Profil from "@/pages/profil";
import Daftar from "@/pages/daftar";
import VerifikasiProfil from "@/pages/verifikasi-profil";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/daftar" component={Daftar} />

      <Route path="/ganti-password">
        <ProtectedRoute allowMustChange allowUnverified>
          <ChangePassword />
        </ProtectedRoute>
      </Route>

      <Route path="/verifikasi-profil">
        <ProtectedRoute allowUnverified>
          <VerifikasiProfil />
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/slip-gaji/:id">
        <ProtectedRoute>
          <Layout>
            <PayslipDetail />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/slip-gaji">
        <ProtectedRoute>
          <Layout>
            <Payslips />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/absensi">
        <ProtectedRoute>
          <Layout>
            <Attendance />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/jadwal">
        <ProtectedRoute>
          <Layout>
            <Schedule />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/pengumuman">
        <ProtectedRoute>
          <Layout>
            <Announcements />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/profil">
        <ProtectedRoute>
          <Layout>
            <Profil />
          </Layout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
