import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Members } from './pages/Members';
import { Meals } from './pages/Meals';
import { Expenses } from './pages/Expenses';
import { Deposits } from './pages/Deposits';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { SuperAdmin } from './pages/SuperAdmin';

const Loading = () => <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, currentMess, loading, loadingMess } = useAuth();
  
  if (loading || loadingMess) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (!currentMess) return <Navigate to="/onboarding" />;
  if (currentMess.is_banned) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background text-foreground p-4 text-center">
        <h1 className="text-4xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          This mess has been suspended by the platform administrator. Please contact support.
        </p>
      </div>
    );
  }
  
  return <AppLayout>{children}</AppLayout>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, currentMess, loading, loadingMess } = useAuth();
  
  if (loading || loadingMess) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (currentMess) return <Navigate to="/" />;
  
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, systemRole, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (systemRole !== 'super_admin') return <Navigate to="/" />;
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/meals" element={<ProtectedRoute><Meals /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/deposits" element={<ProtectedRoute><Deposits /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
