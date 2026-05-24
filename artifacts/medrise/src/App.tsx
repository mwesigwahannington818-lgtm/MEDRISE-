import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Services from "@/pages/services";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Appointment from "@/pages/appointment";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import StaffLogin from "@/pages/staff/login";
import StaffDashboard from "@/pages/staff/dashboard";
import PatientLogin from "@/pages/patient/login";
import PatientPortal from "@/pages/patient/portal";
import FeedbackPage from "@/pages/feedback";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/appointment" component={Appointment} />
      <Route path="/feedback" component={FeedbackPage} />
      
      <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard">
          <ProtectedRoute redirectTo="/admin/login" allowedRoles={["admin", "owner"]}>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>

      <Route path="/staff/login" component={StaffLogin} />
        <Route path="/staff/dashboard">
          <ProtectedRoute
            redirectTo="/staff/login"
            allowedRoles={["owner", "doctor", "nurse", "midwife", "receptionist", "staff"]}
          >
            <StaffDashboard />
          </ProtectedRoute>
        </Route>

      <Route path="/patient/login" component={PatientLogin} />
        <Route path="/patient/portal">
          <ProtectedRoute redirectTo="/patient/login" requirePatient>
            <PatientPortal />
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
