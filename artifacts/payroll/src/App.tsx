import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import CreateAccount from "@/pages/create-account";
import ForgotUsername from "@/pages/forgot-username";
import ForgotPassword from "@/pages/forgot-password";
import ActivateCard from "@/pages/activate-card";
import Verify from "@/pages/verify";
import VerifyCard from "@/pages/verify-card";
import Dashboard from "@/pages/dashboard";
import EmployeeList from "@/pages/karyawan/index";
import AddEmployee from "@/pages/karyawan/tambah";
import EditEmployee from "@/pages/karyawan/[id]";
import DepartmentList from "@/pages/departemen/index";
import PayrollPeriodList from "@/pages/penggajian/index";
import PayrollPeriodDetail from "@/pages/penggajian/[id]";
import PayslipList from "@/pages/slip-gaji/index";
import PayslipDetail from "@/pages/slip-gaji/[id]";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <I18nProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Switch>
                {/* Public auth pages */}
                <Route path="/login" component={Login} />
                <Route path="/create-account" component={CreateAccount} />
                <Route path="/forgot-username" component={ForgotUsername} />
                <Route path="/forgot-password" component={ForgotPassword} />
                <Route path="/activate-card" component={ActivateCard} />
                <Route path="/verify" component={Verify} />
                <Route path="/verify-card" component={VerifyCard} />

                {/* Protected app pages */}
                <Route path="/">
                  <ProtectedRoute>
                    <Layout><Dashboard /></Layout>
                  </ProtectedRoute>
                </Route>
                <Route path="/karyawan/tambah">
                  <ProtectedRoute>
                    <Layout><AddEmployee /></Layout>
                  </ProtectedRoute>
                </Route>
                <Route path="/karyawan/:id">
                  <ProtectedRoute>
                    <Layout><EditEmployee /></Layout>
                  </ProtectedRoute>
                </Route>
                <Route path="/karyawan">
                  <ProtectedRoute>
                    <Layout><EmployeeList /></Layout>
                  </ProtectedRoute>
                </Route>
                <Route path="/departemen">
                  <ProtectedRoute>
                    <Layout><DepartmentList /></Layout>
                  </ProtectedRoute>
                </Route>
                <Route path="/penggajian/:id">
                  <ProtectedRoute>
                    <Layout><PayrollPeriodDetail /></Layout>
                  </ProtectedRoute>
                </Route>
                <Route path="/penggajian">
                  <ProtectedRoute>
                    <Layout><PayrollPeriodList /></Layout>
                  </ProtectedRoute>
                </Route>
                <Route path="/slip-gaji/:id">
                  <ProtectedRoute>
                    <Layout><PayslipDetail /></Layout>
                  </ProtectedRoute>
                </Route>
                <Route path="/slip-gaji">
                  <ProtectedRoute>
                    <Layout><PayslipList /></Layout>
                  </ProtectedRoute>
                </Route>
                <Route component={NotFound} />
              </Switch>
            </WouterRouter>
          </I18nProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
