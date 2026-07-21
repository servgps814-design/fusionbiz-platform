import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useCompany } from './hooks/useCompany';
import { Spinner } from './components/ui/spinner';
import { DashboardLayout } from './components/layout/DashboardLayout';

// ─── Public pages ──────────────────────────────────────────────────────────────
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SignupPage } from './pages/SignupPage';
import { AdminPage } from './pages/admin/AdminPage';

// ─── Dashboard ─────────────────────────────────────────────────────────────────
import { Dashboard } from './pages/Dashboard';

// ─── CRM ───────────────────────────────────────────────────────────────────────
import { CRMPage } from './pages/crm/CRMPage';
import { LeadsPage } from './pages/crm/LeadsPage';

// ─── Invoicing ─────────────────────────────────────────────────────────────────
import { InvoicingPage } from './pages/invoicing/InvoicingPage';
import { QuotesPage } from './pages/invoicing/QuotesPage';
import { InvoicesPage } from './pages/invoicing/InvoicesPage';

// ─── Accounting ────────────────────────────────────────────────────────────────
import { AccountingPage } from './pages/accounting/AccountingPage';
import { ExpensesPage } from './pages/accounting/ExpensesPage';
import { VATPage } from './pages/accounting/VATPage';
import { AccountingOverviewPage } from './pages/accounting/AccountingOverviewPage';

// ─── E-commerce ────────────────────────────────────────────────────────────────
import { EcommercePage } from './pages/ecommerce/EcommercePage';

// ─── Storefront + CMS ──────────────────────────────────────────────────────────
import { StorefrontPage } from './pages/storefront/StorefrontPage';
import { PagesPage } from './pages/cms/PagesPage';

// ─── Marketing ─────────────────────────────────────────────────────────────────
import { MarketingPage } from './pages/marketing/MarketingPage';

// ─── Social ────────────────────────────────────────────────────────────────────
import { SocialPage } from './pages/social/SocialPage';

// ─── Media ─────────────────────────────────────────────────────────────────────
import { MediaPage } from './pages/media/MediaPage';

// ─── Analytics ─────────────────────────────────────────────────────────────────
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';

// ─── Automation ────────────────────────────────────────────────────────────────
import { AutomationPage } from './pages/automation/AutomationPage';

// ─── Delivery + B2B ────────────────────────────────────────────────────────────
import { DeliveryPage } from './pages/delivery/DeliveryPage';
import { B2BPage } from './pages/b2b/B2BPage';

// ─── Team + Billing + Settings ─────────────────────────────────────────────────
import { TeamPage } from './pages/team/TeamPage';
import { BillingPage } from './pages/billing/BillingPage';
import { SettingsPage } from './pages/settings/SettingsPage';

// ─── Layout wrapper ───────────────────────────────────────────────────────────

const DW = ({ children }: { children: React.ReactNode }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

// ─── Loading screen ───────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Spinner className="w-12 h-12 text-primary" />
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
        Chargement...
      </p>
    </div>
  </div>
);

// ─── Auth Gate ────────────────────────────────────────────────────────────────
// Wraps authenticated routes only. The / route (LandingPage) lives outside it.

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  const location = useLocation();

  // Show spinner while auth resolves, or while company is being fetched for
  // an authenticated user.
  if (authLoading || (user && companyLoading)) {
    return <LoadingScreen />;
  }

  // Not logged in → send to landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Logged in but no company → force onboarding (unless already there)
  if (!company && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Already has company, don't let them re-onboard
  if (company && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public ─────────────────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* ── Onboarding (auth required, no company required) ────────────── */}
        <Route
          path="/onboarding"
          element={
            <AuthGate>
              <OnboardingPage />
            </AuthGate>
          }
        />

        {/* ── Admin (auth required, admin-only) ──────────────────────────── */}
        <Route
          path="/admin"
          element={
            <AuthGate>
              <AdminPage />
            </AuthGate>
          }
        />

        {/* ── Dashboard & all sub-routes ─────────────────────────────────── */}
        <Route
          path="/dashboard"
          element={
            <AuthGate>
              <DW><Dashboard /></DW>
            </AuthGate>
          }
        />

        {/* CRM */}
        <Route path="/dashboard/crm" element={<AuthGate><DW><CRMPage /></DW></AuthGate>} />
        <Route path="/dashboard/crm/leads" element={<AuthGate><DW><LeadsPage /></DW></AuthGate>} />
        <Route path="/dashboard/crm/contacts" element={<AuthGate><DW><CRMPage /></DW></AuthGate>} />

        {/* Invoicing */}
        <Route path="/dashboard/invoicing" element={<AuthGate><DW><InvoicingPage /></DW></AuthGate>} />
        <Route path="/dashboard/invoicing/quotes" element={<AuthGate><DW><QuotesPage /></DW></AuthGate>} />
        <Route path="/dashboard/invoicing/invoices" element={<AuthGate><DW><InvoicesPage /></DW></AuthGate>} />
        <Route path="/dashboard/invoicing/credits" element={<AuthGate><DW><InvoicingPage /></DW></AuthGate>} />

        {/* Accounting */}
        <Route path="/dashboard/accounting" element={<AuthGate><DW><AccountingOverviewPage /></DW></AuthGate>} />
        <Route path="/dashboard/accounting/expenses" element={<AuthGate><DW><ExpensesPage /></DW></AuthGate>} />
        <Route path="/dashboard/accounting/vat" element={<AuthGate><DW><VATPage /></DW></AuthGate>} />
        <Route path="/dashboard/accounting/reports" element={<AuthGate><DW><AccountingPage /></DW></AuthGate>} />

        {/* E-commerce */}
        <Route path="/dashboard/ecommerce" element={<AuthGate><DW><EcommercePage /></DW></AuthGate>} />
        <Route path="/dashboard/ecommerce/products" element={<AuthGate><DW><EcommercePage /></DW></AuthGate>} />
        <Route path="/dashboard/ecommerce/orders" element={<AuthGate><DW><EcommercePage /></DW></AuthGate>} />
        <Route path="/dashboard/ecommerce/customers" element={<AuthGate><DW><EcommercePage /></DW></AuthGate>} />
        <Route path="/dashboard/ecommerce/discounts" element={<AuthGate><DW><EcommercePage /></DW></AuthGate>} />

        {/* Storefront & CMS */}
        <Route path="/dashboard/storefront" element={<AuthGate><DW><StorefrontPage /></DW></AuthGate>} />
        <Route path="/dashboard/pages" element={<AuthGate><DW><PagesPage /></DW></AuthGate>} />

        {/* Marketing */}
        <Route path="/dashboard/marketing" element={<AuthGate><DW><MarketingPage /></DW></AuthGate>} />
        <Route path="/dashboard/marketing/campaigns" element={<AuthGate><DW><MarketingPage /></DW></AuthGate>} />
        <Route path="/dashboard/marketing/segments" element={<AuthGate><DW><MarketingPage /></DW></AuthGate>} />

        {/* Social & Media */}
        <Route path="/dashboard/social" element={<AuthGate><DW><SocialPage /></DW></AuthGate>} />
        <Route path="/dashboard/media" element={<AuthGate><DW><MediaPage /></DW></AuthGate>} />

        {/* Analytics */}
        <Route path="/dashboard/analytics" element={<AuthGate><DW><AnalyticsPage /></DW></AuthGate>} />

        {/* Automation */}
        <Route path="/dashboard/automation" element={<AuthGate><DW><AutomationPage /></DW></AuthGate>} />

        {/* Delivery + B2B */}
        <Route path="/dashboard/delivery" element={<AuthGate><DW><DeliveryPage /></DW></AuthGate>} />
        <Route path="/dashboard/b2b" element={<AuthGate><DW><B2BPage /></DW></AuthGate>} />

        {/* Team + Billing */}
        <Route path="/dashboard/team" element={<AuthGate><DW><TeamPage /></DW></AuthGate>} />
        <Route path="/dashboard/billing" element={<AuthGate><DW><BillingPage /></DW></AuthGate>} />

        {/* Settings */}
        <Route
          path="/dashboard/settings"
          element={<Navigate to="/dashboard/settings/profile" replace />}
        />
        <Route path="/dashboard/settings/profile" element={<AuthGate><DW><SettingsPage /></DW></AuthGate>} />
        <Route path="/dashboard/settings/company" element={<AuthGate><DW><SettingsPage /></DW></AuthGate>} />
        <Route path="/dashboard/settings/invoicing" element={<AuthGate><DW><SettingsPage /></DW></AuthGate>} />
        <Route path="/dashboard/settings/integrations" element={<AuthGate><DW><SettingsPage /></DW></AuthGate>} />
        <Route path="/dashboard/settings/roles" element={<AuthGate><DW><SettingsPage /></DW></AuthGate>} />

        {/* Legacy ERP redirects */}
        <Route path="/dashboard/erp" element={<Navigate to="/dashboard/crm" replace />} />
        <Route path="/dashboard/erp/:tab" element={<Navigate to="/dashboard/crm" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
