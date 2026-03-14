import React from 'react';
import { Globe, ExternalLink, Eye, Settings, Palette, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StorefrontPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vitrine</h1>
          <p className="page-subtitle">Gérez l'apparence et le contenu de votre boutique en ligne</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-2">
            <Eye className="w-4 h-4" />
            Prévisualiser
          </Button>
          <Button size="sm" className="rounded-xl gap-2 shadow-lg shadow-primary/20">
            <ExternalLink className="w-4 h-4" />
            Voir la boutique
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Visiteurs ce mois', value: '1 248', sub: '+18% vs mois dernier', icon: Eye, color: 'bg-primary/10 text-primary' },
          { label: 'Pages actives', value: '6', sub: '2 en brouillon', icon: Layout, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Thème actif', value: 'Moderne', sub: 'Personnalisé', icon: Palette, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="metric-card flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
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

      {/* Storefront sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elevated rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Sections de la boutique</h3>
            <Button variant="ghost" size="sm" className="rounded-lg text-xs gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Gérer
            </Button>
          </div>
          <div className="space-y-2">
            {[
              { name: 'En-tête', status: 'Actif', visible: true },
              { name: 'Bannière héros', status: 'Actif', visible: true },
              { name: 'Produits vedettes', status: 'Actif', visible: true },
              { name: 'Témoignages clients', status: 'Masqué', visible: false },
              { name: 'Newsletter', status: 'Actif', visible: true },
              { name: 'Pied de page', status: 'Actif', visible: true },
            ].map((section, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${section.visible ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                  <span className="text-sm font-medium">{section.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${section.visible ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                  {section.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-elevated rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Personnalisation du thème</h3>
            <Button variant="ghost" size="sm" className="rounded-lg text-xs gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Modifier
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Couleur principale</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary border-2 border-primary/30" />
                <span className="text-sm font-mono">#5B5FEF</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Typographie</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Geist Sans</span>
                <span className="text-xs text-muted-foreground">/ Geist Mono</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Logo</p>
              <div className="w-20 h-8 bg-muted rounded flex items-center justify-center">
                <Globe className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full rounded-xl mt-2">
              Ouvrir l'éditeur de thème
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
