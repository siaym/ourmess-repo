import { useEffect, useState } from 'react';
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
import { Bills } from './pages/Bills';
import { Landing } from './pages/Landing';

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
  if (currentMess) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, systemRole, loading, loadingMess } = useAuth();
  
  if (loading || loadingMess) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (systemRole !== 'super_admin') return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

function App() {
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  useEffect(() => {
    // Supabase redirects with a hash like #access_token=...&type=signup
    const hash = window.location.hash;
    if (hash && hash.includes('type=signup')) {
      setVerificationMessage("Email verified successfully! Welcome to OurMess.");
      // Optional: remove hash to clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    } else if (hash && hash.includes('type=recovery')) {
      setVerificationMessage("Password recovery successful! You can now update your password in settings.");
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <AuthProvider>
      {verificationMessage && (
        <div className="fixed top-0 inset-x-0 z-[100] bg-success text-success-foreground p-3 text-center text-sm font-medium shadow-lg flex justify-between items-center px-4 md:px-8">
          <div className="flex-1">{verificationMessage}</div>
          <button onClick={() => setVerificationMessage(null)} className="text-success-foreground/80 hover:text-success-foreground text-2xl leading-none">&times;</button>
        </div>
      )}
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/meals" element={<ProtectedRoute><Meals /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/deposits" element={<ProtectedRoute><Deposits /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
          <Route path="/admin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
