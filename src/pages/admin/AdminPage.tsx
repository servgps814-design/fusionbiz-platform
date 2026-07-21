import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fusionbizAuth, type LocalCompany } from '@/lib/auth-enhanced';
import { useAdminMode } from '@/hooks/useAdminMode';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, BarChart3, Gift, LogOut, Settings, Check, X, Clock, Search,
  ChevronRight, Crown, Zap, DollarSign, TrendingUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export function AdminPage() {
  const navigate = useNavigate();
  const { isAdminMode } = useAdminMode();
  const [tab, setTab] = useState('approvals');
  const [pendingCompanies, setPendingCompanies] = useState<LocalCompany[]>([]);
  const [allCompanies, setAllCompanies] = useState<LocalCompany[]>([]);
  const [promotionCodes, setPromotionCodes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalCompanies: 0,
    pendingApprovals: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalCreditsIssued: 0,
  });

  useEffect(() => {
    if (!isAdminMode) {
      navigate('/');
      return;
    }
    loadAdminData();
  }, [isAdminMode, navigate]);

  const loadAdminData = async () => {
    try {
      const companies = (await fusionbizAuth.db.companies.list()) as LocalCompany[];
      const promos = (await fusionbizAuth.db.promotion_codes.list()) as any[];

      const pending = companies.filter((c) => c.status === 'pending');
      const approved = companies.filter((c) => c.status === 'approved');

      setPendingCompanies(pending);
      setAllCompanies(companies);
      setPromotionCodes(promos);

      // Calculate stats
      const totalRevenue = companies.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
      const totalCredits = companies.reduce((sum, c) => sum + c.credits, 0);

      setStats({
        totalCompanies: companies.length,
        pendingApprovals: pending.length,
        activeSubscriptions: approved.length,
        totalRevenue,
        totalCreditsIssued: totalCredits,
      });
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleApproveCompany = async (companyId: string) => {
    try {
      await fusionbizAuth.db.companies.update(companyId, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });
      loadAdminData();
    } catch (error) {
      console.error('Failed to approve company:', error);
    }
  };

  const handleRejectCompany = async (companyId: string, reason: string) => {
    try {
      await fusionbizAuth.db.companies.update(companyId, {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
      });
      loadAdminData();
    } catch (error) {
      console.error('Failed to reject company:', error);
    }
  };

  const handleSuspendCompany = async (companyId: string) => {
    try {
      await fusionbizAuth.db.companies.update(companyId, {
        status: 'suspended',
        suspendedAt: new Date().toISOString(),
      });
      loadAdminData();
    } catch (error) {
      console.error('Failed to suspend company:', error);
    }
  };

  const handleAddCredits = async (companyId: string, amount: number, reason: string) => {
    try {
      const company = (await fusionbizAuth.db.companies.get(companyId)) as LocalCompany;
      await fusionbizAuth.db.companies.update(companyId, {
        credits: company.credits + amount,
      });

      // Create loyalty reward record
      await fusionbizAuth.db.loyalty_rewards.create({
        id: `reward_${Date.now()}`,
        companyId,
        type: 'credits',
        value: amount,
        reason: 'admin_gift',
        description: reason,
        createdAt: new Date().toISOString(),
      });

      loadAdminData();
    } catch (error) {
      console.error('Failed to add credits:', error);
    }
  };

  const filteredCompanies = allCompanies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">FusionBiz Admin</h1>
              <p className="text-sm text-slate-400">Gestion complète de la plateforme</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              fusionbizAuth.auth.logout();
              navigate('/');
            }}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-slate-700 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Entreprises Total', value: stats.totalCompanies, icon: Users, color: 'blue' },
              { label: 'En attente', value: stats.pendingApprovals, icon: Clock, color: 'yellow' },
              { label: 'Actives', value: stats.activeSubscriptions, icon: Check, color: 'green' },
              { label: 'Chiffre mensuel', value: `${stats.totalRevenue.toFixed(0)}€`, icon: TrendingUp, color: 'emerald' },
              { label: 'Crédits émis', value: stats.totalCreditsIssued, icon: Zap, color: 'purple' },
            ].map((stat, i) => (
              <Card key={i} className="bg-slate-700/50 border-slate-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 opacity-50 text-${stat.color}-400`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-slate-700 border-b border-slate-600">
            <TabsTrigger value="approvals" className="gap-2">
              <Clock className="w-4 h-4" />
              Approbations ({stats.pendingApprovals})
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="promotions" className="gap-2">
              <Gift className="w-4 h-4" />
              Promotions & Fidélité
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6 mt-6">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle>Demandes d'approbation</CardTitle>
                <CardDescription>Examinez et approuvez les nouvelles entreprises</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingCompanies.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">Aucune demande en attente ✓</p>
                ) : (
                  pendingCompanies.map((company) => (
                    <ApprovalCard
                      key={company.id}
                      company={company}
                      onApprove={() => handleApproveCompany(company.id)}
                      onReject={(reason) => handleRejectCompany(company.id, reason)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6 mt-6">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle>Gestion des Clients</CardTitle>
                <CardDescription>Visualisez et gérez toutes les entreprises</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-600 border-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredCompanies.map((company) => (
                    <ClientCard
                      key={company.id}
                      company={company}
                      onSuspend={() => handleSuspendCompany(company.id)}
                      onAddCredits={(amount, reason) => handleAddCredits(company.id, amount, reason)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-6 mt-6">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle>Codes Promotionnels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {promotionCodes.map((promo) => (
                    <div
                      key={promo.id}
                      className="flex items-center justify-between p-4 bg-slate-600/50 rounded border border-slate-500"
                    >
                      <div>
                        <p className="font-semibold">{promo.code}</p>
                        <p className="text-sm text-slate-400">{promo.description}</p>
                      </div>
                      <Badge variant="outline">{promo.value}% off</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">Graphiques à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Approval Card ─────────────────────────────────────────────────────────

function ApprovalCard({
  company,
  onApprove,
  onReject,
}: {
  company: LocalCompany;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [showRejectForm, setShowRejectForm] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');

  return (
    <div className="p-4 bg-slate-600/50 rounded border border-slate-500 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{company.name}</h3>
          <p className="text-sm text-slate-400">{company.industry}</p>
        </div>
        <Badge className="bg-yellow-500/20 text-yellow-300">Nouveau</Badge>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-400">SIRET</p>
          <p className="font-mono">{company.siret}</p>
        </div>
        <div>
          <p className="text-slate-400">Adresse</p>
          <p>{company.city}, {company.postalCode}</p>
        </div>
        <div>
          <p className="text-slate-400">Téléphone</p>
          <p>{company.phone}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onApprove} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
          <Check className="w-4 h-4 mr-1" />
          Approuver
        </Button>
        <Button
          onClick={() => setShowRejectForm(true)}
          variant="destructive"
          className="flex-1"
          size="sm"
        >
          <X className="w-4 h-4 mr-1" />
          Refuser
        </Button>
      </div>
      {showRejectForm && (
        <div className="space-y-2">
          <Input
            placeholder="Raison du refus..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="bg-slate-700 border-slate-600"
          />
          <Button
            size="sm"
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => {
              onReject(rejectionReason);
              setShowRejectForm(false);
            }}
          >
            Confirmer
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Client Card ───────────────────────────────────────────────────────────

function ClientCard({
  company,
  onSuspend,
  onAddCredits,
}: {
  company: LocalCompany;
  onSuspend: () => void;
  onAddCredits: (amount: number, reason: string) => void;
}) {
  const [showCreditsForm, setShowCreditsForm] = React.useState(false);
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');

  const statusColors = {
    approved: 'bg-green-500/20 text-green-300',
    pending: 'bg-yellow-500/20 text-yellow-300',
    rejected: 'bg-red-500/20 text-red-300',
    suspended: 'bg-gray-500/20 text-gray-300',
  };

  return (
    <div className="p-4 bg-slate-600/50 rounded border border-slate-500">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">{company.name}</h3>
          <p className="text-sm text-slate-400">{company.industry}</p>
        </div>
        <Badge className={statusColors[company.status]}>
          {company.status.toUpperCase()}
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-4 text-sm mb-3">
        <div>
          <p className="text-slate-400">Plan</p>
          <p className="font-semibold capitalize">{company.subscriptionPlan}</p>
        </div>
        <div>
          <p className="text-slate-400">Crédits</p>
          <p className="font-semibold text-purple-400">{company.credits}</p>
        </div>
        <div>
          <p className="text-slate-400">Max Users</p>
          <p className="font-semibold">{company.maxUsers}</p>
        </div>
        <div>
          <p className="text-slate-400">Revenue</p>
          <p className="font-semibold text-emerald-400">{company.monthlyRevenue || 0}€</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => setShowCreditsForm(!showCreditsForm)}
        >
          <Zap className="w-4 h-4 mr-1" />
          Crédits
        </Button>
        {company.status !== 'suspended' && (
          <Button size="sm" variant="destructive" className="flex-1" onClick={onSuspend}>
            <X className="w-4 h-4 mr-1" />
            Suspendre
          </Button>
        )}
      </div>
      {showCreditsForm && (
        <div className="mt-3 space-y-2">
          <Input
            type="number"
            placeholder="Crédits"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-slate-700 border-slate-600"
          />
          <Input
            placeholder="Raison"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-slate-700 border-slate-600"
          />
          <Button
            size="sm"
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              onAddCredits(parseInt(amount), reason);
              setAmount('');
              setReason('');
              setShowCreditsForm(false);
            }}
          >
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
