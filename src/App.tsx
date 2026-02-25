import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Dashboard } from './pages/Dashboard';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { blink } from './lib/blink';
import { useCompany } from './hooks/useCompany';
import { Spinner } from './components/ui/spinner';

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const location = useLocation();

  if (authLoading || (user && companyLoading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Spinner className="w-12 h-12 text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

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
          
          {/* Module placeholders */}
          <Route path="/dashboard/erp" element={<DashboardLayout><ComingSoon title="ERP Entreprise" /></DashboardLayout>} />
          <Route path="/dashboard/automation" element={<DashboardLayout><ComingSoon title="Automatisations" /></DashboardLayout>} />
          <Route path="/dashboard/marketing" element={<DashboardLayout><ComingSoon title="Marketing IA" /></DashboardLayout>} />
          <Route path="/dashboard/delivery" element={<DashboardLayout><ComingSoon title="Logistique & Livraison" /></DashboardLayout>} />
          <Route path="/dashboard/team" element={<DashboardLayout><ComingSoon title="Equipe & Rôles" /></DashboardLayout>} />
          <Route path="/dashboard/settings" element={<DashboardLayout><ComingSoon title="Paramètres" /></DashboardLayout>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthGate>
    </Router>
  );
}

const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-fade-in">
    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
      <Bot className="w-10 h-10" />
    </div>
    <h2 className="text-4xl font-black tracking-tighter uppercase">{title}</h2>
    <p className="text-muted-foreground text-lg max-w-md">
      Ce module est en cours de déploiement. FusionBiz active ses fonctionnalités de manière progressive pour assurer une stabilité maximale.
    </p>
  </div>
);

import { Bot } from 'lucide-react';

export default App;