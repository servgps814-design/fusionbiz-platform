import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe, Store, Plus, Settings2, ExternalLink, Copy, Check, Loader2, Trash2,
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoreItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  currency?: string;
  createdAt?: string;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const StorefrontPage = () => {
  const { company } = useCompany();
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await blink.db.stores.list({
        where: { organizationId: company.id },
        orderBy: { createdAt: 'desc' },
        limit: 20,
      });
      setStores(data as StoreItem[]);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    if (!company || !user) return;
    setSaving(true);
    try {
      const slug =
        form.slug ||
        form.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      await blink.db.stores.create({
        id: `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        organizationId: company.id,
        name: form.name,
        slug,
        description: form.description || null,
        status: 'active',
        currency: 'EUR',
        country: 'France',
        language: 'fr',
        theme: 'modern',
      });
      toast.success('Boutique créée !');
      setDialogOpen(false);
      setForm({ name: '', slug: '', description: '' });
      load();
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await blink.db.stores.delete(deleteId);
      toast.success('Boutique supprimée');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur de suppression');
    }
  };

  const copyUrl = (store: StoreItem) => {
    const url = `https://shop.orbis.fr/${store.slug}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(store.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('URL copiée !');
  };

  const openStore = (store: StoreItem) => {
    window.open(`https://shop.orbis.fr/${store.slug}`, '_blank', 'noopener');
  };

  return (
    <div className="p-6 lg:p-8 animate-in-up space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vitrine en ligne</h1>
          <p className="page-subtitle">Gérez vos boutiques en ligne</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-xl gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Créer une boutique
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-black tracking-tight mb-2">Aucune boutique</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Créez votre première boutique en ligne
          </p>
          <Button onClick={() => setDialogOpen(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" />
            Créer ma boutique
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stores.map(store => (
            <Card
              key={store.id}
              className="border-border shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border',
                        store.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
                      )}
                    >
                      {store.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(store.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base font-black leading-tight">{store.name}</CardTitle>
                {store.description && (
                  <CardDescription className="text-xs mt-1 line-clamp-2">
                    {store.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* URL bar */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground font-mono truncate flex-1">
                    shop.orbis.fr/{store.slug}
                  </span>
                  <button
                    onClick={() => copyUrl(store)}
                    className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                    title="Copier l'URL"
                  >
                    {copiedId === store.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs gap-1.5 h-8"
                    onClick={() => openStore(store)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs gap-1.5 h-8"
                    disabled
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Configurer
                  </Button>
                </div>

                {/* Currency badge */}
                {store.currency && (
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Devise : {store.currency}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="font-black text-lg">Nouvelle boutique</DialogTitle>
            <DialogDescription>
              Créez une boutique en ligne pour vendre vos produits
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ma Boutique"
                value={form.name}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    name: e.target.value,
                    slug: e.target.value
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, ''),
                  }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Slug URL
              </Label>
              <div className="flex items-center gap-0 border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0">
                <span className="px-3 py-2.5 bg-muted text-xs text-muted-foreground font-mono border-r border-input shrink-0">
                  shop.orbis.fr/
                </span>
                <input
                  placeholder="ma-boutique"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="flex-1 px-3 py-2.5 bg-transparent text-sm font-mono outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Description
              </Label>
              <Input
                placeholder="Description de votre boutique..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-0 gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="rounded-xl min-w-[120px]"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette boutique ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La boutique et ses paramètres seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
