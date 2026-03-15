import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe, ExternalLink, Eye, Settings, Palette, Layout,
  Store, TrendingUp, Plus, Edit2, Loader2, ToggleLeft, ToggleRight,
  ShoppingBag, Link2,
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const THEMES = [
  { value: 'modern',  label: 'Moderne' },
  { value: 'classic', label: 'Classique' },
  { value: 'minimal', label: 'Minimal' },
];

// ─── StorefrontPage ───────────────────────────────────────────────────────────

export function StorefrontPage() {
  const { user } = useAuth();
  const { company } = useCompany();
  const [store, setStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const emptyCreate = { name: '', slug: '', description: '', theme: 'modern', currency: 'EUR', country: 'France' };
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '', theme: 'modern' });

  // ── Load store ─────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!company || !user) return;
    setLoading(true);
    try {
      const data = await blink.db.stores.list({
        where: { organizationId: company.id },
        limit: 1,
      });
      setStore((data as any[])[0] ?? null);
    } catch { setStore(null); } finally { setLoading(false); }
  }, [company, user]);

  useEffect(() => { load(); }, [load]);

  // ── Create store ───────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) { toast.error('Le nom est requis'); return; }
    if (!createForm.slug.trim()) { toast.error('Le slug est requis'); return; }
    setSaving(true);
    try {
      const created = await blink.db.stores.create({
        id: `store_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        userId: user!.id,
        organizationId: company!.id,
        name: createForm.name,
        slug: createForm.slug,
        description: createForm.description,
        theme: createForm.theme,
        currency: createForm.currency,
        country: createForm.country,
        status: 'active',
      });
      toast.success('Boutique créée avec succès !');
      setCreateOpen(false);
      setCreateForm(emptyCreate);
      setStore(created as any);
    } catch { toast.error('Erreur lors de la création'); } finally { setSaving(false); }
  };

  // ── Edit store ─────────────────────────────────────────────────────────────

  const openEdit = () => {
    if (!store) return;
    setEditForm({ name: store.name || '', slug: store.slug || '', description: store.description || '', theme: store.theme || 'modern' });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    try {
      await blink.db.stores.update(store.id, {
        name: editForm.name, slug: editForm.slug,
        description: editForm.description, theme: editForm.theme,
      });
      toast.success('Boutique mise à jour');
      setStore((prev: any) => ({ ...prev, ...editForm }));
      setEditOpen(false);
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  // ── Toggle store status ────────────────────────────────────────────────────

  const toggleStatus = async () => {
    if (!store) return;
    const next = store.status === 'active' ? 'inactive' : 'active';
    setToggling(true);
    try {
      await blink.db.stores.update(store.id, { status: next });
      setStore((prev: any) => ({ ...prev, status: next }));
      toast.success(next === 'active' ? 'Boutique activée' : 'Boutique désactivée');
    } catch { toast.error('Erreur'); } finally { setToggling(false); }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (!company || !user) return null;

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="page-header">
          <div><h1 className="page-title">Vitrine</h1><p className="page-subtitle">Gérez votre boutique en ligne</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // ── No store: Onboarding ───────────────────────────────────────────────────

  if (!store) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">Vitrine</h1>
            <p className="page-subtitle">Créez et gérez votre boutique en ligne</p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="max-w-md w-full text-center shadow-lg">
            <CardHeader className="pb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Créez votre boutique en ligne</CardTitle>
              <CardDescription>
                Lancez votre boutique en quelques minutes et commencez à vendre vos produits en ligne.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Sheet open={createOpen} onOpenChange={setCreateOpen}>
                <SheetTrigger asChild>
                  <Button size="lg" className="gap-2 w-full shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5" />
                    Créer ma boutique
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Créer votre boutique</SheetTitle>
                  </SheetHeader>
                  <form onSubmit={handleCreate} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label>Nom de la boutique *</Label>
                      <Input
                        placeholder="Ma Boutique"
                        value={createForm.name}
                        onChange={e => {
                          const name = e.target.value;
                          setCreateForm(p => ({ ...p, name, slug: p.slug || slugify(name) }));
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Slug (URL) *</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">orbis.fr/</span>
                        <Input
                          placeholder="ma-boutique"
                          value={createForm.slug}
                          onChange={e => setCreateForm(p => ({ ...p, slug: slugify(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea rows={2} placeholder="Décrivez votre boutique..." value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Thème</Label>
                        <Select value={createForm.theme} onValueChange={v => setCreateForm(p => ({ ...p, theme: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {THEMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Devise</Label>
                        <Input value={createForm.currency} disabled className="bg-muted" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pays</Label>
                      <Input value={createForm.country} disabled className="bg-muted" />
                    </div>
                    <Separator />
                    <div className="flex gap-3 justify-end">
                      <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
                      <Button type="submit" disabled={saving} className="gap-2">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Créer ma boutique
                      </Button>
                    </div>
                  </form>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Store exists ───────────────────────────────────────────────────────────

  const storeUrl = `votre-boutique.orbis.fr/${store.slug}`;
  const themeLabel = THEMES.find(t => t.value === store.theme)?.label ?? store.theme;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vitrine</h1>
          <p className="page-subtitle">Gérez l'apparence et le contenu de votre boutique en ligne</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open(`https://${storeUrl}`, '_blank')}>
            <Eye className="w-4 h-4" />Prévisualiser
          </Button>
          <Button size="sm" className="rounded-xl gap-2 shadow-lg shadow-primary/20" onClick={() => window.open(`https://${storeUrl}`, '_blank')}>
            <ExternalLink className="w-4 h-4" />Voir la boutique
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Visites ce mois', value: '0', sub: 'Données disponibles prochainement', icon: Eye, color: 'bg-primary/10 text-primary' },
          { label: 'Conversions', value: '0%', sub: 'Aucune visite enregistrée', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
          { label: 'Panier moyen', value: '—', sub: 'Aucune commande', icon: ShoppingBag, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        ].map((stat, i) => (
          <div key={i} className="metric-card flex items-start gap-4">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{stat.label}</p>
              <p className="text-2xl font-black tracking-tight leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Store info + controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="w-5 h-5 text-primary" />
                  {store.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge className={cn('border-0 text-xs',
                    store.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
                    {store.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{themeLabel}</Badge>
                </div>
              </div>
              <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={openEdit}>
                    <Edit2 className="w-4 h-4" />Modifier
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader><SheetTitle>Paramètres de la boutique</SheetTitle></SheetHeader>
                  <form onSubmit={handleEdit} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label>Nom *</Label>
                      <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Slug</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">orbis.fr/</span>
                        <Input value={editForm.slug} onChange={e => setEditForm(p => ({ ...p, slug: slugify(e.target.value) }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea rows={2} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Thème</Label>
                      <Select value={editForm.theme} onValueChange={v => setEditForm(p => ({ ...p, theme: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {THEMES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div className="flex gap-3 justify-end">
                      <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
                      <Button type="submit" disabled={saving} className="gap-2">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Enregistrer
                      </Button>
                    </div>
                  </form>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {store.description && (
              <p className="text-sm text-muted-foreground">{store.description}</p>
            )}
            <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-muted-foreground truncate">{storeUrl}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto shrink-0"
                onClick={() => { navigator.clipboard.writeText(`https://${storeUrl}`); toast.success('URL copiée'); }}>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="w-5 h-5 text-primary" />Paramètres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable/disable */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-semibold">Boutique en ligne</p>
                <p className="text-xs text-muted-foreground mt-0.5">Rendre la boutique accessible au public</p>
              </div>
              <Switch checked={store.status === 'active'} onCheckedChange={toggleStatus} disabled={toggling} />
            </div>

            {/* SEO */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-semibold">SEO & Référencement</p>
                <p className="text-xs text-muted-foreground mt-0.5">Titre, description, balises meta</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => toast.info('Section SEO disponible prochainement')}>
                Configurer
              </Button>
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div>
                <p className="text-sm font-semibold">Thème actuel</p>
                <p className="text-xs text-muted-foreground mt-0.5">{themeLabel}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={openEdit}>
                <Palette className="w-3.5 h-3.5" />Changer
              </Button>
            </div>

            {/* Custom domain */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  Domaine personnalisé
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold">PRO</Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Utilisez votre propre domaine</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground cursor-not-allowed" disabled>
                Fonctionnalité Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
