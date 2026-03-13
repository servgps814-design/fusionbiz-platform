import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Dashboard } from './pages/Dashboard';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ERPPage } from './pages/erp/ERPPage';
import { TeamPage } from './pages/team/TeamPage';
import { MarketingPage } from './pages/marketing/MarketingPage';
import { AutomationPage } from './pages/automation/AutomationPage';
import { DeliveryPage } from './pages/delivery/DeliveryPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { B2BPage } from './pages/b2b/B2BPage';
import { useCompany } from './hooks/useCompany';
import { Spinner } from './components/ui/spinner';

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const location = useLocation();

  if (authLoading || (user && companyLoading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-12 h-12 text-primary" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LandingPage />;

  if (!company && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  if (company && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthGate>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/dashboard/erp" element={<DashboardLayout><ERPPage /></DashboardLayout>} />
          <Route path="/dashboard/erp/:tab" element={<DashboardLayout><ERPPage /></DashboardLayout>} />
          <Route path="/dashboard/automation" element={<DashboardLayout><AutomationPage /></DashboardLayout>} />
          <Route path="/dashboard/marketing" element={<DashboardLayout><MarketingPage /></DashboardLayout>} />
          <Route path="/dashboard/delivery" element={<DashboardLayout><DeliveryPage /></DashboardLayout>} />
          <Route path="/dashboard/team" element={<DashboardLayout><TeamPage /></DashboardLayout>} />
          <Route path="/dashboard/b2b" element={<DashboardLayout><B2BPage /></DashboardLayout>} />
          <Route path="/dashboard/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthGate>
    </Router>
  );
}

export default App;
