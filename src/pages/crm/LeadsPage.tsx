import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Target, Plus, Search, MoreHorizontal, Edit, Trash2, Building2,
  User, TrendingUp, LayoutGrid, List, Euro, Loader2,
  ChevronDown, X, Zap, Star, PhoneCall, Mail
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  user_id: string;
  organization_id: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  score: number;
  estimated_value?: number;
  source?: string;
  notes?: string;
  assigned_to?: string;
  created_at: string;
}

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
type ViewMode = 'kanban' | 'list';

// ─── Config ───────────────────────────────────────────────────────────────────
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const STAGES: { value: LeadStatus; label: string; color: string; bg: string; border: string; dot: string }[] = [
  { value: 'new', label: 'Nouveau', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacté', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualifié', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  { value: 'proposal', label: 'Proposition', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
  { value: 'won', label: 'Gagné', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'lost', label: 'Perdu', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
];

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.value, s]));

const SOURCES = [
  { value: 'website', label: 'Site web' },
  { value: 'referral', label: 'Référencement' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Appel entrant' },
  { value: 'event', label: 'Événement' },
  { value: 'other', label: 'Autre' },
];

const formatCurrency = (v?: number) =>
  v != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '—';

const getLeadName = (l: Lead) =>
  l.company_name || `${l.first_name || ''} ${l.last_name || ''}`.trim() || '—';

// ─── Score Bar ────────────────────────────────────────────────────────────────
const ScoreBar = ({ score }: { score: number }) => {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 70 ? 'bg-emerald-500' :
    pct >= 40 ? 'bg-amber-500' :
    'bg-slate-300';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-[11px] font-black tabular-nums', 
        pct >= 70 ? 'text-emerald-600' :
        pct >= 40 ? 'text-amber-600' : 'text-muted-foreground'
      )}>
        {pct}
      </span>
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: LeadStatus }) => {
  const s = STAGE_MAP[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border',
      s.bg, s.color, s.border
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
};

// ─── Lead Form Dialog ─────────────────────────────────────────────────────────
const emptyLeadForm = {
  first_name: '',
  last_name: '',
  company_name: '',
  email: '',
  phone: '',
  status: 'new' as LeadStatus,
  score: '50',
  estimated_value: '',
  source: 'website',
  notes: '',
  assigned_to: '',
};

const LeadDialog = ({
  open, onClose, onSave, initial
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: typeof emptyLeadForm) => Promise<void>;
  initial?: Partial<typeof emptyLeadForm>;
}) => {
  const [form, setForm] = useState({ ...emptyLeadForm, ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...emptyLeadForm, ...initial });
  }, [open, initial]);

  const set = (k: keyof typeof emptyLeadForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.last_name.trim() && !form.company_name.trim()) {
      toast.error('Le nom ou la société est requis');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!(initial?.first_name || initial?.company_name || initial?.last_name);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-7 pt-7 pb-0">
          <DialogTitle className="text-lg font-black tracking-tight">
            {isEdit ? 'Modifier le prospect' : 'Nouveau prospect'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit ? 'Mettez à jour les informations du prospect.' : 'Renseignez les informations pour créer un nouveau prospect.'}
          </p>
        </DialogHeader>

        <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prénom</Label>
              <Input placeholder="Jean" value={form.first_name} onChange={e => set('first_name', e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom</Label>
              <Input placeholder="Dupont" value={form.last_name} onChange={e => set('last_name', e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Société</Label>
            <Input placeholder="Dupont Conseil" value={form.company_name} onChange={e => set('company_name', e.target.value)} className="rounded-xl" />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input type="email" placeholder="j.dupont@exemple.fr" value={form.email} onChange={e => set('email', e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Téléphone</Label>
              <Input placeholder="+33 6 12 34 56 78" value={form.phone} onChange={e => set('phone', e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Stage & Source */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Étape</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {STAGES.map(s => (
                    <SelectItem key={s.value} value={s.value} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', s.dot)} />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Source</Label>
              <Select value={form.source} onValueChange={v => set('source', v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SOURCES.map(s => (
                    <SelectItem key={s.value} value={s.value} className="rounded-lg">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Score & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Score (0–100) : <span className="text-primary">{form.score}</span>
              </Label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.score}
                onChange={e => set('score', e.target.value)}
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valeur estimée (€)</Label>
              <Input type="number" placeholder="5000" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Assigned to */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigné à</Label>
            <Input placeholder="Nom du commercial" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} className="rounded-xl" />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</Label>
            <Textarea
              placeholder="Informations sur ce prospect…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="rounded-xl resize-none text-sm"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="px-7 pb-7 pt-4 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl min-w-[140px]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEdit ? 'Enregistrer' : 'Créer le prospect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Kanban Card ──────────────────────────────────────────────────────────────
const KanbanCard = ({
  lead,
  onEdit,
  onDelete,
  onStageChange,
}: {
  lead: Lead;
  onEdit: (l: Lead) => void;
  onDelete: (id: string) => void;
  onStageChange: (id: string, status: LeadStatus) => void;
}) => (
  <div className="group bg-background border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
    {/* Header row */}
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-bold text-sm text-foreground truncate leading-tight">{getLeadName(lead)}</p>
        {lead.company_name && (lead.first_name || lead.last_name) && (
          <p className="text-[11px] text-muted-foreground">{lead.company_name}</p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => onEdit(lead)}>
            <Edit className="w-4 h-4 text-muted-foreground" /> Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Déplacer vers</p>
          {STAGES.filter(s => s.value !== lead.status).map(s => (
            <DropdownMenuItem
              key={s.value}
              className="rounded-lg gap-2 cursor-pointer text-sm"
              onClick={() => onStageChange(lead.id, s.value)}
            >
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', s.dot)} />
              {s.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => onDelete(lead.id)}
          >
            <Trash2 className="w-4 h-4" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    {/* Score */}
    <ScoreBar score={lead.score} />

    {/* Meta row */}
    <div className="flex items-center justify-between">
      {lead.estimated_value ? (
        <span className="text-[11px] font-black text-foreground flex items-center gap-1">
          <Euro className="w-3 h-3 text-amber-500" />
          {formatCurrency(lead.estimated_value)}
        </span>
      ) : <span />}
      {lead.source && (
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {SOURCES.find(s => s.value === lead.source)?.label || lead.source}
        </span>
      )}
    </div>

    {/* Contact links */}
    {(lead.email || lead.phone) && (
      <div className="flex gap-1.5 pt-1 border-t border-border">
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <Mail className="w-3 h-3" /> Email
          </a>
        )}
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <PhoneCall className="w-3 h-3" /> Appeler
          </a>
        )}
      </div>
    )}
  </div>
);

// ─── Kanban Column ────────────────────────────────────────────────────────────
const KanbanColumn = ({
  stage,
  leads,
  onEdit,
  onDelete,
  onStageChange,
}: {
  stage: typeof STAGES[0];
  leads: Lead[];
  onEdit: (l: Lead) => void;
  onDelete: (id: string) => void;
  onStageChange: (id: string, status: LeadStatus) => void;
}) => {
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] flex-1">
      {/* Column header */}
      <div className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 border', stage.bg, stage.border)}>
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', stage.dot)} />
          <span className={cn('text-xs font-black uppercase tracking-wide', stage.color)}>{stage.label}</span>
          <span className={cn(
            'text-[10px] font-black px-1.5 py-0.5 rounded-full',
            stage.bg, stage.color
          )}>
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className={cn('text-[10px] font-black', stage.color)}>
            {formatCurrency(totalValue)}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5 min-h-[120px]">
        {leads.length === 0 ? (
          <div className="flex-1 border-2 border-dashed border-border rounded-xl flex items-center justify-center py-8 text-[11px] font-bold text-muted-foreground/50">
            Aucun prospect
          </div>
        ) : (
          leads.map(lead => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onDelete={onDelete}
              onStageChange={onStageChange}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const LeadsPage = () => {
  const { user } = useAuth();
  const { company } = useCompany();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStatus | 'all'>('all');
  const [view, setView] = useState<ViewMode>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ─── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const res = await blink.db.leads.list({
        where: { organizationId: company.id },
        orderBy: { createdAt: 'desc' },
        limit: 300,
      });
      setLeads(res as Lead[]);
    } catch {
      toast.error('Erreur lors du chargement des prospects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user, company]);

  // ─── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (form: typeof emptyLeadForm) => {
    try {
      await blink.db.leads.create({
        id: generateId(),
        userId: user!.id,
        organizationId: company!.id,
        firstName: form.first_name || null,
        lastName: form.last_name || null,
        companyName: form.company_name || null,
        email: form.email || null,
        phone: form.phone || null,
        status: form.status,
        score: parseInt(form.score),
        estimatedValue: form.estimated_value ? parseFloat(form.estimated_value) : null,
        source: form.source || null,
        notes: form.notes || null,
        assignedTo: form.assigned_to || null,
      });
      toast.success('Prospect créé avec succès');
      setDialogOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  // ─── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = async (form: typeof emptyLeadForm) => {
    if (!editLead) return;
    try {
      await blink.db.leads.update(editLead.id, {
        firstName: form.first_name || null,
        lastName: form.last_name || null,
        companyName: form.company_name || null,
        email: form.email || null,
        phone: form.phone || null,
        status: form.status,
        score: parseInt(form.score),
        estimatedValue: form.estimated_value ? parseFloat(form.estimated_value) : null,
        source: form.source || null,
        notes: form.notes || null,
        assignedTo: form.assigned_to || null,
      });
      toast.success('Prospect mis à jour');
      setEditLead(null);
      load();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // ─── Stage change ──────────────────────────────────────────────────────────
  const handleStageChange = async (id: string, status: LeadStatus) => {
    try {
      await blink.db.leads.update(id, { status });
      const stageName = STAGE_MAP[status]?.label || status;
      toast.success(`Prospect déplacé vers « ${stageName} »`);
      load();
    } catch {
      toast.error('Erreur lors du changement d\'étape');
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await blink.db.leads.delete({ id: deleteId });
      toast.success('Prospect supprimé');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ─── Filters ───────────────────────────────────────────────────────────────
  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const nameMatch = getLeadName(l).toLowerCase().includes(q);
    const emailMatch = (l.email || '').toLowerCase().includes(q);
    const stageMatch = stageFilter === 'all' || l.status === stageFilter;
    return (nameMatch || emailMatch) && stageMatch;
  });

  // ─── Pipeline stats ────────────────────────────────────────────────────────
  const totalPipelineValue = leads.filter(l => !['won', 'lost'].includes(l.status))
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const wonLeads = leads.filter(l => l.status === 'won');
  const wonValue = wonLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0;

  // ─── Edit initial ──────────────────────────────────────────────────────────
  const editInitial = editLead ? {
    first_name: editLead.first_name || '',
    last_name: editLead.last_name || '',
    company_name: editLead.company_name || '',
    email: editLead.email || '',
    phone: editLead.phone || '',
    status: editLead.status,
    score: String(editLead.score),
    estimated_value: editLead.estimated_value != null ? String(editLead.estimated_value) : '',
    source: editLead.source || 'website',
    notes: editLead.notes || '',
    assigned_to: editLead.assigned_to || '',
  } : undefined;

  return (
    <div className="animate-in-up space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pipeline Prospects</h1>
          <p className="page-subtitle">Suivez et convertissez vos opportunités commerciales</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-muted/60 rounded-xl p-1 gap-0.5">
            {([
              { mode: 'kanban' as ViewMode, icon: LayoutGrid, label: 'Kanban' },
              { mode: 'list' as ViewMode, icon: List, label: 'Liste' },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200',
                  view === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <Button
            size="sm"
            className="rounded-xl gap-2 shadow-lg shadow-primary/20"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Nouveau prospect
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total prospects',
            value: leads.length,
            sub: 'dans le pipeline',
            icon: Target,
            color: 'bg-primary/10 text-primary',
          },
          {
            label: 'Pipeline actif',
            value: formatCurrency(totalPipelineValue),
            sub: 'valeur estimée',
            icon: TrendingUp,
            color: 'bg-amber-500/10 text-amber-600',
          },
          {
            label: 'CA gagné',
            value: formatCurrency(wonValue),
            sub: `${wonLeads.length} prospect${wonLeads.length !== 1 ? 's' : ''} convertis`,
            icon: Zap,
            color: 'bg-emerald-500/10 text-emerald-600',
          },
          {
            label: 'Taux de conversion',
            value: `${conversionRate}%`,
            sub: `Score moyen : ${avgScore}/100`,
            icon: Star,
            color: 'bg-purple-500/10 text-purple-600',
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="metric-card flex items-start gap-4">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
              <p className="text-xl font-black tracking-tight text-foreground leading-none">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="card-elevated p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un prospect, une société…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-border"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stage filter pills — only in list view */}
          {view === 'list' && (
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto">
              <button
                onClick={() => setStageFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap',
                  stageFilter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Tous
              </button>
              {STAGES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStageFilter(stageFilter === s.value ? 'all' : s.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap',
                    stageFilter === s.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Chargement…</p>
          </div>
        </div>
      ) : leads.length === 0 ? (
        <div className="card-elevated empty-state py-28">
          <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-5">
            <Target className="w-8 h-8 text-primary/40" />
          </div>
          <h3 className="text-base font-black text-foreground mb-2">Aucun prospect pour le moment</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Commencez à remplir votre pipeline commercial en ajoutant votre premier prospect.
          </p>
          <Button className="mt-6 rounded-xl gap-2 shadow-lg shadow-primary/20" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Ajouter un prospect
          </Button>
        </div>
      ) : view === 'kanban' ? (
        // ── KANBAN VIEW ───────────────────────────────────────────────────────
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage.value}
                stage={stage}
                leads={filtered.filter(l => l.status === stage.value)}
                onEdit={setEditLead}
                onDelete={setDeleteId}
                onStageChange={handleStageChange}
              />
            ))}
          </div>
        </div>
      ) : (
        // ── LIST VIEW ─────────────────────────────────────────────────────────
        <div className="card-elevated overflow-hidden">
          {filtered.length === 0 ? (
            <div className="empty-state py-20">
              <div className="empty-state-icon">
                <Target className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-black text-foreground mb-1">Aucun résultat</h3>
              <p className="text-xs text-muted-foreground">Modifiez vos filtres pour affiner la recherche.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-muted/30">
                    <th>Prospect</th>
                    <th className="hidden md:table-cell">Société</th>
                    <th>Étape</th>
                    <th className="hidden lg:table-cell">Score</th>
                    <th className="hidden md:table-cell">Valeur estimée</th>
                    <th className="hidden lg:table-cell">Source</th>
                    <th className="hidden sm:table-cell">Assigné à</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr key={lead.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-black text-sm">
                            {getLeadName(lead).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate max-w-[140px]">{getLeadName(lead)}</p>
                            {lead.email && (
                              <p className="text-[11px] text-muted-foreground truncate">{lead.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{lead.company_name || '—'}</span>
                      </td>
                      <td>
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="hidden lg:table-cell w-32">
                        <ScoreBar score={lead.score} />
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-sm font-bold text-foreground">
                          {formatCurrency(lead.estimated_value)}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          {SOURCES.find(s => s.value === lead.source)?.label || '—'}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{lead.assigned_to || '—'}</span>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => setEditLead(lead)}>
                              <Edit className="w-4 h-4 text-muted-foreground" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Déplacer vers</p>
                            {STAGES.filter(s => s.value !== lead.status).map(s => (
                              <DropdownMenuItem
                                key={s.value}
                                className="rounded-lg gap-2 cursor-pointer text-sm"
                                onClick={() => handleStageChange(lead.id, s.value)}
                              >
                                <span className={cn('w-2 h-2 rounded-full', s.dot)} />
                                {s.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => setDeleteId(lead.id)}
                            >
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/20">
                <p className="text-xs text-muted-foreground font-bold">
                  {filtered.length} prospect{filtered.length !== 1 ? 's' : ''}
                  {stageFilter !== 'all' && ` · ${STAGE_MAP[stageFilter]?.label}`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <LeadDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleCreate} />

      {/* Edit Dialog */}
      <LeadDialog open={!!editLead} onClose={() => setEditLead(null)} onSave={handleUpdate} initial={editInitial} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">Supprimer ce prospect ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le prospect sera définitivement supprimé du pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
