import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { cn } from '@/lib/utils';

const data = [
  { name: 'Lun', value: 4000 },
  { name: 'Mar', value: 3000 },
  { name: 'Mer', value: 2000 },
  { name: 'Jeu', value: 2780 },
  { name: 'Ven', value: 1890 },
  { name: 'Sam', value: 2390 },
  { name: 'Dim', value: 3490 },
];

const StatCard = ({ title, value, change, trend, icon: Icon }: any) => (
  <Card className="glass overflow-hidden group">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}%
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
      </div>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Centre de Commande</h1>
          <p className="text-muted-foreground font-medium">Bienvenue sur FusionBiz. Voici l'état actuel de votre entreprise.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold">Exporter</Button>
          <Button className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20">Voir les rapports</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Chiffre d'Affaires" 
          value="128,430 €" 
          change="12.5" 
          trend="up" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Nouveaux Clients" 
          value="+2,450" 
          change="8.2" 
          trend="up" 
          icon={Users} 
        />
        <StatCard 
          title="Commandes" 
          value="456" 
          change="4.1" 
          trend="down" 
          icon={Package} 
        />
        <StatCard 
          title="Activité IA" 
          value="98.2%" 
          change="2.4" 
          trend="up" 
          icon={Activity} 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass">
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tighter uppercase">Performance des Ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tighter uppercase">Activités Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">Nouvelle commande #FB-1234{i}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Il y a {i * 10} minutes • Client: Jean Dupont</p>
                  </div>
                  <div className="text-xs font-bold text-primary">+245€</div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 rounded-xl font-bold">Voir toute l'activité</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};