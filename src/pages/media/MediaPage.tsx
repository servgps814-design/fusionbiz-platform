import React, { useState, useEffect, useCallback, useRef, DragEvent } from 'react';
import {
  Image, Upload, Search, Grid, List, FileText, Film,
  Plus, Trash2, MoreHorizontal, FolderOpen, Loader2,
  FolderPlus, ChevronRight, Home, X, Eye,
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaAsset {
  id: string; name: string; fileUrl: string; fileType: string;
  fileSize?: number; mimeType?: string; width?: number; height?: number;
  altText?: string; tags?: string; folderId?: string; usageCount?: number; createdAt: string;
}
interface MediaFolder {
  id: string; name: string; parentId?: string; createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBytes = (bytes?: number) => {
  if (!bytes) return '—';
  if (bytes < 1000) return `${bytes} o`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} Ko`;
  return `${(bytes / 1_000_000).toFixed(1)} Mo`;
};

const getFileType = (mimeType?: string, fileType?: string): string => {
  if (fileType) return fileType;
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('video/')) return 'video';
  return 'document';
};

const genId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── Type Config ──────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  image:    { icon: Image,    color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/30',    label: 'Image' },
  video:    { icon: Film,     color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', label: 'Vidéo' },
  document: { icon: FileText, color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/30',       label: 'Document' },
};

// ─── Asset Card ───────────────────────────────────────────────────────────────

function AssetCard({ asset, onDelete, onPreview }: {
  asset: MediaAsset; onDelete: (id: string) => void; onPreview: (a: MediaAsset) => void;
}) {
  const type = getFileType(asset.mimeType, asset.fileType);
  const cfg = TYPE_CFG[type] || TYPE_CFG.document;
  const Icon = cfg.icon;
  const isImage = type === 'image';

  return (
    <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Preview area */}
      <div
        className="aspect-square cursor-pointer overflow-hidden bg-muted/30 flex items-center justify-center"
        onClick={() => onPreview(asset)}
      >
        {isImage && asset.fileUrl ? (
          <img
            src={asset.fileUrl}
            alt={asset.altText || asset.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', cfg.bg)}>
            <Icon className={cn('w-7 h-7', cfg.color)} />
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Eye className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-bold truncate mb-0.5">{asset.name}</p>
        <div className="flex items-center justify-between">
          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md', cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-muted-foreground">{fmtBytes(asset.fileSize)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="w-7 h-7 rounded-lg shadow-md">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => onPreview(asset)} className="gap-2 cursor-pointer">
              <Eye className="w-4 h-4" />Aperçu
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(asset.id)}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Preview Dialog ───────────────────────────────────────────────────────────

function PreviewDialog({ asset, onClose }: { asset: MediaAsset | null; onClose: () => void }) {
  if (!asset) return null;
  const type = getFileType(asset.mimeType, asset.fileType);
  const cfg = TYPE_CFG[type] || TYPE_CFG.document;
  const Icon = cfg.icon;

  return (
    <Dialog open={!!asset} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-base font-black truncate">{asset.name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cfg.label} · {fmtBytes(asset.fileSize)}
                {asset.width && asset.height && ` · ${asset.width}×${asset.height}`}
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6">
          {type === 'image' ? (
            <div className="rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center max-h-96">
              <img src={asset.fileUrl} alt={asset.name} className="max-w-full max-h-96 object-contain" />
            </div>
          ) : type === 'video' ? (
            <video src={asset.fileUrl} controls className="w-full rounded-xl max-h-80" />
          ) : (
            <div className={cn('flex flex-col items-center justify-center py-12 rounded-xl', cfg.bg)}>
              <Icon className={cn('w-16 h-16 mb-3', cfg.color)} />
              <p className="text-sm font-bold">{asset.name}</p>
              <a href={asset.fileUrl} target="_blank" rel="noreferrer" className="mt-3 text-xs text-primary underline">
                Ouvrir le fichier
              </a>
            </div>
          )}
          {asset.altText && (
            <p className="text-xs text-muted-foreground mt-3"><span className="font-bold">Alt :</span> {asset.altText}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MediaPage() {
  const { user } = useAuth();
  const { company } = useCompany();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [assetsData, foldersData] = await Promise.all([
        blink.db.mediaAssets.list({ where: { organizationId: company.id }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.mediaFolders.list({ where: { organizationId: company.id }, limit: 50 }),
      ]);
      setAssets(assetsData as MediaAsset[]);
      setFolders(foldersData as MediaFolder[]);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (files: FileList | File[]) => {
    if (!company || !user) return;
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    let success = 0;

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      try {
        const ext = file.name.split('.').pop() || '';
        const path = `media/${company.id}/${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${ext}`;
        const { publicUrl } = await blink.storage.upload(file, path, {
          onProgress: (pct) => setUploadProgress(Math.round((i / fileArr.length + pct / 100 / fileArr.length) * 100)),
        });

        const fileType = getFileType(file.type);
        await blink.db.mediaAssets.create({
          id: `media_${genId()}`,
          userId: user.id,
          organizationId: company.id,
          name: file.name,
          fileUrl: publicUrl,
          fileType,
          mimeType: file.type,
          fileSize: file.size,
          folderId: activeFolder || null,
          usageCount: 0,
        });
        success++;
      } catch {
        toast.error(`Erreur upload: ${file.name}`);
      }
    }

    setUploading(false);
    setUploadProgress(0);
    if (success > 0) {
      toast.success(`${success} fichier${success > 1 ? 's' : ''} importé${success > 1 ? 's' : ''}`);
      load();
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const asset = assets.find(a => a.id === deleteId);
      if (asset?.fileUrl) {
        try { await blink.storage.remove(asset.fileUrl); } catch {}
      }
      await blink.db.mediaAssets.delete(deleteId);
      toast.success('Fichier supprimé');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreateFolder = async () => {
    if (!company || !newFolderName.trim()) { toast.error('Nom requis'); return; }
    try {
      await blink.db.mediaFolders.create({
        id: `folder_${genId()}`,
        organizationId: company.id,
        name: newFolderName.trim(),
        parentId: activeFolder || null,
      });
      toast.success('Dossier créé');
      setNewFolderOpen(false);
      setNewFolderName('');
      load();
    } catch {
      toast.error('Erreur création dossier');
    }
  };

  const filtered = assets.filter(a => {
    const matchSearch  = !search || a.name.toLowerCase().includes(search.toLowerCase());
    const matchType    = filterType === 'all' || getFileType(a.mimeType, a.fileType) === filterType;
    const matchFolder  = activeFolder === null ? !a.folderId : a.folderId === activeFolder;
    return matchSearch && matchType && matchFolder;
  });

  const currentFolder = folders.find(f => f.id === activeFolder);

  return (
    <div className="p-6 lg:p-8 animate-in-up space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Médiathèque</h1>
          <p className="page-subtitle">Gérez vos images, vidéos et documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setNewFolderOpen(true)}
            className="rounded-xl gap-2"
          >
            <FolderPlus className="w-4 h-4" />Nouveau dossier
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl gap-2 shadow-lg shadow-primary/20"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? `${uploadProgress}%` : 'Importer'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={e => e.target.files && handleUpload(e.target.files)}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar – Folders */}
        <div className="w-52 shrink-0 space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2">Dossiers</p>
          <button
            onClick={() => setActiveFolder(null)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left',
              activeFolder === null ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Home className="w-4 h-4" />Tous les fichiers
            <span className="ml-auto text-[10px] font-bold">{assets.length}</span>
          </button>
          {folders.filter(f => !f.parentId).map(folder => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left',
                activeFolder === folder.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="truncate">{folder.name}</span>
              <span className="ml-auto text-[10px] font-bold">
                {assets.filter(a => a.folderId === folder.id).length}
              </span>
            </button>
          ))}

          {/* Type filter */}
          <div className="pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 mb-2">Type</p>
            {[
              { key: 'all',      label: 'Tous' },
              { key: 'image',    label: 'Images' },
              { key: 'video',    label: 'Vidéos' },
              { key: 'document', label: 'Documents' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setFilterType(t.key as any)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left',
                  filterType === t.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Breadcrumb + controls */}
          <div className="flex items-center gap-3">
            {currentFolder && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <button onClick={() => setActiveFolder(null)} className="hover:text-foreground transition-colors">
                  <Home className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-bold text-foreground">{currentFolder.name}</span>
              </div>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <div className="flex items-center border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={cn('p-2 transition-colors', view === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn('p-2 transition-colors', view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all',
              dragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-muted/30',
              uploading && 'pointer-events-none opacity-70'
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-bold">Import en cours... {uploadProgress}%</p>
                <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground/50" />
                <p className="text-sm font-bold text-muted-foreground">
                  {dragOver ? 'Déposez vos fichiers ici' : 'Glissez-déposez ou cliquez pour importer'}
                </p>
                <p className="text-xs text-muted-foreground">Images, vidéos, PDF, Word</p>
              </div>
            )}
          </div>

          {/* Assets */}
          {loading ? (
            <div className={cn(view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'space-y-2')}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className={view === 'grid' ? 'aspect-square rounded-xl' : 'h-14 rounded-xl'} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Image className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-muted-foreground mb-1">Aucun fichier</p>
              <p className="text-xs text-muted-foreground">
                {search ? 'Aucun résultat pour votre recherche' : 'Importez vos premiers médias'}
              </p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onDelete={setDeleteId}
                  onPreview={setPreviewAsset}
                />
              ))}
            </div>
          ) : (
            <Card className="border-border shadow-sm overflow-hidden">
              <div className="divide-y divide-border">
                {filtered.map(asset => {
                  const type = getFileType(asset.mimeType, asset.fileType);
                  const cfg = TYPE_CFG[type] || TYPE_CFG.document;
                  const Icon = cfg.icon;
                  return (
                    <div key={asset.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors group">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
                        {type === 'image' && asset.fileUrl ? (
                          <img src={asset.fileUrl} alt={asset.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Icon className={cn('w-5 h-5', cfg.color)} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{fmtBytes(asset.fileSize)}</p>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md hidden sm:block', cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg" onClick={() => setPreviewAsset(asset)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="w-8 h-8 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(asset.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Preview */}
      <PreviewDialog asset={previewAsset} onClose={() => setPreviewAsset(null)} />

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={v => !v && setNewFolderOpen(false)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">Nouveau dossier</DialogTitle>
            <DialogDescription>Nommez votre dossier</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Nom</Label>
            <Input
              placeholder="Nom du dossier"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)} className="rounded-xl">Annuler</Button>
            <Button onClick={handleCreateFolder} className="rounded-xl">Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fichier ?</AlertDialogTitle>
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
}
