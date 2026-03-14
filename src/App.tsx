import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Dashboard } from './pages/Dashboard';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useCompany } from './hooks/useCompany';
import { Spinner } from './components/ui/spinner';

// ─── Page imports ─────────────────────────────────────────────────────────────

import { CRMPage } from './pages/crm/CRMPage';
import { LeadsPage } from './pages/crm/LeadsPage';
import { InvoicingPage } from './pages/invoicing/InvoicingPage';
import { InvoicesPage } from './pages/invoicing/InvoicesPage';
import { QuotesPage } from './pages/invoicing/QuotesPage';
import { AccountingOverviewPage } from './pages/accounting/AccountingOverviewPage';
import { AccountingPage } from './pages/accounting/AccountingPage';
import { ExpensesPage } from './pages/accounting/ExpensesPage';
import { VATPage } from './pages/accounting/VATPage';
import { EcommercePage } from './pages/ecommerce/EcommercePage';
import { StorefrontPage } from './pages/storefront/StorefrontPage';
import { PagesPage } from './pages/cms/PagesPage';
import { MarketingPage } from './pages/marketing/MarketingPage';
import { SocialPage } from './pages/social/SocialPage';
import { MediaPage } from './pages/media/MediaPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { TeamPage } from './pages/team/TeamPage';
import { BillingPage } from './pages/billing/BillingPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AutomationPage } from './pages/automation/AutomationPage';
import { DeliveryPage } from './pages/delivery/DeliveryPage';
import { B2BPage } from './pages/b2b/B2BPage';

// ─── Layout wrapper ───────────────────────────────────────────────────────────

const DW = ({ children }: { children: React.ReactNode }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

// ─── Auth Gate ────────────────────────────────────────────────────────────────

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const location = useLocation();

  if (authLoading || (user && companyLoading)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-12 h-12 text-primary" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <LandingPage />;

  if (!company && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (company && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <Router>
      <AuthGate>
        <Routes>
          {/* Root */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<DW><Dashboard /></DW>} />

          {/* CRM */}
          <Route path="/dashboard/crm" element={<DW><CRMPage /></DW>} />
          <Route path="/dashboard/crm/leads" element={<DW><LeadsPage /></DW>} />
          <Route path="/dashboard/crm/contacts" element={<DW><CRMPage /></DW>} />

          {/* Invoicing */}
          <Route path="/dashboard/invoicing" element={<DW><InvoicingPage /></DW>} />
          <Route path="/dashboard/invoicing/quotes" element={<DW><QuotesPage /></DW>} />
          <Route path="/dashboard/invoicing/invoices" element={<DW><InvoicesPage /></DW>} />
          <Route path="/dashboard/invoicing/credits" element={<DW><InvoicesPage /></DW>} />

          {/* Accounting */}
          <Route path="/dashboard/accounting" element={<DW><AccountingOverviewPage /></DW>} />
          <Route path="/dashboard/accounting/expenses" element={<DW><ExpensesPage /></DW>} />
          <Route path="/dashboard/accounting/vat" element={<DW><VATPage /></DW>} />
          <Route path="/dashboard/accounting/reports" element={<DW><AccountingPage /></DW>} />

          {/* E-commerce */}
          <Route path="/dashboard/ecommerce" element={<DW><EcommercePage /></DW>} />
          <Route path="/dashboard/ecommerce/products" element={<DW><EcommercePage /></DW>} />
          <Route path="/dashboard/ecommerce/orders" element={<DW><EcommercePage /></DW>} />
          <Route path="/dashboard/ecommerce/customers" element={<DW><EcommercePage /></DW>} />
          <Route path="/dashboard/ecommerce/discounts" element={<DW><EcommercePage /></DW>} />

          {/* Storefront & CMS */}
          <Route path="/dashboard/storefront" element={<DW><StorefrontPage /></DW>} />
          <Route path="/dashboard/pages" element={<DW><PagesPage /></DW>} />

          {/* Marketing */}
          <Route path="/dashboard/marketing" element={<DW><MarketingPage /></DW>} />
          <Route path="/dashboard/marketing/campaigns" element={<DW><MarketingPage /></DW>} />
          <Route path="/dashboard/marketing/segments" element={<DW><MarketingPage /></DW>} />

          {/* Social & Media */}
          <Route path="/dashboard/social" element={<DW><SocialPage /></DW>} />
          <Route path="/dashboard/media" element={<DW><MediaPage /></DW>} />

          {/* Analytics */}
          <Route path="/dashboard/analytics" element={<DW><AnalyticsPage /></DW>} />

          {/* Team & Billing */}
          <Route path="/dashboard/team" element={<DW><TeamPage /></DW>} />
          <Route path="/dashboard/billing" element={<DW><BillingPage /></DW>} />

          {/* Settings */}
          <Route path="/dashboard/settings" element={<Navigate to="/dashboard/settings/profile" replace />} />
          <Route path="/dashboard/settings/profile" element={<DW><SettingsPage /></DW>} />
          <Route path="/dashboard/settings/company" element={<DW><SettingsPage /></DW>} />
          <Route path="/dashboard/settings/invoicing" element={<DW><SettingsPage /></DW>} />
          <Route path="/dashboard/settings/integrations" element={<DW><SettingsPage /></DW>} />
          <Route path="/dashboard/settings/roles" element={<DW><SettingsPage /></DW>} />

          {/* Extra modules */}
          <Route path="/dashboard/automation" element={<DW><AutomationPage /></DW>} />
          <Route path="/dashboard/delivery" element={<DW><DeliveryPage /></DW>} />
          <Route path="/dashboard/b2b" element={<DW><B2BPage /></DW>} />

          {/* Legacy ERP redirects */}
          <Route path="/dashboard/erp" element={<Navigate to="/dashboard/crm" replace />} />
          <Route path="/dashboard/erp/:tab" element={<Navigate to="/dashboard/crm" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthGate>
    </Router>
  );
}

export default App;
