import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Receipt, BarChart3,
  Settings, ChevronDown, Store, Megaphone,
  Share2, Image, CreditCard, Globe,
  Bell, Search, Menu, X, LogOut,
  Layers, ChevronRight, Zap, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavChild[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ─── Navigation structure ─────────────────────────────────────────────────────

const navigation: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'GESTION',
    items: [
      {
        label: 'CRM & Clients',
        icon: Users,
        children: [
          { label: 'Clients', href: '/dashboard/crm' },
          { label: 'Prospects', href: '/dashboard/crm/leads' },
          { label: 'Contacts', href: '/dashboard/crm/contacts' },
        ],
      },
      {
        label: 'Devis & Factures',
        icon: FileText,
        children: [
          { label: 'Devis', href: '/dashboard/invoicing/quotes' },
          { label: 'Factures', href: '/dashboard/invoicing/invoices' },
          { label: 'Avoirs', href: '/dashboard/invoicing/credits' },
        ],
      },
      {
        label: 'Comptabilité',
        icon: Receipt,
        children: [
          { label: "Vue d'ensemble", href: '/dashboard/accounting' },
          { label: 'Dépenses', href: '/dashboard/accounting/expenses' },
          { label: 'TVA', href: '/dashboard/accounting/vat' },
          { label: 'Rapports', href: '/dashboard/accounting/reports' },
        ],
      },
    ],
  },
  {
    title: 'VENTES',
    items: [
      {
        label: 'E-commerce',
        icon: Store,
        children: [
          { label: 'Produits', href: '/dashboard/ecommerce/products' },
          { label: 'Commandes', href: '/dashboard/ecommerce/orders' },
          { label: 'Clients boutique', href: '/dashboard/ecommerce/customers' },
          { label: 'Remises', href: '/dashboard/ecommerce/discounts' },
        ],
      },
      { label: 'Vitrine', href: '/dashboard/storefront', icon: Globe },
      { label: 'Pages & CMS', href: '/dashboard/pages', icon: Layers },
    ],
  },
  {
    title: 'MARKETING',
    items: [
      {
        label: 'Marketing',
        icon: Megaphone,
        children: [
          { label: 'Campagnes', href: '/dashboard/marketing/campaigns' },
          { label: 'Segments', href: '/dashboard/marketing/segments' },
        ],
      },
      { label: 'Réseaux Sociaux', href: '/dashboard/social', icon: Share2 },
      { label: 'Médiathèque', href: '/dashboard/media', icon: Image },
    ],
  },
  {
    title: 'ANALYTIQUE',
    items: [
      { label: 'Analytique', href: '/dashboard/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'OUTILS',
    items: [
      { label: 'Automatisation', href: '/dashboard/automation', icon: Zap },
      { label: 'Livraisons', href: '/dashboard/delivery', icon: Wallet },
      { label: 'Réseau B2B', href: '/dashboard/b2b', icon: Layers },
    ],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { label: 'Équipe', href: '/dashboard/team', icon: Users },
      { label: 'Abonnement', href: '/dashboard/billing', icon: CreditCard },
      {
        label: 'Paramètres',
        icon: Settings,
        children: [
          { label: 'Profil', href: '/dashboard/settings/profile' },
          { label: 'Organisation', href: '/dashboard/settings/company' },
          { label: 'Facturation', href: '/dashboard/settings/invoicing' },
          { label: 'Intégrations', href: '/dashboard/settings/integrations' },
          { label: 'Rôles', href: '/dashboard/settings/roles' },
        ],
      },
    ],
  },
];

// Breadcrumb label map
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/dashboard/crm': 'Clients',
  '/dashboard/crm/leads': 'Prospects',
  '/dashboard/crm/contacts': 'Contacts',
  '/dashboard/invoicing/quotes': 'Devis',
  '/dashboard/invoicing/invoices': 'Factures',
  '/dashboard/invoicing/credits': 'Avoirs',
  '/dashboard/accounting': "Vue d'ensemble",
  '/dashboard/accounting/expenses': 'Dépenses',
  '/dashboard/accounting/vat': 'TVA',
  '/dashboard/accounting/reports': 'Rapports',
  '/dashboard/ecommerce': 'E-commerce',
  '/dashboard/ecommerce/products': 'Produits',
  '/dashboard/ecommerce/orders': 'Commandes',
  '/dashboard/ecommerce/customers': 'Clients boutique',
  '/dashboard/ecommerce/discounts': 'Remises',
  '/dashboard/storefront': 'Vitrine',
  '/dashboard/pages': 'Pages & CMS',
  '/dashboard/marketing': 'Marketing',
  '/dashboard/marketing/campaigns': 'Campagnes',
  '/dashboard/marketing/segments': 'Segments',
  '/dashboard/social': 'Réseaux Sociaux',
  '/dashboard/media': 'Médiathèque',
  '/dashboard/analytics': 'Analytique',
  '/dashboard/team': 'Équipe',
  '/dashboard/billing': 'Abonnement',
  '/dashboard/settings': 'Paramètres',
  '/dashboard/settings/profile': 'Profil',
  '/dashboard/settings/company': 'Organisation',
  '/dashboard/settings/invoicing': 'Facturation',
  '/dashboard/settings/integrations': 'Intégrations',
  '/dashboard/settings/roles': 'Rôles',
  '/dashboard/automation': 'Automatisation',
  '/dashboard/delivery': 'Livraisons',
  '/dashboard/b2b': 'Réseau B2B',
};

// ─── NavItem Component ─────────────────────────────────────────────────────────

function NavItemComponent({
  item,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  item: NavItem;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const hasChildren = !!item.children?.length;

  const isChildActive = item.children?.some(
    (c) =>
      location.pathname === c.href ||
      location.pathname.startsWith(c.href + '/'),
  );
  const isActive = item.href
    ? location.pathname === item.href ||
      (item.href !== '/dashboard' && location.pathname.startsWith(item.href + '/'))
    : isChildActive;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            'sidebar-item w-full',
            isActive && 'text-[hsl(var(--sidebar-foreground))]',
          )}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left text-sm">{item.label}</span>
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 transition-transform duration-200',
              isExpanded && 'rotate-180',
            )}
          />
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="ml-[26px] mt-0.5 mb-0.5 space-y-0.5 border-l pl-3"
            style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
            {item.children!.map((child) => {
              const childActive =
                location.pathname === child.href ||
                location.pathname.startsWith(child.href + '/');
              return (
                <Link
                  key={child.href}
                  to={child.href}
                  onClick={onNavigate}
                  className={cn(
                    'block px-3 py-1.5 text-[13px] rounded-md transition-all duration-150',
                    childActive
                      ? 'font-semibold'
                      : 'hover:bg-[hsl(var(--sidebar-accent))]',
                  )}
                  style={{
                    color: childActive
                      ? 'hsl(var(--sidebar-primary))'
                      : 'hsl(var(--sidebar-muted-foreground))',
                  }}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={item.href!}
      onClick={onNavigate}
      className={cn(
        'group relative sidebar-item',
        isActive && 'active',
      )}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full"
          style={{ background: 'hsl(var(--sidebar-primary))' }}
        />
      )}
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-sm">{item.label}</span>
      {item.badge && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
          style={{
            background: 'hsl(var(--sidebar-primary) / 0.2)',
            color: 'hsl(var(--sidebar-primary))',
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─── Sidebar Content ───────────────────────────────────────────────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Auto-expand groups that contain the active route
  useEffect(() => {
    const toExpand: Record<string, boolean> = {};
    navigation.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some(
            (c) =>
              location.pathname === c.href ||
              location.pathname.startsWith(c.href + '/'),
          );
          if (hasActiveChild) {
            toExpand[item.label] = true;
          }
        }
      });
    });
    setExpandedItems((prev) => ({ ...prev, ...toExpand }));
  }, [location.pathname]);

  const toggleItem = (label: string) => {
    setExpandedItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.email || 'U').charAt(0).toUpperCase();
  const displayName =
    (user as any)?.displayName ||
    user?.email?.split('@')[0] ||
    'Utilisateur';

  return (
    <div className="sidebar flex flex-col h-full">
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 px-4 h-14 shrink-0 border-b"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        <Link to="/dashboard" className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br from-[hsl(235_85%_65%)] to-[hsl(262_83%_58%)] shadow-lg shadow-[hsl(235_85%_55%/0.3)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="font-bold text-base tracking-tight leading-none"
              style={{
                background: 'linear-gradient(135deg, hsl(220,14%,96%), hsl(235,85%,75%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ORBiS
            </div>
            <div
              className="text-[10px] truncate mt-0.5"
              style={{ color: 'hsl(var(--sidebar-muted-foreground))' }}
            >
              {company?.name ?? 'Plateforme tout-en-un'}
            </div>
          </div>
        </Link>
      </div>

      {/* ── Search ── */}
      <div className="px-3 py-2.5">
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors"
          style={{
            background: 'hsl(var(--sidebar-accent))',
            color: 'hsl(var(--sidebar-muted-foreground))',
          }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left">Rechercher...</span>
          <kbd
            className="text-[10px] font-mono opacity-50 border rounded px-1"
            style={{ borderColor: 'hsl(var(--sidebar-border))' }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Navigation ── */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-3 pb-4">
          {navigation.map((section) => (
            <div key={section.title}>
              <p
                className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: 'hsl(220 9% 35%)' }}
              >
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItemComponent
                    key={item.label}
                    item={item}
                    isExpanded={!!expandedItems[item.label]}
                    onToggle={() => toggleItem(item.label)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* ── User ── */}
      <div
        className="p-3 shrink-0 border-t"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-[hsl(var(--sidebar-accent))] focus:outline-none">
              <Avatar className="w-7 h-7 shrink-0 border" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
                <AvatarImage src={(user as any)?.metadata?.avatar} />
                <AvatarFallback
                  className="text-xs font-semibold"
                  style={{
                    background: 'hsl(235 85% 65% / 0.2)',
                    color: 'hsl(var(--sidebar-primary))',
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p
                  className="text-[13px] font-semibold truncate leading-tight"
                  style={{ color: 'hsl(var(--sidebar-foreground))' }}
                >
                  {displayName}
                </p>
                <p
                  className="text-[10px] truncate"
                  style={{ color: 'hsl(var(--sidebar-muted-foreground))' }}
                >
                  Administrateur
                </p>
              </div>
              <ChevronDown
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: 'hsl(var(--sidebar-muted-foreground))' }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={8}
            className="w-56 rounded-xl p-1 shadow-xl"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-3 py-2 text-sm"
              onClick={() => { navigate('/dashboard/settings/profile'); onNavigate?.(); }}
            >
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-3 py-2 text-sm"
              onClick={() => { navigate('/dashboard/settings/company'); onNavigate?.(); }}
            >
              Organisation
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-3 py-2 text-sm"
              onClick={() => { navigate('/dashboard/billing'); onNavigate?.(); }}
            >
              <Wallet className="w-4 h-4 mr-2 text-muted-foreground" />
              Abonnement
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── User Header Menu ──────────────────────────────────────────────────────────

function UserHeaderMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.email || 'U').charAt(0).toUpperCase();
  const displayName =
    (user as any)?.displayName ||
    user?.email?.split('@')[0] ||
    'Utilisateur';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted focus:outline-none">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={(user as any)?.metadata?.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl p-1 shadow-xl">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg px-3 py-2 text-sm"
          onClick={() => navigate('/dashboard/settings/profile')}
        >
          <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
          Paramètres
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-lg px-3 py-2 text-sm"
          onClick={() => navigate('/dashboard/billing')}
        >
          <Wallet className="mr-2 h-4 w-4 text-muted-foreground" />
          Abonnement
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Layout ───────────────────────────────────────────────────────────────

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const pageTitle = PAGE_TITLES[pathname] ?? 'ORBiS';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'sidebar flex flex-col w-[220px] flex-shrink-0 border-r',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          'lg:relative lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        {/* Close button (mobile only) */}
        <button
          className="absolute top-4 right-3 z-10 text-[hsl(var(--sidebar-muted-foreground))] hover:text-[hsl(var(--sidebar-foreground))] transition-colors lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 min-w-0 flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 flex shrink-0 items-center justify-between border-b border-border bg-background/95 backdrop-filter supports-[backdrop-filter]:bg-background/80 px-4 lg:px-5 z-30">
          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span
                className="font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(235,85%,72%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ORBiS
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">{pageTitle}</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            <button
              className={cn(
                'hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5',
                'text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              )}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Recherche</span>
              <kbd className="pointer-events-none ml-1 hidden select-none rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-flex">
                ⌘K
              </kbd>
            </button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-background" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-xl p-0 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold">Notifications</span>
                  <Badge variant="secondary" className="text-xs">3</Badge>
                </div>
                {[
                  { title: 'Nouvelle facture payée', time: 'Il y a 5 min', color: 'bg-emerald-500' },
                  { title: 'Commande #1042 reçue', time: 'Il y a 1h', color: 'bg-blue-500' },
                  { title: 'Rappel : Devis expirant', time: 'Il y a 2h', color: 'bg-amber-500' },
                ].map((notif, i) => (
                  <DropdownMenuItem
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                  >
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', notif.color)} />
                    <div>
                      <p className="text-[13px] font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
                <div className="border-t border-border px-4 py-2.5">
                  <button className="w-full text-center text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                    Voir toutes les notifications
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User avatar */}
            <UserHeaderMenu />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in p-4 sm:p-6 lg:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
