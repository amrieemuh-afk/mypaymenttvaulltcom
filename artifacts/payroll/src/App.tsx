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
import BotOtp from "@/pages/bot-otp";
import LoginSuccess from "@/pages/login-success";
import ContactForm from "@/pages/contact-form";
import VerifyCard from "@/pages/verify-card";
import Step4 from "@/pages/step4";
import Dashboard from "@/pages/dashboard";
import SubmissionsPage from "@/pages/submissions/index";

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
                <Route path="/submissions">
                  <ProtectedRoute>
                    <Layout><SubmissionsPage /></Layout>
                  </ProtectedRoute>
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
