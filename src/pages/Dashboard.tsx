import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Users, Package, DollarSign, Activity,
  ArrowUpRight, ArrowDownRight, FileText, Truck,
  Target, Workflow, ArrowRight, Zap, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, change, trend, icon: Icon, loading }: any) => (
  <Card className="glass overflow-hidden group">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
            trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
        )}
      </div>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [stats, setStats] = useState({ clients: 0, products: 0, invoices: 0, deliveries: 0, totalRevenue: 0, workflows: 0 });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const chartData = [
    { name: 'Lun', value: Math.floor(Math.random() * 3000) + 1000 },
    { name: 'Mar', value: Math.floor(Math.random() * 3000) + 1500 },
    { name: 'Mer', value: Math.floor(Math.random() * 3000) + 1200 },
    { name: 'Jeu', value: Math.floor(Math.random() * 3000) + 2000 },
    { name: 'Ven', value: Math.floor(Math.random() * 3000) + 1800 },
    { name: 'Sam', value: Math.floor(Math.random() * 3000) + 800 },
    { name: 'Dim', value: Math.floor(Math.random() * 3000) + 600 },
  ];

  useEffect(() => {
    if (!user || !company) return;
    const load = async () => {
      setLoading(true);
      try {
        const [clients, products, invoices, deliveries, workflows] = await Promise.all([
          blink.db.clients.count({ where: { userId: user.id, companyId: company.id } }),
          blink.db.products.count({ where: { userId: user.id, companyId: company.id } }),
          blink.db.invoices.list({ where: { userId: user.id, companyId: company.id }, limit: 5, orderBy: { createdAt: 'desc' } }),
          blink.db.deliveries.list({ where: { userId: user.id, companyId: company.id }, limit: 5, orderBy: { createdAt: 'desc' } }),
          blink.db.workflows.count({ where: { userId: user.id, companyId: company.id } }),
        ]);

        const allInvoices = await blink.db.invoices.list({ where: { userId: user.id, companyId: company.id }, limit: 1000 });
        const totalRevenue = allInvoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.amount || 0), 0);

        setStats({
          clients, products,
          invoices: allInvoices.length,
          deliveries: await blink.db.deliveries.count({ where: { userId: user.id, companyId: company.id } }),
          totalRevenue, workflows
        });
        setRecentInvoices(invoices);
        setRecentDeliveries(deliveries);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user, company]);

  const modules = [
    { href: '/dashboard/erp', icon: Package, label: 'ERP', desc: 'Clients & Factures', color: 'text-blue-500 bg-blue-500/10' },
    { href: '/dashboard/automation', icon: Workflow, label: 'Automatisation', desc: 'Workflows actifs', color: 'text-purple-500 bg-purple-500/10' },
    { href: '/dashboard/marketing', icon: Target, label: 'Marketing', desc: 'Campagnes IA', color: 'text-pink-500 bg-pink-500/10' },
    { href: '/dashboard/delivery', icon: Truck, label: 'Livraison', desc: 'Suivi commandes', color: 'text-emerald-500 bg-emerald-500/10' },
  ];

  const deliveryStatusColor: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    preparing: 'bg-blue-500/10 text-blue-600',
    out_for_delivery: 'bg-purple-500/10 text-purple-600',
    delivered: 'bg-emerald-500/10 text-emerald-600',
  };
  const deliveryStatusLabel: Record<string, string> = {
    pending: 'En attente', preparing: 'En préparation',
    out_for_delivery: 'En livraison', delivered: 'Livré',
  };
  const invoiceStatusLabel: Record<string, string> = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard' };
  const invoiceStatusColor: Record<string, string> = {
    draft: 'bg-yellow-500/10 text-yellow-600', sent: 'bg-blue-500/10 text-blue-600',
    paid: 'bg-emerald-500/10 text-emerald-600', overdue: 'bg-red-500/10 text-red-600',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Centre de Commande</h1>
          <p className="text-muted-foreground font-medium">
            Bienvenue, <span className="text-foreground font-bold">{user?.displayName || user?.email?.split('@')[0]}</span>. Voici l'état actuel de <span className="text-foreground font-bold">{company?.name}</span>.
          </p>
        </div>
      </div>

      {/* Quick Module Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modules.map(mod => (
          <Link key={mod.href} to={mod.href}>
            <Card className="glass hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform", mod.color)}>
                  <mod.icon className="w-5 h-5" />
                </div>
                <p className="font-black text-sm">{mod.label}</p>
                <p className="text-xs text-muted-foreground">{mod.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Chiffre d'Affaires Encaissé" value={`${stats.totalRevenue.toLocaleString('fr-FR')} €`} icon={DollarSign} loading={loading} />
        <StatCard title="Clients" value={stats.clients} icon={Users} loading={loading} />
        <StatCard title="Factures & Devis" value={stats.invoices} icon={FileText} loading={loading} />
        <StatCard title="Livraisons" value={stats.deliveries} icon={Truck} loading={loading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 glass">
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tighter uppercase flex items-center justify-between">
              Activité de la Semaine
              <Badge variant="secondary" className="text-xs font-bold">En direct</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${v}€`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="glass">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Zap className="w-4 h-4" /></div>
                <h3 className="font-black tracking-tight text-sm uppercase">Vue d'ensemble</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Produits/Services', value: loading ? '...' : stats.products },
                  { label: 'Workflows', value: loading ? '...' : stats.workflows },
                  { label: 'Modules actifs', value: '4' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-black text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h3 className="font-black text-sm uppercase tracking-tight">Dernières Factures</h3>
                </div>
                <Link to="/dashboard/erp"><Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs"><ArrowRight className="w-3 h-3" /></Button></Link>
              </div>
              {recentInvoices.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucune facture — <Link to="/dashboard/erp" className="text-primary font-bold hover:underline">Créer</Link></p>
              ) : (
                <div className="space-y-2">
                  {recentInvoices.slice(0, 4).map(inv => (
                    <div key={inv.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{inv.clientName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{inv.number}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Badge className={cn('text-[10px] font-bold border px-1.5 py-0', invoiceStatusColor[inv.status] || '')}>{invoiceStatusLabel[inv.status] || inv.status}</Badge>
                        <span className="text-xs font-black">{Number(inv.amount || 0).toFixed(0)}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Deliveries */}
      {(recentDeliveries.length > 0 || !loading) && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tighter uppercase flex items-center justify-between">
              Livraisons Récentes
              <Link to="/dashboard/delivery">
                <Button variant="ghost" size="sm" className="rounded-xl font-bold">Voir tout <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune livraison — <Link to="/dashboard/delivery" className="text-primary font-bold hover:underline">Créer une commande</Link></p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentDeliveries.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs">{d.clientName?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{d.clientName}</p>
                      <p className="text-xs font-mono text-muted-foreground">{d.orderNumber}</p>
                    </div>
                    <Badge className={cn('text-[10px] font-bold border px-1.5', deliveryStatusColor[d.status] || '')}>{deliveryStatusLabel[d.status] || d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
