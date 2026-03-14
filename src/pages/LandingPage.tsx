import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart3, FileText, Receipt, Users, Store, Megaphone,
  Share2, Image, CreditCard, Globe, Layers, Zap,
  ShieldCheck, ChevronRight, CheckCircle2, ArrowRight,
  TrendingUp, Target, Settings, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, description, color }: {
  icon: React.ElementType; title: string; description: string; color: string;
}) => (
  <div className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110', color)}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h3 className="text-base font-bold mb-2 tracking-tight text-slate-900">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
  </div>
);

// ─── Pricing Card ─────────────────────────────────────────────────────────────
const PricingCard = ({ onCta }: { onCta: () => void }) => (
  <div className="relative bg-white rounded-3xl border-2 border-indigo-100 shadow-xl p-8 max-w-sm mx-auto">
    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
      <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">TOUT INCLUS</span>
    </div>
    <div className="text-center mb-8 pt-2">
      <p className="text-slate-500 text-sm font-semibold mb-1">Plan Pro</p>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-5xl font-black tracking-tighter text-slate-900">49</span>
        <span className="text-xl font-bold text-slate-500">€</span>
        <span className="text-slate-400 text-sm">/mois</span>
      </div>
      <p className="text-slate-400 text-xs mt-1">par organisation · sans engagement</p>
    </div>
    <ul className="space-y-3 mb-8">
      {[
        'CRM & Gestion clients', 'Devis & Facturation', 'Comptabilité & TVA',
        'E-commerce & Boutique', 'Marketing multicanal', 'Réseaux sociaux',
        'Médiathèque illimitée', 'Analyses & Rapports', 'Gestion d\'équipe',
        'Support prioritaire',
      ].map((f) => (
        <li key={f} className="flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-slate-700 font-medium">{f}</span>
        </li>
      ))}
    </ul>
    <Button onClick={onCta} className="w-full h-12 rounded-xl font-bold text-base bg-indigo-600 hover:bg-indigo-700 shadow-lg">
      Démarrer l'essai gratuit
    </Button>
    <p className="text-center text-xs text-slate-400 mt-3">14 jours d'essai gratuit · Aucune CB requise</p>
  </div>
);

// ─── Stat Item ────────────────────────────────────────────────────────────────
const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <p className="text-4xl font-black tracking-tighter text-white mb-1">{value}</p>
    <p className="text-indigo-200 text-sm font-semibold">{label}</p>
  </div>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ onCta, isAuthenticated }: { onCta: () => void; isAuthenticated: boolean }) => (
  <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-black tracking-tight text-slate-900">
          OR<span className="text-indigo-600">B</span>iS
        </span>
      </div>

      {/* Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
        <a href="#features" className="hover:text-indigo-600 transition-colors">Fonctionnalités</a>
        <a href="#pricing" className="hover:text-indigo-600 transition-colors">Tarifs</a>
        <a href="#about" className="hover:text-indigo-600 transition-colors">À propos</a>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onCta} className="text-slate-600 font-semibold text-sm">
          {isAuthenticated ? 'Dashboard' : 'Connexion'}
        </Button>
        <Button onClick={onCta} className="h-9 px-5 rounded-full font-bold text-sm bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200">
          {isAuthenticated ? 'Accéder' : 'Essai gratuit'}
        </Button>
      </div>
    </div>
  </nav>
);

// ─── Features data ────────────────────────────────────────────────────────────
const features = [
  { icon: Users, title: 'CRM & Clients', description: 'Gérez vos leads, clients et contacts dans un pipeline visuel. Suivi des opportunités et relances automatiques.', color: 'bg-blue-500' },
  { icon: FileText, title: 'Devis & Facturation', description: 'Créez des devis professionnels, convertissez-les en factures et encaissez vos paiements sans effort.', color: 'bg-violet-500' },
  { icon: Receipt, title: 'Comptabilité', description: 'Tableau de bord financier complet avec suivi TVA, dépenses, rapports et export comptable prêt à l\'emploi.', color: 'bg-emerald-500' },
  { icon: Store, title: 'E-commerce', description: 'Gérez votre catalogue, vos commandes et vos clients boutique depuis une interface unifiée et intuitive.', color: 'bg-orange-500' },
  { icon: Globe, title: 'Vitrine web', description: 'Créez votre boutique en ligne et vos pages marketing avec notre constructeur de pages par blocs.', color: 'bg-cyan-500' },
  { icon: Megaphone, title: 'Marketing', description: 'Campagnes email, segments d\'audience et automatisations pour engager et convertir vos prospects.', color: 'bg-pink-500' },
  { icon: Share2, title: 'Réseaux Sociaux', description: 'Planifiez et publiez vos contenus sur Instagram, LinkedIn, Facebook et plus depuis un seul endroit.', color: 'bg-red-500' },
  { icon: BarChart3, title: 'Analytique', description: 'Tableaux de bord avec vos KPIs clés : revenus, taux de conversion, performance des campagnes et plus.', color: 'bg-indigo-500' },
  { icon: Bot, title: 'Assistant IA', description: 'Votre copilote intelligent pour analyser vos données, rédiger des contenus et automatiser des tâches répétitives.', color: 'bg-amber-500' },
];

// ─── LandingPage ──────────────────────────────────────────────────────────────
export const LandingPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCta = () => {
    if (isAuthenticated) navigate('/dashboard');
    else login();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar onCta={handleCta} isAuthenticated={isAuthenticated} />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-8">
            <Zap className="w-3 h-3" />
            Plateforme tout-en-un · Essai gratuit 14 jours
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-[1.05]">
            Pilotez votre{' '}
            <span className="relative">
              <span className="text-indigo-600">entreprise</span>
            </span>{' '}
            depuis un seul outil
          </h1>

          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            ORBiS réunit CRM, facturation, comptabilité, e-commerce, marketing et
            réseaux sociaux dans une plateforme française pensée pour les PME et
            freelances qui veulent aller vite.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={handleCta}
              size="lg"
              className="h-14 px-10 rounded-full font-bold text-base bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200/60"
            >
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-10 rounded-full font-bold text-base border-slate-200"
            >
              Voir la démo
            </Button>
          </div>

          <p className="text-xs text-slate-400 mt-6 font-medium">
            Aucune carte bancaire requise · Configuration en 5 minutes
          </p>
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────────────────────────── */}
      <section className="bg-indigo-600 py-14">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem value="2 400+" label="Entreprises actives" />
          <StatItem value="49 €" label="Par mois tout inclus" />
          <StatItem value="16" label="Modules intégrés" />
          <StatItem value="98%" label="Satisfaction client" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Fini les 8 outils différents. ORBiS centralise tous vos processus métier
              dans une interface unifiée et cohérente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ORBiS ─────────────────────────────────────────────────────────── */}
      <section id="about" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">Pourquoi ORBiS ?</p>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-6">
                Conçu pour la performance,<br />pas pour la complexité
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                ORBiS a été construit pour répondre aux besoins réels des entrepreneurs
                français : conformité TVA, format de factures légales, et intégrations
                avec les outils du quotidien.
              </p>
              <div className="space-y-4">
                {[
                  { icon: ShieldCheck, title: 'Données en France', desc: 'Hébergement souverain, RGPD natif, conformité garantie' },
                  { icon: TrendingUp, title: 'ROI immédiat', desc: 'Déployé en 5 minutes, productif en 1 journée' },
                  { icon: Target, title: 'Adapté aux PME', desc: 'Pensé pour les équipes de 1 à 200 personnes' },
                  { icon: Settings, title: 'Personnalisable', desc: 'Modules activables selon votre activité' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{title}</p>
                      <p className="text-slate-500 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-8 border border-indigo-100">
              <div className="space-y-4">
                {[
                  { label: 'Chiffre d\'affaires', value: '48 200 €', trend: '+12%', color: 'text-emerald-600' },
                  { label: 'Factures en attente', value: '12 650 €', count: '4 factures', color: 'text-amber-600' },
                  { label: 'Nouvelles commandes', value: '28 cmd', trend: 'ce mois', color: 'text-blue-600' },
                  { label: 'Nouveaux leads', value: '15', trend: '+5 cette semaine', color: 'text-violet-600' },
                ].map(({ label, value, trend, count, color }) => (
                  <div key={label} className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-xs border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p className="text-xl font-black tracking-tight text-slate-900">{value}</p>
                    </div>
                    <span className={cn('text-sm font-bold', color)}>{trend || count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">Tarifs</p>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-4">
            Simple. Transparent. Tout inclus.
          </h2>
          <p className="text-slate-500 text-lg mb-14">
            Un seul plan, toutes les fonctionnalités. Pas de surprise, pas de module caché.
          </p>
          <PricingCard onCta={handleCta} />
        </div>
      </section>

      {/* ── CTA Band ──────────────────────────────────────────────────────────── */}
      <section className="bg-indigo-600 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black tracking-tight text-white mb-4">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-indigo-200 text-lg mb-10">
            Rejoignez 2 400+ entreprises qui font confiance à ORBiS.
          </p>
          <Button
            onClick={handleCta}
            size="lg"
            className="h-14 px-12 rounded-full font-bold text-base bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl"
          >
            Démarrer maintenant — c'est gratuit
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-black tracking-tight">OR<span className="text-indigo-400">B</span>iS</span>
          </div>
          <p className="text-sm">© 2025 ORBiS · Plateforme française tout-en-un pour les entreprises</p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">CGU</a>
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
