import React from 'react';
import { Layers, Plus, Eye, Edit, FileText, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const pages = [
  { title: 'Accueil', slug: '/', type: 'Page', status: 'published', views: '842', lastEdit: 'Il y a 2 jours' },
  { title: 'À propos', slug: '/a-propos', type: 'Page', status: 'published', views: '211', lastEdit: 'Il y a 5 jours' },
  { title: 'Services', slug: '/services', type: 'Page', status: 'published', views: '378', lastEdit: 'Il y a 1 jour' },
  { title: 'Blog — IA en entreprise', slug: '/blog/ia', type: 'Article', status: 'published', views: '1 240', lastEdit: 'Hier' },
  { title: 'Contact', slug: '/contact', type: 'Page', status: 'draft', views: '—', lastEdit: 'Il y a 3 jours' },
  { title: 'Mentions légales', slug: '/mentions', type: 'Page', status: 'published', views: '54', lastEdit: 'Il y a 10 jours' },
];

const statusStyle: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const statusLabel: Record<string, string> = {
  published: 'Publiée',
  draft: 'Brouillon',
};

export function PagesPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pages & CMS</h1>
          <p className="page-subtitle">Gérez le contenu de votre site web</p>
        </div>
        <Button size="sm" className="rounded-xl gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Nouvelle page
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pages publiées', value: '5', icon: Globe, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
          { label: 'Brouillons', value: '1', icon: FileText, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
          { label: 'Vues ce mois', value: '2 725', icon: Eye, color: 'bg-primary/10 text-primary' },
          { label: 'Total pages', value: '6', icon: Layers, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="metric-card flex items-center gap-3 p-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', s.color)}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="text-xl font-black tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pages table */}
      <div className="card-elevated rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold">Toutes les pages</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>URL</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Vues</th>
              <th>Modifié</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, i) => (
              <tr key={i} className="group cursor-pointer">
                <td className="font-medium">{page.title}</td>
                <td className="font-mono text-xs text-muted-foreground">{page.slug}</td>
                <td><span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{page.type}</span></td>
                <td>
                  <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold', statusStyle[page.status])}>
                    {statusLabel[page.status]}
                  </span>
                </td>
                <td className="text-sm text-muted-foreground">{page.views}</td>
                <td className="text-xs text-muted-foreground">{page.lastEdit}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
