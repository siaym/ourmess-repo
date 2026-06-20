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

const Loading = () => <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, currentMess, loading, loadingMess } = useAuth();
  
  if (loading || loadingMess) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (!currentMess) return <Navigate to="/onboarding" />;
  
  return <AppLayout>{children}</AppLayout>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, currentMess, loading, loadingMess } = useAuth();
  
  if (loading || loadingMess) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (currentMess) return <Navigate to="/" />;
  
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
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
