import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Search, Plus, MoreHorizontal, Users, TrendingUp, Phone, Mail,
  MapPin, Building2, Filter, Star, Edit, Trash2, Eye, UserPlus,
  Download, Loader2, User, Euro, Target, X, ChevronRight
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  userId?: string;
  companyId?: string;
  type?: 'individual' | 'company';
  name?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  status: string;
  totalSpent?: number;
  totalRevenue?: number;
  notes?: string;
  createdAt: string;
}

interface Lead {
  id: string;
  userId?: string;
  companyId?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  source?: string;
  status: string;
  stage: string;
  score?: number;
  estimatedValue?: number;
  notes?: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'prospect' | 'vip';
type LeadStageFilter = 'all' | 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getClientDisplayName = (client: Client): string => {
  if (client.name) return client.name;
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(' ') || '—';
};

const getClientType = (client: Client): 'company' | 'individual' => {
  if (client.type) return client.type;
  return client.companyName ? 'company' : 'individual';
};

const formatCurrency = (amount?: number) =>
  amount != null && amount > 0
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
    : '—';

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function ClientStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    active:   { label: 'Actif',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' },
    inactive: { label: 'Inactif',   className: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
    prospect: { label: 'Prospect',  className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800' },
    vip:      { label: 'VIP',       className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800' },
  };
  const { label, className } = cfg[status] ?? cfg.inactive;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
      className
    )}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      {status === 'vip' && <Star className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

function LeadStageBadge({ stage }: { stage: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string; text: string }> = {
    lead:        { label: 'Prospect',    color: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950',    text: 'text-blue-700 dark:text-blue-400' },
    qualified:   { label: 'Qualifié',    color: 'bg-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-400' },
    proposal:    { label: 'Proposition', color: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950',  text: 'text-amber-700 dark:text-amber-400' },
    negotiation: { label: 'Négociation', color: 'bg-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-400' },
    new:         { label: 'Nouveau',     color: 'bg-sky-500',     bg: 'bg-sky-50 dark:bg-sky-950',      text: 'text-sky-700 dark:text-sky-400' },
    contacted:   { label: 'Contacté',    color: 'bg-cyan-500',    bg: 'bg-cyan-50 dark:bg-cyan-950',    text: 'text-cyan-700 dark:text-cyan-400' },
    won:         { label: 'Gagné',       color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-400' },
    lost:        { label: 'Perdu',       color: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-950',      text: 'text-red-700 dark:text-red-400' },
  };
  const c = cfg[stage] ?? cfg.lead;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider', c.bg, c.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.color)} />
      {c.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string;
}) => (
  <div className="metric-card flex items-start gap-4">
    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className="text-2xl font-black tracking-tight text-foreground leading-none">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  </div>
);

// ─── Client Form ─────────────────────────────────────────────────────────────
const emptyClientForm = {
  type: 'individual' as 'individual' | 'company',
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  city: '',
  status: 'active',
  totalRevenue: '',
  notes: '',
};

function ClientDialog({
  open, onClose, onSave, initial, title
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: typeof emptyClientForm) => Promise<void>;
  initial?: Partial<typeof emptyClientForm>;
  title?: string;
}) {
  const [form, setForm] = useState({ ...emptyClientForm, ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...emptyClientForm, ...initial });
  }, [open, initial]);

  const set = (k: keyof typeof emptyClientForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (form.type === 'individual' && !form.lastName.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    if (form.type === 'company' && !form.companyName.trim()) {
      toast.error('La raison sociale est requise');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initial;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-7 pt-7 pb-0">
          <DialogTitle className="text-lg font-black tracking-tight">
            {title ?? (isEdit ? 'Modifier le client' : 'Nouveau client')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Mettez à jour les informations du client.' : 'Renseignez les informations pour créer un nouveau client.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Type */}
          <div>
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 block">
              Type de client
            </Label>
            <RadioGroup value={form.type} onValueChange={v => set('type', v)} className="flex gap-3">
              {[
                { value: 'individual', label: 'Particulier', icon: User },
                { value: 'company',    label: 'Entreprise',  icon: Building2 },
              ].map(({ value, label, icon: Icon }) => (
                <label
                  key={value}
                  className={cn(
                    'flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-150',
                    form.type === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/80 hover:bg-muted/40'
                  )}
                >
                  <RadioGroupItem value={value} className="sr-only" />
                  <Icon className={cn('w-4 h-4', form.type === value ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-bold', form.type === value ? 'text-primary' : 'text-foreground')}>
                    {label}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Name fields */}
          {form.type === 'individual' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prénom</Label>
                <Input placeholder="Jean" value={form.firstName} onChange={e => set('firstName', e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="Dupont" value={form.lastName} onChange={e => set('lastName', e.target.value)} className="rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Raison sociale <span className="text-destructive">*</span>
              </Label>
              <Input placeholder="Dupont Conseil SARL" value={form.companyName} onChange={e => set('companyName', e.target.value)} className="rounded-xl" />
            </div>
          )}

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input type="email" placeholder="contact@exemple.fr" value={form.email} onChange={e => set('email', e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Téléphone</Label>
              <Input placeholder="+33 6 12 34 56 78" value={form.phone} onChange={e => set('phone', e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Adresse</Label>
            <Input placeholder="12 rue de la Paix" value={form.address} onChange={e => set('address', e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Code postal</Label>
              <Input placeholder="75001" value={form.postalCode} onChange={e => set('postalCode', e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ville</Label>
              <Input placeholder="Paris" value={form.city} onChange={e => set('city', e.target.value)} className="rounded-xl" />
            </div>
          </div>

          {/* Revenue & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">CA (€)</Label>
              <Input type="number" placeholder="0" value={form.totalRevenue} onChange={e => set('totalRevenue', e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Statut</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notes internes</Label>
            <Textarea placeholder="Informations complémentaires..." value={form.notes} onChange={e => set('notes', e.target.value)} className="rounded-xl resize-none text-sm" rows={3} />
          </div>
        </div>

        <DialogFooter className="px-7 pb-7 pt-4 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl min-w-[120px]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEdit ? 'Enregistrer' : 'Créer le client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lead Form ────────────────────────────────────────────────────────────────
const emptyLeadForm = {
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  phone: '',
  source: 'website',
  stage: 'lead',
  estimatedValue: '',
  notes: '',
};

function LeadDialog({
  open, onClose, onSave, initial
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: typeof emptyLeadForm) => Promise<void>;
  initial?: Partial<typeof emptyLeadForm>;
}) {
  const [form, setForm] = useState({ ...emptyLeadForm, ...initial });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...emptyLeadForm, ...initial });
  }, [open, initial]);

  const set = (k: keyof typeof emptyLeadForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!initial;

  const sourceLabels: Record<string, string> = {
    website: 'Site web', referral: 'Référence', linkedin: 'LinkedIn',
    email: 'Email', phone: 'Téléphone', event: 'Événement', other: 'Autre',
  };
  const stageLabels: Record<string, string> = {
    lead: 'Prospect', qualified: 'Qualifié', proposal: 'Proposition', negotiation: 'Négociation',
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-7 pt-7 pb-0">
          <DialogTitle className="text-lg font-black tracking-tight">
            {isEdit ? 'Modifier le prospect' : 'Nouveau prospect'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Mettez à jour les informations du prospect.' : 'Ajoutez un nouveau prospect à votre pipeline commercial.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Prénom</Label>
              <Input placeholder="Jean" value={form.firstName} onChange={e => set('firstName', e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nom</Label>
              <Input placeholder="Dupont" value={form.lastName} onChange={e => set('lastName', e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Entreprise</Label>
            <Input placeholder="Société XYZ" value={form.companyName} onChange={e => set('companyName', e.target.value)} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input type="email" placeholder="jean@exemple.fr" value={form.email} onChange={e => set('email', e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Téléphone</Label>
              <Input placeholder="+33 6 …" value={form.phone} onChange={e => set('phone', e.target.value)} className="rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Source</Label>
              <Select value={form.source} onValueChange={v => set('source', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(sourceLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Étape</Label>
              <Select value={form.stage} onValueChange={v => set('stage', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(stageLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Valeur estimée (€)</Label>
            <Input type="number" placeholder="0" value={form.estimatedValue} onChange={e => set('estimatedValue', e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notes</Label>
            <Textarea placeholder="Informations sur ce prospect..." value={form.notes} onChange={e => set('notes', e.target.value)} className="rounded-xl resize-none text-sm" rows={3} />
          </div>
        </div>

        <DialogFooter className="px-7 pb-7 pt-4 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl min-w-[140px]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEdit ? 'Enregistrer' : 'Ajouter le prospect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main CRM Page ────────────────────────────────────────────────────────────
export const CRMPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company } = useCompany();

  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Client state
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<StatusFilter>('all');
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  // Lead state
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState<LeadStageFilter>('all');
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);

  // Active tab from URL
  const activeTab = location.pathname.includes('/leads') ? 'leads'
    : location.pathname.includes('/contacts') ? 'contacts'
    : 'clients';

  // ─── Data Loading ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const [clientRes, leadRes] = await Promise.all([
        blink.db.clients.list({
          where: { companyId: company.id },
          orderBy: { createdAt: 'desc' },
          limit: 500,
        }),
        blink.db.leads.list({
          where: { organizationId: company.id },
          orderBy: { createdAt: 'desc' },
          limit: 500,
        }),
      ]);
      setClients(clientRes as Client[]);
      setLeads(leadRes as Lead[]);
    } catch {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [user, company]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Client CRUD ──────────────────────────────────────────────────────────
  const handleCreateClient = async (form: typeof emptyClientForm) => {
    try {
      const name = form.type === 'company'
        ? form.companyName
        : [form.firstName, form.lastName].filter(Boolean).join(' ');
      await blink.db.clients.create({
        id: `cli_${generateId()}`,
        userId: user!.id,
        companyId: company!.id,
        type: form.type,
        name,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        companyName: form.companyName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        postalCode: form.postalCode || undefined,
        city: form.city || undefined,
        status: form.status,
        totalSpent: form.totalRevenue ? parseFloat(form.totalRevenue) : 0,
        totalRevenue: form.totalRevenue ? parseFloat(form.totalRevenue) : 0,
        notes: form.notes || undefined,
        createdAt: new Date().toISOString(),
      });
      toast.success('Client créé avec succès');
      setClientDialogOpen(false);
      fetchData();
    } catch {
      toast.error('Erreur lors de la création du client');
    }
  };

  const handleUpdateClient = async (form: typeof emptyClientForm) => {
    if (!editClient) return;
    try {
      const name = form.type === 'company'
        ? form.companyName
        : [form.firstName, form.lastName].filter(Boolean).join(' ');
      await blink.db.clients.update(editClient.id, {
        type: form.type,
        name,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        companyName: form.companyName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        postalCode: form.postalCode || undefined,
        city: form.city || undefined,
        status: form.status,
        totalSpent: form.totalRevenue ? parseFloat(form.totalRevenue) : 0,
        totalRevenue: form.totalRevenue ? parseFloat(form.totalRevenue) : 0,
        notes: form.notes || undefined,
      });
      toast.success('Client mis à jour');
      setEditClient(null);
      fetchData();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;
    try {
      await blink.db.clients.delete(deleteClientId);
      toast.success('Client supprimé');
      setDeleteClientId(null);
      fetchData();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ─── Lead CRUD ────────────────────────────────────────────────────────────
  const handleCreateLead = async (form: typeof emptyLeadForm) => {
    try {
      await blink.db.leads.create({
        id: `lead_${generateId()}`,
        userId: user!.id,
        companyId: company!.id,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        companyName: form.companyName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        source: form.source,
        stage: form.stage,
        status: 'new',
        score: 0,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : 0,
        notes: form.notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success('Prospect ajouté avec succès');
      setLeadDialogOpen(false);
      fetchData();
    } catch {
      toast.error('Erreur lors de l\'ajout du prospect');
    }
  };

  const handleUpdateLead = async (form: typeof emptyLeadForm) => {
    if (!editLead) return;
    try {
      await blink.db.leads.update(editLead.id, {
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        companyName: form.companyName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        source: form.source,
        stage: form.stage,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : 0,
        notes: form.notes || undefined,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Prospect mis à jour');
      setEditLead(null);
      fetchData();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteLeadId) return;
    try {
      await blink.db.leads.delete(deleteLeadId);
      toast.success('Prospect supprimé');
      setDeleteLeadId(null);
      fetchData();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ─── Filters ──────────────────────────────────────────────────────────────
  const filteredClients = clients.filter(c => {
    const q = clientSearch.toLowerCase();
    const nameMatch = getClientDisplayName(c).toLowerCase().includes(q);
    const emailMatch = (c.email || '').toLowerCase().includes(q);
    const statusMatch = clientStatusFilter === 'all' || c.status === clientStatusFilter;
    return (nameMatch || emailMatch) && statusMatch;
  });

  const filteredLeads = leads.filter(l => {
    const name = [l.firstName, l.lastName, l.companyName].filter(Boolean).join(' ').toLowerCase();
    const q = leadSearch.toLowerCase();
    const nameMatch = name.includes(q) || (l.email || '').toLowerCase().includes(q);
    const stageMatch = leadStageFilter === 'all' || l.stage === leadStageFilter;
    return nameMatch && stageMatch;
  });

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const activeClientsCount = clients.filter(c => c.status === 'active').length;
  const totalClientRevenue = clients.reduce((s, c) => s + (c.totalSpent || c.totalRevenue || 0), 0);
  const openLeads = leads.filter(l => !['won', 'lost'].includes(l.stage));
  const pipelineValue = openLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0);

  // ─── Edit initial values ──────────────────────────────────────────────────
  const clientEditInitial = editClient ? {
    type: (editClient.type ?? getClientType(editClient)) as 'individual' | 'company',
    firstName: editClient.firstName || '',
    lastName: editClient.lastName || '',
    companyName: editClient.companyName || '',
    email: editClient.email || '',
    phone: editClient.phone || '',
    address: editClient.address || '',
    postalCode: editClient.postalCode || '',
    city: editClient.city || '',
    status: editClient.status,
    totalRevenue: String(editClient.totalSpent || editClient.totalRevenue || ''),
    notes: editClient.notes || '',
  } : undefined;

  const leadEditInitial = editLead ? {
    firstName: editLead.firstName || '',
    lastName: editLead.lastName || '',
    companyName: editLead.companyName || '',
    email: editLead.email || '',
    phone: editLead.phone || '',
    source: editLead.source || 'website',
    stage: editLead.stage || 'lead',
    estimatedValue: String(editLead.estimatedValue || ''),
    notes: editLead.notes || '',
  } : undefined;

  // ─── Source label helper ──────────────────────────────────────────────────
  const sourceLabel = (src?: string) => ({
    website: 'Site web', referral: 'Référence', linkedin: 'LinkedIn',
    email: 'Email', phone: 'Téléphone', event: 'Événement', other: 'Autre',
  }[src ?? 'other'] ?? src ?? '—');

  return (
    <div className="animate-in-up space-y-6 pb-16">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">CRM & Relations clients</h1>
          <p className="page-subtitle">Gérez vos clients, prospects et relations commerciales</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 hidden sm:flex">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Clients actifs"
          value={loading ? '—' : activeClientsCount}
          sub={loading ? undefined : `${clients.length} au total`}
          icon={Users}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="CA total clients"
          value={loading ? '—' : (totalClientRevenue > 0 ? formatCurrency(totalClientRevenue) : '—')}
          sub="chiffre d'affaires cumulé"
          icon={Euro}
          color="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          label="Prospects actifs"
          value={loading ? '—' : openLeads.length}
          sub={loading ? undefined : `${leads.length} prospects total`}
          icon={Target}
          color="bg-orange-500/10 text-orange-600"
        />
        <StatCard
          label="Pipeline commercial"
          value={loading ? '—' : (pipelineValue > 0 ? formatCurrency(pipelineValue) : '—')}
          sub="valeur estimée"
          icon={TrendingUp}
          color="bg-purple-500/10 text-purple-600"
        />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          if (val === 'clients') navigate('/dashboard/crm');
          else if (val === 'leads') navigate('/dashboard/leads');
          else if (val === 'contacts') navigate('/dashboard/crm/contacts');
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="h-10 rounded-xl p-1">
            <TabsTrigger value="clients" className="rounded-lg text-xs font-black uppercase tracking-wider px-5">
              Clients
              {clients.length > 0 && (
                <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {clients.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="leads" className="rounded-lg text-xs font-black uppercase tracking-wider px-5">
              Prospects
              {leads.length > 0 && (
                <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600">
                  {leads.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-lg text-xs font-black uppercase tracking-wider px-5">
              Contacts
            </TabsTrigger>
          </TabsList>

          {activeTab === 'clients' && (
            <Button
              size="sm"
              className="rounded-xl gap-2 shadow-lg shadow-primary/20"
              onClick={() => setClientDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Nouveau client
            </Button>
          )}
          {activeTab === 'leads' && (
            <Button
              size="sm"
              className="rounded-xl gap-2 shadow-lg shadow-primary/20"
              onClick={() => setLeadDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Nouveau prospect
            </Button>
          )}
          {activeTab === 'contacts' && (
            <Button size="sm" className="rounded-xl gap-2" disabled>
              <Plus className="w-4 h-4" />
              Nouveau contact
            </Button>
          )}
        </div>

        {/* ── Clients Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="clients" className="space-y-4 mt-4">
          {/* Toolbar */}
          <div className="card-elevated p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email…"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  className="pl-10 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-border"
                />
                {clientSearch && (
                  <button
                    onClick={() => setClientSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl p-1">
                {([
                  { value: 'all', label: 'Tous' },
                  { value: 'active', label: 'Actifs' },
                  { value: 'vip', label: 'VIP' },
                  { value: 'inactive', label: 'Inactifs' },
                ] as { value: StatusFilter; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setClientStatusFilter(value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-200',
                      clientStatusFilter === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card-elevated overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Chargement…</p>
                </div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="empty-state py-24">
                <div className="empty-state-icon bg-primary/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-5">
                  <Users className="w-8 h-8 text-primary/40" />
                </div>
                <h3 className="text-base font-black text-foreground mb-2">
                  {clientSearch || clientStatusFilter !== 'all' ? 'Aucun résultat' : 'Aucun client'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {clientSearch || clientStatusFilter !== 'all'
                    ? 'Modifiez vos filtres pour affiner la recherche.'
                    : 'Commencez par ajouter votre premier client.'}
                </p>
                {!clientSearch && clientStatusFilter === 'all' && (
                  <Button className="mt-6 rounded-xl gap-2" onClick={() => setClientDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Ajouter un client
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr className="bg-muted/30">
                        <th>Client</th>
                        <th className="hidden md:table-cell">Email</th>
                        <th className="hidden lg:table-cell">Téléphone</th>
                        <th className="hidden lg:table-cell">Ville</th>
                        <th>Statut</th>
                        <th className="hidden md:table-cell">CA</th>
                        <th className="hidden sm:table-cell">Ajouté le</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((client) => (
                        <tr key={client.id} className="group">
                          <td>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 flex-shrink-0">
                                <AvatarFallback className={cn(
                                  'text-xs font-black',
                                  getClientType(client) === 'company'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-emerald-500/10 text-emerald-600'
                                )}>
                                  {getClientType(client) === 'company'
                                    ? <Building2 className="w-4 h-4" />
                                    : getClientDisplayName(client).slice(0, 2).toUpperCase()
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-foreground truncate max-w-[160px]">
                                  {getClientDisplayName(client)}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {getClientType(client) === 'company' ? 'Entreprise' : 'Particulier'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell">
                            {client.email
                              ? <a href={`mailto:${client.email}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">{client.email}</a>
                              : <span className="text-muted-foreground/40">—</span>
                            }
                          </td>
                          <td className="hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground">{client.phone || '—'}</span>
                          </td>
                          <td className="hidden lg:table-cell">
                            {client.city
                              ? (
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  {client.city}
                                </span>
                              )
                              : <span className="text-muted-foreground/40">—</span>
                            }
                          </td>
                          <td>
                            <ClientStatusBadge status={client.status} />
                          </td>
                          <td className="hidden md:table-cell">
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(client.totalSpent ?? client.totalRevenue)}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(client.createdAt)}
                            </span>
                          </td>
                          <td>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-xl">
                                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => setEditClient(client)}>
                                  <Edit className="w-4 h-4 text-muted-foreground" />
                                  Modifier
                                </DropdownMenuItem>
                                {client.email && (
                                  <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => window.open(`mailto:${client.email}`)}>
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    Envoyer un email
                                  </DropdownMenuItem>
                                )}
                                {client.phone && (
                                  <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => window.open(`tel:${client.phone}`)}>
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    Appeler
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                  onClick={() => setDeleteClientId(client.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/20">
                  <p className="text-xs text-muted-foreground font-bold">
                    {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
                    {(clientSearch || clientStatusFilter !== 'all') && ` sur ${clients.length} au total`}
                  </p>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Leads Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="leads" className="space-y-4 mt-4">
          {/* Toolbar */}
          <div className="card-elevated p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un prospect…"
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  className="pl-10 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-border"
                />
                {leadSearch && (
                  <button
                    onClick={() => setLeadSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl p-1 overflow-x-auto">
                {([
                  { value: 'all', label: 'Tous' },
                  { value: 'lead', label: 'Prospect' },
                  { value: 'qualified', label: 'Qualifié' },
                  { value: 'proposal', label: 'Proposition' },
                  { value: 'negotiation', label: 'Négociation' },
                  { value: 'won', label: 'Gagné' },
                ] as { value: LeadStageFilter; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setLeadStageFilter(value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all duration-200',
                      leadStageFilter === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card-elevated overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="empty-state py-24">
                <div className="empty-state-icon bg-orange-500/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-5">
                  <Target className="w-8 h-8 text-orange-500/40" />
                </div>
                <h3 className="text-base font-black text-foreground mb-2">
                  {leadSearch || leadStageFilter !== 'all' ? 'Aucun résultat' : 'Aucun prospect'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {leadSearch || leadStageFilter !== 'all'
                    ? 'Modifiez vos filtres pour affiner la recherche.'
                    : 'Ajoutez des prospects à votre pipeline commercial.'}
                </p>
                {!leadSearch && leadStageFilter === 'all' && (
                  <Button className="mt-6 rounded-xl gap-2" onClick={() => setLeadDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Ajouter un prospect
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr className="bg-muted/30">
                        <th>Prospect</th>
                        <th className="hidden md:table-cell">Contact</th>
                        <th className="hidden lg:table-cell">Source</th>
                        <th>Étape</th>
                        <th className="hidden sm:table-cell">Valeur estimée</th>
                        <th className="hidden md:table-cell">Date</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => {
                        const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.companyName || '—';
                        return (
                          <tr key={lead.id} className="group">
                            <td>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-9 h-9 flex-shrink-0">
                                  <AvatarFallback className="text-xs font-black bg-orange-500/10 text-orange-600">
                                    {name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-bold text-sm text-foreground truncate max-w-[140px]">{name}</p>
                                  {lead.companyName && [lead.firstName, lead.lastName].some(Boolean) && (
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                      <Building2 className="w-3 h-3" />
                                      {lead.companyName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="hidden md:table-cell">
                              <div className="space-y-0.5">
                                {lead.email && (
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <a href={`mailto:${lead.email}`} className="hover:text-primary transition-colors truncate max-w-[160px]">{lead.email}</a>
                                  </div>
                                )}
                                {lead.phone && (
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                    {lead.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="hidden lg:table-cell">
                              <span className="text-sm text-muted-foreground">{sourceLabel(lead.source)}</span>
                            </td>
                            <td>
                              <LeadStageBadge stage={lead.stage} />
                            </td>
                            <td className="hidden sm:table-cell">
                              <span className="text-sm font-bold text-foreground">
                                {formatCurrency(lead.estimatedValue)}
                              </span>
                            </td>
                            <td className="hidden md:table-cell">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(lead.createdAt)}
                              </span>
                            </td>
                            <td>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                                  <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => setEditLead(lead)}>
                                    <Edit className="w-4 h-4 text-muted-foreground" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => setClientDialogOpen(true)}>
                                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                                    Convertir en client
                                  </DropdownMenuItem>
                                  {lead.email && (
                                    <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => window.open(`mailto:${lead.email}`)}>
                                      <Mail className="w-4 h-4 text-muted-foreground" />
                                      Envoyer un email
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="rounded-lg gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={() => setDeleteLeadId(lead.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer
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
                <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/20">
                  <p className="text-xs text-muted-foreground font-bold">
                    {filteredLeads.length} prospect{filteredLeads.length !== 1 ? 's' : ''}
                    {(leadSearch || leadStageFilter !== 'all') && ` sur ${leads.length} au total`}
                  </p>
                  <span className="text-xs font-bold text-muted-foreground">
                    Pipeline : {formatCurrency(filteredLeads.reduce((s, l) => s + (l.estimatedValue || 0), 0))}
                  </span>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ── Contacts Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="contacts" className="mt-4">
          <div className="card-elevated">
            <div className="empty-state py-24">
              <div className="empty-state-icon bg-primary/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-5">
                <Users className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="text-base font-black text-foreground mb-2">Aucun contact</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Les contacts sont liés à vos clients et prospects. Cette fonctionnalité sera bientôt disponible.
              </p>
              <Button variant="outline" className="mt-6 rounded-xl gap-2" disabled>
                <Plus className="w-4 h-4" />
                Ajouter un contact
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}

      {/* Create Client */}
      <ClientDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        onSave={handleCreateClient}
      />

      {/* Edit Client */}
      <ClientDialog
        open={!!editClient}
        onClose={() => setEditClient(null)}
        onSave={handleUpdateClient}
        initial={clientEditInitial}
      />

      {/* Delete Client */}
      <AlertDialog open={!!deleteClientId} onOpenChange={v => !v && setDeleteClientId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à ce client seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Lead */}
      <LeadDialog
        open={leadDialogOpen}
        onClose={() => setLeadDialogOpen(false)}
        onSave={handleCreateLead}
      />

      {/* Edit Lead */}
      <LeadDialog
        open={!!editLead}
        onClose={() => setEditLead(null)}
        onSave={handleUpdateLead}
        initial={leadEditInitial}
      />

      {/* Delete Lead */}
      <AlertDialog open={!!deleteLeadId} onOpenChange={v => !v && setDeleteLeadId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">Supprimer ce prospect ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le prospect sera définitivement supprimé de votre pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
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
