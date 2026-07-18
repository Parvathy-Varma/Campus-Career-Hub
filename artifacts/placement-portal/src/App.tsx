import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminPostings from "@/pages/admin/Postings";
import AdminPostingDetail from "@/pages/admin/PostingDetail";
import AdminCompanies from "@/pages/admin/Companies";
import StudentDashboard from "@/pages/student/Dashboard";
import StudentPostings from "@/pages/student/Postings";
import StudentApplications from "@/pages/student/Applications";
import StudentProfile from "@/pages/student/Profile";
import AdminApplications from "@/pages/admin/Applications";
import CompanyDashboard from "@/pages/company/Dashboard";
import NewPosting from "@/pages/company/NewPosting";
import CompanyPostingDetail from "@/pages/company/PostingDetail";

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-mono text-muted-foreground">Loading...</div>;
  if (!user) return <Login />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-8 text-destructive">Unauthorized access</div>;
  }
  
  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-mono">Loading...</div>;

  if (location === "/" && user) {
    return <div className="min-h-screen" />;
  }
  if (location === "/" && !user) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/admin/dashboard">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={['admin']} />}
      </Route>
      <Route path="/admin/postings">
        {() => <ProtectedRoute component={AdminPostings} allowedRoles={['admin']} />}
      </Route>
      <Route path="/admin/postings/:id">
        {() => <ProtectedRoute component={AdminPostingDetail} allowedRoles={['admin']} />}
      </Route>
      <Route path="/admin/applications">
        {() => <ProtectedRoute component={AdminApplications} allowedRoles={['admin']} />}
      </Route>
      <Route path="/admin/companies">
        {() => <ProtectedRoute component={AdminCompanies} allowedRoles={['admin']} />}
      </Route>

      <Route path="/student/dashboard">
        {() => <ProtectedRoute component={StudentDashboard} allowedRoles={['student']} />}
      </Route>
      <Route path="/student/postings">
        {() => <ProtectedRoute component={StudentPostings} allowedRoles={['student']} />}
      </Route>
      <Route path="/student/applications">
        {() => <ProtectedRoute component={StudentApplications} allowedRoles={['student']} />}
      </Route>
      <Route path="/student/profile">
        {() => <ProtectedRoute component={StudentProfile} allowedRoles={['student']} />}
      </Route>

      <Route path="/company/dashboard">
        {() => <ProtectedRoute component={CompanyDashboard} allowedRoles={['company']} />}
      </Route>
      <Route path="/company/postings/new">
        {() => <ProtectedRoute component={NewPosting} allowedRoles={['company']} />}
      </Route>
      <Route path="/company/postings/:id">
        {() => <ProtectedRoute component={CompanyPostingDetail} allowedRoles={['company']} />}
      </Route>

      <Route>
        <div className="p-8 text-center text-muted-foreground">Page not found.</div>
      </Route>
    </Switch>
  );
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider>
            <AppLayout>
              <Router />
            </AppLayout>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;