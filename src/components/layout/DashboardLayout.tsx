import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { 
  BarChart3, 
  Bot, 
  Settings, 
  LayoutDashboard, 
  Workflow, 
  Target, 
  Truck,
  Building2,
  Users,
  LogOut,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Network,
  CreditCard,
  MessageSquare,
  Layers,
  Handshake,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Assistant } from '../ai/Assistant';

const NavItem = ({ icon: Icon, label, href, active, collapsed }: any) => (
  <Link 
    to={href}
    className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative",
      active 
        ? "bg-blue-600 text-white shadow-xl shadow-blue-100" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110", 
      active ? "text-white" : "group-hover:text-blue-600")} 
    />
    {!collapsed && <span className="text-sm font-bold tracking-tight">{label}</span>}
    {collapsed && (
      <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
        {label}
      </div>
    )}
  </Link>
);

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [assistantOpen, setAssistantOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [notifOpen, setNotifOpen] = React.useState(false);

  useEffect(() => {
    if (user && company) {
      // Polling for business alerts (new B2B connections, overdue invoices)
      const loadNotifs = async () => {
        try {
          const conns = await blink.db.companyConnections.list({
            where: { receiverId: company.id, status: 'pending' }
          });
          
          const invoices = await blink.db.invoices.list({
            where: { companyId: company.id, status: 'overdue' }
          });

          const newNotifs = [
            ...conns.map(c => ({ id: c.id, title: 'Demande B2B', message: `Une entreprise souhaite se connecter.`, type: 'connection' })),
            ...invoices.map(i => ({ id: i.id, title: 'Facture en retard', message: `La facture ${i.number} est dépassée.`, type: 'invoice' }))
          ];
          setNotifications(newNotifs);
        } catch (e) {}
      };
      loadNotifs();
      const interval = setInterval(loadNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user, company]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', href: '/dashboard' },
    { icon: Building2, label: 'Gestion & ERP', href: '/dashboard/erp' },
    { icon: Workflow, label: 'Automatisations', href: '/dashboard/automation' },
    { icon: Target, label: 'Marketing IA', href: '/dashboard/marketing' },
    { icon: Truck, label: 'Logistique', href: '/dashboard/delivery' },
    { icon: Network, label: 'Réseau B2B', href: '/dashboard/b2b' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-blue-100">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r border-slate-100 dark:border-slate-800 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-40 bg-white dark:bg-slate-900",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100">
              <Layers className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">FUSION<span className="text-blue-600 uppercase">BIZ</span></span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-1.5 custom-scrollbar">
          <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4", collapsed && "text-center px-0")}>
            {collapsed ? "•••" : "Menu Principal"}
          </p>
          {navItems.map((item) => (
            <NavItem 
              key={item.href}
              {...item}
              active={location.pathname.startsWith(item.href)}
              collapsed={collapsed}
            />
          ))}
          
          <div className="pt-8">
            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4", collapsed && "text-center px-0")}>
              {collapsed ? "•••" : "Système"}
            </p>
            <NavItem icon={Users} label="Equipe" href="/dashboard/team" active={location.pathname === '/dashboard/team'} collapsed={collapsed} />
            <NavItem icon={Settings} label="Paramètres" href="/dashboard/settings" active={location.pathname === '/dashboard/settings'} collapsed={collapsed} />
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-sm border border-transparent hover:border-slate-100",
                collapsed && "justify-center"
              )}>
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                  <AvatarImage src={user?.metadata?.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white font-black">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-black truncate text-slate-900 dark:text-white leading-tight">{user?.displayName || 'Utilisateur'}</p>
                    <p className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-widest mt-0.5">Administrateur</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side={collapsed ? "right" : "top"} className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100">
              <DropdownMenuLabel className="font-black text-xs uppercase tracking-widest text-slate-400 p-3">Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem className="rounded-xl py-3 cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4 text-slate-400" /> Facturation
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl py-3 cursor-pointer">
                <MessageSquare className="mr-2 h-4 w-4 text-slate-400" /> Support Premium
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem onClick={logout} className="text-red-500 rounded-xl py-3 cursor-pointer hover:bg-red-50 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-xl z-50 text-slate-400"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-6 flex-1 max-w-2xl">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Recherche globale (clients, factures, workflows...)" 
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all outline-none text-sm font-bold text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">Système : Optimal</span>
            </div>
            
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl relative h-11 w-11 border-slate-100 hover:bg-slate-50">
                  <Bell className="w-5 h-5 text-slate-500" />
                  {notifications.length > 0 && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-2xl border-slate-100">
                <DropdownMenuLabel className="font-black text-xs uppercase tracking-widest text-slate-400 p-3">Alertes Business</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-50" />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold italic">Aucune alerte pour le moment.</div>
                  ) : (
                    notifications.map(n => (
                      <DropdownMenuItem key={n.id} className="rounded-xl p-3 cursor-pointer flex gap-3 items-start border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", 
                          n.type === 'connection' ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600")}>
                          {n.type === 'connection' ? <Handshake className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs uppercase mb-0.5 tracking-tight">{n.title}</p>
                          <p className="text-[11px] font-medium text-slate-500 leading-tight">{n.message}</p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                <DropdownMenuSeparator className="bg-slate-50" />
                <div className="p-2">
                  <Button variant="ghost" className="w-full h-9 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50">
                    Tout marquer comme lu
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* AI Assistant Float */}
        <div className="absolute bottom-8 right-8 z-50">
          <Button 
            size="lg" 
            onClick={() => setAssistantOpen(!assistantOpen)}
            className="h-16 w-16 rounded-[24px] shadow-2xl bg-slate-900 hover:bg-black text-white flex items-center justify-center group relative overflow-hidden transition-all duration-500 hover:scale-110"
          >
             <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
             <Bot className={cn("w-8 h-8 relative z-10 transition-all duration-500", assistantOpen && "rotate-[360deg] scale-110")} />
          </Button>
        </div>

        {/* Assistant Panel */}
        <Assistant open={assistantOpen} onOpenChange={setAssistantOpen} />
      </div>
    </div>
  );
};
