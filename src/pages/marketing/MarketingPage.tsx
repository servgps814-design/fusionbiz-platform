import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Megaphone, Plus, Search, MoreHorizontal, Filter, Loader2, Trash2, Edit,
  Send, Users, TrendingUp, Mail, Smartphone, Share2, CheckCircle2,
  Clock, XCircle, PauseCircle,
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string; name: string; type: string; status: string; subject?: string;
  content?: string; sentCount?: number; openRate?: number; clickRate?: number;
  scheduledAt?: string; createdAt: string;
}
interface Segment {
  id: string; name: string; description?: string; count?: number; createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const genId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── Config ───────────────────────────────────────────────────────────────────

const campaignTypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  email:  { label: 'Email',  icon: Mail,       color: 'text-blue-600' },
  sms:    { label: 'SMS',    icon: Smartphone,  color: 'text-green-600' },
  social: { label: 'Social', icon: Share2,      color: 'text-purple-600' },
  push:   { label: 'Push',   icon: Send,        color: 'text-orange-600' },
};

const campaignStatusCfg: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft:     { label: 'Brouillon', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', icon: Clock },
  active:    { label: 'Active',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900', icon: CheckCircle2 },
  paused:    { label: 'Pausée',    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900', icon: PauseCircle },
  completed: { label: 'Terminée', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900', icon: CheckCircle2 },
  cancelled: { label: 'Annulée',  className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900', icon: XCircle },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function CampaignStatusBadge({ status }: { status: string }) {
  const cfg = campaignStatusCfg[status] ?? campaignStatusCfg.draft;
  const Icon = cfg.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
      cfg.className
    )}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

// ─── Campaign Dialog ──────────────────────────────────────────────────────────

function CampaignDialog({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void;
  onSave: (d: any) => Promise<void>; initial?: Partial<Campaign>;
}) {
  const [form, setForm] = useState({ name: '', type: 'email', subject: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({
      name: initial?.name || '',
      type: initial?.type || 'email',
      subject: initial?.subject || '',
      content: initial?.content || '',
    });
  }, [open]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-7 pt-7 pb-0">
          <DialogTitle className="text-lg font-black tracking-tight">
            {initial ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </DialogTitle>
          <DialogDescription>Renseignez les informations de la campagne</DialogDescription>
        </DialogHeader>
        <div className="px-7 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ex: Newsletter janvier 2025"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(campaignTypeLabels).map(([val, cfg]) => (
                  <SelectItem key={val} value={val}>
                    <div className="flex items-center gap-2">
                      <cfg.icon className={cn('w-4 h-4', cfg.color)} />
                      {cfg.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(form.type === 'email' || form.type === 'push') && (
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Objet / Titre</Label>
              <Input
                placeholder="Objet du message"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Contenu</Label>
            <Textarea
              placeholder="Contenu de la campagne..."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="rounded-xl resize-none text-sm"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter className="px-7 pb-7 pt-4 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl min-w-[120px]">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initial ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const MarketingPage = () => {
  const { pathname } = useLocation();
  const { company } = useCompany();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Campaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeTab = pathname.includes('/segments') ? 'segments' : 'campaigns';

  const TABS = [
    { label: 'Campagnes', href: '/dashboard/marketing/campaigns', key: 'campaigns' },
    { label: 'Segments',  href: '/dashboard/marketing/segments',  key: 'segments'  },
  ];

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [campData, segData] = await Promise.all([
        blink.db.campaigns.list({ where: { companyId: company.id }, orderBy: { createdAt: 'desc' }, limit: 100 }),
        blink.db.audienceSegments.list({ where: { organizationId: company.id }, limit: 50 }),
      ]);
      setCampaigns(campData as Campaign[]);
      setSegments(segData as Segment[]);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total:   campaigns.length,
    active:  campaigns.filter(c => c.status === 'active').length,
    sent:    campaigns.filter(c => (c.sentCount || 0) > 0).reduce((s, c) => s + (c.sentCount || 0), 0),
    avgOpen: (() => {
      const withOpen = campaigns.filter(c => (c.openRate || 0) > 0);
      return withOpen.length ? withOpen.reduce((s, c) => s + (c.openRate || 0), 0) / withOpen.length : 0;
    })(),
  };

  const handleSave = async (data: any) => {
    if (!company || !user) return;
    try {
      if (editItem) {
        await blink.db.campaigns.update(editItem.id, {
          name: data.name, type: data.type, subject: data.subject || null, content: data.content || null,
        });
        toast.success('Campagne mise à jour');
      } else {
        await blink.db.campaigns.create({
          id: `camp_${genId()}`,
          userId: user.id, companyId: company.id,
          name: data.name, type: data.type, status: 'draft',
          subject: data.subject || null, content: data.content || null, sentCount: 0,
        });
        toast.success('Campagne créée');
      }
      setDialogOpen(false);
      setEditItem(null);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await blink.db.campaigns.delete(deleteId);
      toast.success('Campagne supprimée');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filtered = campaigns.filter(c => {
    const matchS  = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchSt = statusFilter === 'all' || c.status === statusFilter;
    return matchS && matchSt;
  });

  return (
    <div className="p-6 lg:p-8 animate-in-up space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Marketing</h1>
          <p className="page-subtitle">Gérez vos campagnes et segments d'audience</p>
        </div>
        <Button
          onClick={() => { setEditItem(null); setDialogOpen(true); }}
          className="rounded-xl gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />Nouvelle campagne
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Campagnes',         value: stats.total,                      icon: Megaphone,   color: 'text-primary' },
          { label: 'Actives',           value: stats.active,                     icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Envois total',      value: stats.sent.toLocaleString('fr-FR'), icon: Send,       color: 'text-blue-600' },
          { label: 'Taux ouverture moy.', value: `${stats.avgOpen.toFixed(1)}%`, icon: TrendingUp,  color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="metric-card flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center bg-muted', s.color)}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-black tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(tab => (
          <Link
            key={tab.href}
            to={tab.href}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <>
          <Card className="border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une campagne..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 rounded-xl">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(campaignStatusCfg).map(([val, cfg]) => (
                      <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Megaphone className="w-7 h-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground mb-1">Aucune campagne</p>
                  <p className="text-xs text-muted-foreground mb-4">Créez votre première campagne marketing</p>
                  <Button size="sm" className="rounded-xl" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />Créer une campagne
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['Nom', 'Type', 'Statut', 'Envois', 'Taux ouv.', 'Créée', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground last:text-right">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => {
                        const type = campaignTypeLabels[c.type] || campaignTypeLabels.email;
                        const TypeIcon = type.icon;
                        return (
                          <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4 font-bold">{c.name}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <TypeIcon className={cn('w-4 h-4', type.color)} />
                                <span className="text-xs text-muted-foreground">{type.label}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4"><CampaignStatusBadge status={c.status} /></td>
                            <td className="px-5 py-4 text-xs text-muted-foreground tabular-nums">
                              {(c.sentCount || 0).toLocaleString('fr-FR')}
                            </td>
                            <td className="px-5 py-4 text-xs font-bold">
                              {c.openRate ? `${Number(c.openRate).toFixed(1)}%` : '—'}
                            </td>
                            <td className="px-5 py-4 text-xs text-muted-foreground">{fmtDate(c.createdAt)}</td>
                            <td className="px-5 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuItem
                                    onClick={() => { setEditItem(c); setDialogOpen(true); }}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4" />Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeleteId(c.id)}
                                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Segments Tab */}
      {activeTab === 'segments' && (
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-wider">Segments d'audience</CardTitle>
              <Button size="sm" className="rounded-xl gap-1.5">
                <Plus className="w-4 h-4" />Nouveau segment
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : segments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-bold text-muted-foreground mb-1">Aucun segment défini</p>
                <p className="text-xs text-muted-foreground">Créez des segments pour cibler votre audience</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {segments.map(seg => (
                  <div key={seg.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
                    <div>
                      <p className="font-bold text-sm">{seg.name}</p>
                      {seg.description && <p className="text-xs text-muted-foreground mt-0.5">{seg.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-black tabular-nums">{(seg.count || 0).toLocaleString('fr-FR')}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">contacts</p>
                      </div>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CampaignDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditItem(null); }}
        onSave={handleSave}
        initial={editItem || undefined}
      />
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
