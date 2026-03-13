import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Users, Package, DollarSign, Activity,
  ArrowUpRight, ArrowDownRight, FileText, Truck,
  Target, Workflow, ArrowRight, Zap, Clock,
  ChevronRight, Calendar, AlertCircle, CheckCircle2,
  Receipt, Wallet, Landmark
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, subValue, trend, icon: Icon, loading, color }: any) => (
  <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className={cn("absolute top-0 left-0 w-1 h-full", color || "bg-blue-600")} />
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", 
          color ? `bg-${color.split('-')[1]}-50 text-${color.split('-')[1]}-600` : "bg-blue-50 text-blue-600")}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full",
            trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        ) : (
          <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{value}</h3>
        )}
        {subValue && <p className="text-xs font-bold text-slate-400 mt-1">{subValue}</p>}
      </div>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [stats, setStats] = useState({ clients: 0, products: 0, invoices: 0, deliveries: 0, totalRevenue: 0, expenses: 0 });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !company) return;
    const load = async () => {
      setLoading(true);
      try {
        const [clients, allInvoices, expenses, deliveries] = await Promise.all([
          blink.db.clients.count({ where: { companyId: company.id } }),
          blink.db.invoices.list({ where: { companyId: company.id }, limit: 1000 }),
          blink.db.expenses.list({ where: { companyId: company.id } }),
          blink.db.deliveries.list({ where: { companyId: company.id }, limit: 5, orderBy: { createdAt: 'desc' } })
        ]);

        const totalRevenue = allInvoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
        const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

        setStats({
          clients, products: 0,
          invoices: allInvoices.length,
          deliveries: deliveries.length,
          totalRevenue,
          expenses: totalExpenses
        });
        setRecentInvoices(allInvoices.slice(0, 5));
        
        // Mock pending tasks for UI polish
        setPendingTasks([
          { id: 1, type: 'tax', label: 'Déclaration TVA Trimestre 1', due: 'Dans 4 jours', priority: 'high' },
          { id: 2, type: 'invoice', label: '3 factures en retard de paiement', due: 'Urgent', priority: 'high' },
          { id: 3, type: 'kyc', label: 'Validation dossier KBIS', due: 'En cours', priority: 'medium' },
        ]);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user, company]);

  const chartData = [
    { name: 'Jan', revenue: 4000, expenses: 2400 },
    { name: 'Fév', revenue: 3000, expenses: 1398 },
    { name: 'Mar', revenue: 2000, expenses: 9800 },
    { name: 'Avr', revenue: 2780, expenses: 3908 },
    { name: 'Mai', revenue: 1890, expenses: 4800 },
    { name: 'Juin', revenue: 2390, expenses: 3800 },
  ];

  return (
    <div className="space-y-10 animate-fade-in max-w-6xl mx-auto pb-20">
      {/* Header with Welcome Message */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
            Bonjour, {user?.displayName || "l'ami"} 👋
          </h1>
          <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1.5 text-blue-600 uppercase tracking-widest text-[10px]"><CheckCircle2 className="w-3.5 h-3.5" /> Société : {company?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold h-12 px-6 border-slate-200">
            <Download className="w-4 h-4 mr-2" /> Rapports
          </Button>
          <Button className="rounded-xl font-black h-12 px-8 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 text-white">
            <Plus className="w-4 h-4 mr-2" /> Action Rapide
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Chiffre d'Affaires" 
          value={`${stats.totalRevenue.toLocaleString('fr-FR')} €`} 
          subValue="Encaissé ce mois"
          trend={12.5}
          icon={Wallet} 
          loading={loading}
          color="bg-blue-600"
        />
        <StatCard 
          title="Dépenses" 
          value={`${stats.expenses.toLocaleString('fr-FR')} €`} 
          subValue="Sorties ce mois"
          trend={-4.2}
          icon={Receipt} 
          loading={loading}
          color="bg-purple-600"
        />
        <StatCard 
          title="Résultat Net" 
          value={`${(stats.totalRevenue - stats.expenses).toLocaleString('fr-FR')} €`} 
          subValue="Avant impôts"
          icon={Landmark} 
          loading={loading}
          color="bg-emerald-600"
        />
        <StatCard 
          title="Clients Actifs" 
          value={stats.clients} 
          subValue="+3 cette semaine"
          trend={8.1}
          icon={Users} 
          loading={loading}
          color="bg-orange-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-8">
              <div>
                <CardTitle className="text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">Santé Financière</CardTitle>
                <CardDescription className="font-bold">Evolution du CA vs Dépenses</CardDescription>
              </div>
              <Select defaultValue="6m">
                <SelectTrigger className="w-32 rounded-xl h-9 font-bold text-xs">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 mois</SelectItem>
                  <SelectItem value="3m">3 mois</SelectItem>
                  <SelectItem value="6m">6 mois</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(37, 99, 235)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="rgb(37, 99, 235)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(147, 51, 234)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="rgb(147, 51, 234)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                      tickFormatter={v => `${v}€`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderColor: '#f1f5f9', 
                        borderRadius: '16px', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px', 
                        fontWeight: '800' 
                      }} 
                    />
                    <Area type="monotone" dataKey="revenue" stroke="rgb(37, 99, 235)" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="expenses" stroke="rgb(147, 51, 234)" strokeWidth={4} fillOpacity={1} fill="url(#colorExpenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-6 mt-6 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Chiffre d'Affaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Dépenses</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module Grid Section */}
          <div className="grid grid-cols-2 gap-4">
             <Card className="bg-blue-600 text-white border-none shadow-xl shadow-blue-100 p-6 flex flex-col justify-between h-48 group cursor-pointer overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <Bot className="w-10 h-10 mb-4 opacity-80" />
                <div>
                  <p className="text-sm font-black uppercase tracking-widest opacity-70">IA Assistant</p>
                  <h4 className="text-xl font-black tracking-tight">Besoin d'aide ?</h4>
                  <p className="text-xs font-bold mt-1 opacity-80 flex items-center group-hover:translate-x-1 transition-transform">Demandez à l'IA <ChevronRight className="w-3 h-3 ml-1" /></p>
                </div>
             </Card>
             <Card className="bg-slate-900 text-white border-none shadow-xl shadow-slate-200 p-6 flex flex-col justify-between h-48 group cursor-pointer overflow-hidden relative">
                <Network className="w-10 h-10 mb-4 opacity-80 text-blue-500" />
                <div>
                  <p className="text-sm font-black uppercase tracking-widest opacity-70">Réseau B2B</p>
                  <h4 className="text-xl font-black tracking-tight">Interconnecté</h4>
                  <p className="text-xs font-bold mt-1 opacity-80 flex items-center group-hover:translate-x-1 transition-transform">Explorer les partenaires <ChevronRight className="w-3 h-3 ml-1" /></p>
                </div>
             </Card>
          </div>
        </div>

        {/* Sidebar Tasks & Recent Activity */}
        <div className="space-y-8">
          <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">À Faire (Indy Style)</CardTitle>
                <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px]">{pendingTasks.length}</Badge>
              </div>
              <CardDescription className="text-xs font-bold">Actions recommandées pour votre gestion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingTasks.map(task => (
                <div key={task.id} className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-200 hover:bg-white transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5", 
                      task.priority === 'high' ? "bg-red-500 animate-pulse" : "bg-blue-500") 
                    } />
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight mb-1">{task.label}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{task.due}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 py-6 h-auto">
                Voir toutes les tâches
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Derniers Flux</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentInvoices.slice(0, 4).map(inv => (
                  <div key={inv.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">{inv.clientName}</p>
                        <p className="text-[10px] font-bold text-slate-400">Facture #{inv.number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{Number(inv.amount).toFixed(0)} €</p>
                      <p className={cn("text-[9px] font-black uppercase tracking-widest", 
                        inv.status === 'paid' ? "text-emerald-500" : "text-yellow-500")}>
                        {inv.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {recentInvoices.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-xs font-bold italic">Aucune activité récente.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

import { Download, Network } from 'lucide-react';
