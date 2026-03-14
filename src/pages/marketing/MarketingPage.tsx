import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Megaphone, Plus, Search, MoreHorizontal, Trash2, Loader2,
  Send, Clock, CheckCircle2, XCircle, Users, BarChart3
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Campagnes', href: '/dashboard/marketing/campaigns' },
  { label: 'Segments', href: '/dashboard/marketing/segments' },
];

const statusConfig: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  draft:     { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600',      icon: Clock },
  scheduled: { label: 'Planifiée', cls: 'bg-blue-100 text-blue-700',        icon: Clock },
  active:    { label: 'Active',    cls: 'bg-emerald-100 text-emerald-700',   icon: CheckCircle2 },
  paused:    { label: 'En pause',  cls: 'bg-amber-100 text-amber-700',       icon: Clock },
  completed: { label: 'Terminée', cls: 'bg-violet-100 text-violet-700',     icon: CheckCircle2 },
  cancelled: { label: 'Annulée',  cls: 'bg-red-100 text-red-700',          icon: XCircle },
};

const CAMPAIGN_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'social', label: 'Réseaux sociaux' },
  { value: 'push', label: 'Notification push' },
];

const CampaignsTab = ({ companyId, userId }: { companyId: string; userId: string }) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email', subject: '', content: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blink.db.campaigns.list({ where: { companyId }, orderBy: { createdAt: 'desc' }, limit: 100 });
      setCampaigns(data as any[]);
    } catch { setCampaigns([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nom de campagne requis'); return; }
    setSaving(true);
    try {
      await blink.db.campaigns.create({
        id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId, companyId,
        name: form.name, type: form.type, subject: form.subject,
        content: form.content, status: 'draft',
        sentCount: 0, openRate: 0, clickRate: 0,
      });
      toast.success('Campagne créée');
      setShowNew(false);
      setForm({ name: '', type: 'email', subject: '', content: '' });
      load();
    } catch { toast.error('Erreur lors de la création'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await blink.db.campaigns.delete(id);
      toast.success('Campagne supprimée');
      setCampaigns(p => p.filter(c => c.id !== id));
    } catch { toast.error('Erreur'); }
  };

  const filtered = campaigns.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  const totalSent = filtered.reduce((s, c) => s + Number(c.sentCount || 0), 0);
  const avgOpen = filtered.length > 0
    ? (filtered.reduce((s, c) => s + Number(c.openRate || 0), 0) / filtered.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Campagnes</p>
          <p className="text-2xl font-black">{filtered.length}</p>
        </div>
        <div className="metric-card text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Messages envoyés</p>
          <p className="text-2xl font-black">{totalSent.toLocaleString('fr-FR')}</p>
        </div>
        <div className="metric-card text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Taux d'ouverture moy.</p>
          <p className="text-2xl font-black">{avgOpen}%</p>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher une campagne..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="w-4 h-4" />Nouvelle campagne</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Megaphone className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-semibold">Aucune campagne</p>
            <p className="text-sm text-muted-foreground mt-1">Créez votre première campagne marketing</p>
            <Button onClick={() => setShowNew(true)} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Créer une campagne</Button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Type</th><th>Envoyés</th><th>Ouvertures</th><th>Clics</th><th>Statut</th><th className="w-12"></th></tr></thead>
            <tbody>
              {filtered.map(c => {
                const cfg = statusConfig[c.status] ?? statusConfig.draft;
                const Icon = cfg.icon;
                const typeLabel = CAMPAIGN_TYPES.find(t => t.value === c.type)?.label || c.type;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="font-semibold text-sm">{c.name}</div>
                      {c.subject && <div className="text-xs text-muted-foreground truncate max-w-xs">{c.subject}</div>}
                    </td>
                    <td><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">{typeLabel}</span></td>
                    <td className="text-sm">{Number(c.sentCount || 0).toLocaleString('fr-FR')}</td>
                    <td className="text-sm">{Number(c.openRate || 0).toFixed(1)}%</td>
                    <td className="text-sm">{Number(c.clickRate || 0).toFixed(1)}%</td>
                    <td>
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold', cfg.cls)}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(c.id)} className="gap-2 text-destructive focus:text-destructive">
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
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle campagne</DialogTitle>
            <DialogDescription>Configurez votre campagne marketing</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom de la campagne *</Label>
              <Input placeholder="Ex: Newsletter Janvier 2025" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CAMPAIGN_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Objet de l'email</Label>
              <Input placeholder="Objet du message" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Contenu</Label>
              <Textarea rows={4} placeholder="Contenu de votre message..." value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Créer la campagne</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SegmentsTab = ({ companyId, userId }: { companyId: string; userId: string }) => {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blink.db.audienceSegments.list({ where: { organizationId: companyId }, orderBy: { createdAt: 'desc' }, limit: 50 });
      setSegments(data as any[]);
    } catch { setSegments([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    setSaving(true);
    try {
      await blink.db.audienceSegments.create({
        id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: companyId,
        name: form.name, description: form.description,
        filters: '[]', count: 0,
      });
      toast.success('Segment créé');
      setShowNew(false);
      setForm({ name: '', description: '' });
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="w-4 h-4" />Nouveau segment</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : segments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-semibold">Aucun segment</p>
            <p className="text-sm text-muted-foreground mt-1">Créez des segments d'audience pour cibler vos campagnes</p>
            <Button onClick={() => setShowNew(true)} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Créer un segment</Button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Description</th><th>Contacts</th><th>Créé le</th></tr></thead>
            <tbody>
              {segments.map(s => (
                <tr key={s.id}>
                  <td className="font-semibold text-sm">{s.name}</td>
                  <td className="text-sm text-muted-foreground">{s.description || '—'}</td>
                  <td className="text-sm">{s.count || 0}</td>
                  <td className="text-sm text-muted-foreground">{s.createdAt ? new Date(s.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau segment</DialogTitle><DialogDescription>Définissez un groupe de contacts</DialogDescription></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5"><Label>Nom *</Label>
              <Input placeholder="Ex: Clients actifs" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="space-y-1.5"><Label>Description</Label>
              <Textarea rows={2} placeholder="Description du segment..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const MarketingPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { company } = useCompany();

  if (!company || !user) return null;

  const isSegments = location.pathname.includes('segments');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Marketing</h1>
          <p className="page-subtitle">Campagnes multicanal et segmentation d'audience</p>
        </div>
      </div>
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <Link key={tab.href} to={tab.href}
            className={cn(
              'px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              (!isSegments && tab.href.includes('campaigns')) || (isSegments && tab.href.includes('segments'))
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {isSegments
        ? <SegmentsTab companyId={company.id} userId={user.id} />
        : <CampaignsTab companyId={company.id} userId={user.id} />
      }
    </div>
  );
};
