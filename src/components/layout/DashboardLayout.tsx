import React from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  Plus
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

const NavItem = ({ icon: Icon, label, href, active, collapsed }: { 
  icon: any, 
  label: string, 
  href: string, 
  active?: boolean,
  collapsed?: boolean
}) => (
  <Link 
    to={href}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
      active 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <Icon className={cn("w-5 h-5 flex-shrink-0", active ? "text-primary-foreground" : "group-hover:text-primary")} />
    {!collapsed && <span className="text-sm font-semibold tracking-tight">{label}</span>}
    {collapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </Link>
);

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [assistantOpen, setAssistantOpen] = React.useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', href: '/dashboard' },
    { icon: Building2, label: 'ERP Entreprise', href: '/dashboard/erp' },
    { icon: Workflow, label: 'Automatisations', href: '/dashboard/automation' },
    { icon: Target, label: 'Marketing IA', href: '/dashboard/marketing' },
    { icon: Truck, label: 'Logistique & Livraison', href: '/dashboard/delivery' },
    { icon: Users, label: 'Equipe & Rôles', href: '/dashboard/team' },
    { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col border-r border-border transition-all duration-300 ease-in-out relative z-40 bg-background/50 backdrop-blur-xl",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-black tracking-tighter">FUSION<span className="text-primary">BIZ</span></span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {navItems.map((item) => (
            <NavItem 
              key={item.href}
              {...item}
              active={location.pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full p-2 rounded-xl hover:bg-muted transition-colors text-left",
                collapsed && "justify-center"
              )}>
                <Avatar className="w-10 h-10 border-2 border-primary/20">
                  <AvatarImage src={user?.metadata?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate leading-none mb-1">{user?.displayName || 'Utilisateur'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 glass">
              <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-3">
                <Settings className="mr-2 h-4 w-4" /> Profil & Sécurité
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3">
                <Building2 className="mr-2 h-4 w-4" /> Ma Société
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive py-3">
                <LogOut className="mr-2 h-4 w-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-md z-50"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 bg-background/50 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Rechercher une commande, un client, un workflow..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-background transition-all outline-none text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-xl relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
            </Button>
            <Button className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Action Rapide
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* AI Assistant Float */}
        <div className="absolute bottom-8 right-8 z-50">
          <Button 
            size="lg" 
            onClick={() => setAssistantOpen(!assistantOpen)}
            className="h-14 w-14 rounded-2xl shadow-2xl bg-primary hover:bg-primary/90 flex items-center justify-center group relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
             <Bot className={cn("w-7 h-7 relative z-10 transition-transform", assistantOpen && "rotate-12 scale-110")} />
          </Button>
        </div>

        {/* Assistant Panel */}
        <Assistant open={assistantOpen} onOpenChange={setAssistantOpen} />
      </div>
    </div>
  );
};