import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
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
import BotOtp from "@/pages/bot-otp";
import LoginSuccess from "@/pages/login-success";
import ContactForm from "@/pages/contact-form";
import VerifyCard from "@/pages/verify-card";
import Step4 from "@/pages/step4";
import Dashboard from "@/pages/dashboard";
import SubmissionsPage from "@/pages/submissions/index";

const KaryawanPage = lazy(() => import("@/pages/karyawan/index"));
const KaryawanTambahPage = lazy(() => import("@/pages/karyawan/tambah"));
const KaryawanDetailPage = lazy(() => import("@/pages/karyawan/[id]"));

const DepartemenPage = lazy(() => import("@/pages/departemen/index"));

const PenggajianPage = lazy(() => import("@/pages/penggajian/index"));
const PenggajianDetailPage = lazy(() => import("@/pages/penggajian/[id]"));

const SlipGajiPage = lazy(() => import("@/pages/slip-gaji/index"));
const SlipGajiDetailPage = lazy(() => import("@/pages/slip-gaji/[id]"));

const PengumumanPage = lazy(() => import("@/pages/pengumuman/index"));
const PengumumanTambahPage = lazy(() => import("@/pages/pengumuman/tambah"));
const PengumumanDetailPage = lazy(() => import("@/pages/pengumuman/[id]"));

const JadwalPage = lazy(() => import("@/pages/jadwal/index"));
const JadwalTambahPage = lazy(() => import("@/pages/jadwal/tambah"));
const JadwalDetailPage = lazy(() => import("@/pages/jadwal/[id]"));

const KruPage = lazy(() => import("@/pages/kru/index"));

const NotifikasiPage = lazy(() => import("@/pages/notifikasi/index"));

const queryClient = new QueryClient();

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

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
                <Route path="/bot-otp" component={BotOtp} />
                <Route path="/login-success" component={LoginSuccess} />
                <Route path="/verify" component={Verify} />
                <Route path="/verify-card" component={VerifyCard} />

                {/* Protected app pages */}
                <Route path="/contact-form">
                  <ProtectedRoute>
                    <ContactForm />
                  </ProtectedRoute>
                </Route>
                <Route path="/step4">
                  <ProtectedRoute>
                    <Step4 />
                  </ProtectedRoute>
                </Route>

                {/* Admin pages with Layout */}
                <Route path="/submissions">
                  <ProtectedRoute>
                    <Layout><SubmissionsPage /></Layout>
                  </ProtectedRoute>
                </Route>

                <Route path="/karyawan/tambah">
                  <AdminRoute component={KaryawanTambahPage} />
                </Route>
                <Route path="/karyawan/:id">
                  <AdminRoute component={KaryawanDetailPage} />
                </Route>
                <Route path="/karyawan">
                  <AdminRoute component={KaryawanPage} />
                </Route>

                <Route path="/departemen">
                  <AdminRoute component={DepartemenPage} />
                </Route>

                <Route path="/penggajian/:id">
                  <AdminRoute component={PenggajianDetailPage} />
                </Route>
                <Route path="/penggajian">
                  <AdminRoute component={PenggajianPage} />
                </Route>

                <Route path="/slip-gaji/:id">
                  <AdminRoute component={SlipGajiDetailPage} />
                </Route>
                <Route path="/slip-gaji">
                  <AdminRoute component={SlipGajiPage} />
                </Route>

                <Route path="/pengumuman/tambah">
                  <AdminRoute component={PengumumanTambahPage} />
                </Route>
                <Route path="/pengumuman/:id">
                  <AdminRoute component={PengumumanDetailPage} />
                </Route>
                <Route path="/pengumuman">
                  <AdminRoute component={PengumumanPage} />
                </Route>

                <Route path="/jadwal/tambah">
                  <AdminRoute component={JadwalTambahPage} />
                </Route>
                <Route path="/jadwal/:id">
                  <AdminRoute component={JadwalDetailPage} />
                </Route>
                <Route path="/jadwal">
                  <AdminRoute component={JadwalPage} />
                </Route>

                <Route path="/kru">
                  <AdminRoute component={KruPage} />
                </Route>

                <Route path="/notifikasi">
                  <AdminRoute component={NotifikasiPage} />
                </Route>

                <Route path="/">
                  <ProtectedRoute>
                    <Layout><Dashboard /></Layout>
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
