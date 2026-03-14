import React, { useState, useEffect, useCallback } from 'react';
import {
  Image, Upload, Search, Grid, List, FileText, Film, Music,
  Plus, Trash2, Download, MoreHorizontal, FolderOpen, Loader2
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const typeIcon: Record<string, React.ElementType> = {
  image: Image,
  document: FileText,
  video: Film,
  audio: Music,
};

const typeColor: Record<string, string> = {
  image: 'text-blue-500 bg-blue-50',
  document: 'text-red-500 bg-red-50',
  video: 'text-violet-500 bg-violet-50',
  audio: 'text-teal-500 bg-teal-50',
};

const fmt = (bytes: number) => {
  if (bytes < 1000) return `${bytes} o`;
  if (bytes < 1000000) return `${(bytes / 1000).toFixed(0)} Ko`;
  return `${(bytes / 1000000).toFixed(1)} Mo`;
};

const getFileType = (mime: string): string => {
  if (mime?.startsWith('image/')) return 'image';
  if (mime?.startsWith('video/')) return 'video';
  if (mime?.startsWith('audio/')) return 'audio';
  return 'document';
};

export function MediaPage() {
  const { user } = useAuth();
  const { company } = useCompany();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await blink.db.mediaAssets.list({
        where: { organizationId: company.id },
        orderBy: { createdAt: 'desc' },
        limit: 100,
      });
      setAssets(data as any[]);
    } catch { setAssets([]); } finally { setLoading(false); }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company || !user) return;
    setUploading(true);
    try {
      const { publicUrl } = await blink.storage.upload(file, {
        path: `media/${company.id}/${Date.now()}_${file.name}`,
      });
      await blink.db.mediaAssets.create({
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        organizationId: company.id,
        name: file.name,
        fileUrl: publicUrl,
        fileType: getFileType(file.type),
        fileSize: file.size,
        mimeType: file.type,
        tags: '[]',
        usageCount: 0,
      });
      toast.success('Fichier téléversé avec succès');
      load();
    } catch {
      toast.error('Erreur lors du téléversement');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await blink.db.mediaAssets.delete(id);
      toast.success(`${name} supprimé`);
      setAssets(p => p.filter(a => a.id !== id));
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const filtered = assets.filter(a => {
    const matchSearch = a.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || a.fileType === filterType;
    return matchSearch && matchType;
  });

  const totalSize = assets.reduce((s, a) => s + Number(a.fileSize || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Médiathèque</h1>
          <p className="page-subtitle">Gérez tous vos fichiers et médias — {fmt(totalSize)} utilisés</p>
        </div>
        <label className={cn('cursor-pointer', uploading && 'pointer-events-none opacity-50')}>
          <input type="file" className="sr-only" onChange={handleUpload} accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
          <Button as="span" className="gap-2" disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Téléverser
          </Button>
        </label>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un fichier..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'image', label: 'Images' },
            { key: 'document', label: 'Documents' },
            { key: 'video', label: 'Vidéos' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                filterType === f.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            className={cn('p-1.5 rounded-md transition-all', view === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
          ><Grid className="w-4 h-4" /></button>
          <button
            onClick={() => setView('list')}
            className={cn('p-1.5 rounded-md transition-all', view === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
          ><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={cn('grid gap-3', view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1')}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen className="w-6 h-6 text-muted-foreground" /></div>
          <p className="font-semibold">Aucun fichier</p>
          <p className="text-sm text-muted-foreground mt-1">Téléversez vos premiers fichiers</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(asset => {
            const fileType = asset.fileType || 'document';
            const Icon = typeIcon[fileType] ?? FileText;
            const colorCls = typeColor[fileType] ?? 'text-slate-500 bg-slate-100';
            return (
              <div key={asset.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
                <div className="aspect-square flex items-center justify-center bg-muted/50">
                  {fileType === 'image' && asset.fileUrl ? (
                    <img src={asset.fileUrl} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colorCls)}>
                      <Icon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold truncate">{asset.name}</p>
                  <p className="text-[10px] text-muted-foreground">{fmt(Number(asset.fileSize || 0))}</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-6 w-6 rounded-md shadow-sm">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {asset.fileUrl && (
                        <DropdownMenuItem asChild>
                          <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                            <Download className="w-4 h-4" />Télécharger
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(asset.id, asset.name)} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="w-4 h-4" />Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Type</th><th>Taille</th><th>Date</th><th className="w-12"></th></tr></thead>
            <tbody>
              {filtered.map(asset => {
                const fileType = asset.fileType || 'document';
                const Icon = typeIcon[fileType] ?? FileText;
                const colorCls = typeColor[fileType] ?? 'text-slate-500 bg-slate-100';
                return (
                  <tr key={asset.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs', colorCls)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">{asset.name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-muted-foreground capitalize">{fileType}</td>
                    <td className="text-sm text-muted-foreground">{fmt(Number(asset.fileSize || 0))}</td>
                    <td className="text-sm text-muted-foreground">
                      {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {asset.fileUrl && (
                            <DropdownMenuItem asChild>
                              <a href={asset.fileUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                                <Download className="w-4 h-4" />Télécharger
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(asset.id, asset.name)} className="gap-2 text-destructive focus:text-destructive">
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
    </div>
  );
}
