import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, FileText, Receipt, Store,
  Megaphone, BarChart3, Share2, Image, Zap, Globe,
  Check, ArrowRight, Star, Shield, Layers, Bot,
  TrendingUp, Target, Settings, ChevronRight,
  ShieldCheck, CheckCircle2, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Animation helpers ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.5, delay },
  }),
};

function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Users,
    title: 'CRM & Pipeline',
    description: 'Gérez clients, prospects et opportunités dans un pipeline visuel. Relances automatiques et scoring des leads.',
    color: 'from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/20',
  },
  {
    icon: FileText,
    title: 'Devis & Factures',
    description: 'Créez des documents professionnels en 30 secondes. Convertissez devis en factures en un clic.',
    color: 'from-violet-500 to-violet-600',
    glow: 'shadow-violet-500/20',
  },
  {
    icon: Receipt,
    title: 'Comptabilité',
    description: 'Suivez dépenses, TVA et trésorerie. Export comptable prêt à l\'emploi pour votre expert-comptable.',
    color: 'from-emerald-500 to-emerald-600',
    glow: 'shadow-emerald-500/20',
  },
  {
    icon: Store,
    title: 'E-commerce',
    description: 'Votre boutique en ligne intégrée. Gérez catalogue, commandes et clients depuis une interface unifiée.',
    color: 'from-orange-500 to-orange-600',
    glow: 'shadow-orange-500/20',
  },
  {
    icon: Megaphone,
    title: 'Marketing',
    description: 'Campagnes email, réseaux sociaux et automation. Engagez et convertissez vos prospects efficacement.',
    color: 'from-pink-500 to-pink-600',
    glow: 'shadow-pink-500/20',
  },
  {
    icon: BarChart3,
    title: 'Analytique',
    description: 'Tableaux de bord temps réel. Suivez vos KPIs, revenus et performances marketing en un coup d\'œil.',
    color: 'from-indigo-500 to-indigo-600',
    glow: 'shadow-indigo-500/20',
  },
];

const allInOneFeatures = [
  'CRM & gestion des clients',
  'Devis, factures et avoirs',
  'Comptabilité & déclaration TVA',
  'Boutique e-commerce intégrée',
  'Constructeur de pages web',
  'Marketing email & SMS',
  'Planification réseaux sociaux',
  'Tableaux de bord analytiques',
];

const testimonials = [
  {
    name: 'Sophie Martin',
    role: 'Directrice, Studio Créatif',
    text: 'ORBiS a transformé notre façon de travailler. Tout est centralisé, nos équipes gagnent 3h par jour. Le ROI a été immédiat.',
    rating: 5,
    avatar: 'SM',
  },
  {
    name: 'Thomas Dubois',
    role: 'Gérant, PME Commerce',
    text: 'Enfin un outil français qui respecte nos obligations légales. La facturation et la TVA sont gérées automatiquement.',
    rating: 5,
    avatar: 'TD',
  },
  {
    name: 'Camille Lefèvre',
    role: 'Freelance & Auto-entrepreneur',
    text: 'Simple, rapide et complet. En 5 minutes j\'avais créé mon premier devis. Je ne peux plus m\'en passer.',
    rating: 5,
    avatar: 'CL',
  },
];

const logoPlaceholders = [
  { name: 'Renault', abbr: 'R' },
  { name: 'Decathlon', abbr: 'D' },
  { name: 'Veolia', abbr: 'V' },
  { name: 'Bouygues', abbr: 'B' },
  { name: 'Sodexo', abbr: 'S' },
  { name: 'Michelin', abbr: 'M' },
];

const pricingFeatures = [
  'CRM & Gestion clients illimitée',
  'Devis & Facturation conformes',
  'Comptabilité & TVA automatisée',
  'E-commerce & Boutique en ligne',
  'Marketing multicanal',
  'Réseaux sociaux intégrés',
  'Médiathèque illimitée',
  'Analyses & Rapports avancés',
  'Gestion d\'équipe (jusqu\'à 10)',
  'Support prioritaire 24/7',
];

const stats = [
  { value: '500+', label: 'entreprises actives' },
  { value: '99.9%', label: 'disponibilité garantie' },
  { value: '4.9/5', label: 'satisfaction client' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const GradientOrb = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'absolute rounded-full pointer-events-none',
      className,
    )}
    style={{ filter: 'blur(80px)' }}
  />
);

function Navbar({ onCta, isAuthenticated }: { onCta: () => void; isAuthenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 w-full z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#08082a]/95 backdrop-blur-xl border-b border-white/8 shadow-2xl shadow-black/20'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span
            className="text-lg font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #e2e8ff, #a5b4fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ORBiS
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-indigo-200/70">
          <a href="#features" className="hover:text-white transition-colors duration-200">
            Fonctionnalités
          </a>
          <a href="#allinone" className="hover:text-white transition-colors duration-200">
            Tout-en-un
          </a>
          <a href="#pricing" className="hover:text-white transition-colors duration-200">
            Tarifs
          </a>
          <a href="#testimonials" className="hover:text-white transition-colors duration-200">
            Avis clients
          </a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onCta}
            className="text-indigo-200 hover:text-white hover:bg-white/10 font-semibold text-sm h-9"
          >
            {isAuthenticated ? 'Dashboard' : 'Connexion'}
          </Button>
          <Button
            onClick={onCta}
            className="h-9 px-5 rounded-full font-bold text-sm bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/30 border-0 text-white"
          >
            {isAuthenticated ? 'Accéder' : 'Démarrer'}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#08082a]/98 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-6 py-4 space-y-3">
              {['#features', '#allinone', '#pricing', '#testimonials'].map((href, i) => {
                const labels = ['Fonctionnalités', 'Tout-en-un', 'Tarifs', 'Avis clients'];
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-semibold text-indigo-200/70 hover:text-white py-2"
                  >
                    {labels[i]}
                  </a>
                );
              })}
              <div className="pt-3 flex flex-col gap-2 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={() => { onCta(); setMobileOpen(false); }}
                  className="w-full justify-center text-indigo-200 hover:text-white hover:bg-white/10 font-semibold"
                >
                  {isAuthenticated ? 'Dashboard' : 'Connexion'}
                </Button>
                <Button
                  onClick={() => { onCta(); setMobileOpen(false); }}
                  className="w-full justify-center rounded-full font-bold bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0"
                >
                  {isAuthenticated ? 'Accéder' : 'Démarrer'}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function FeatureCard({
  icon: Icon, title, description, color, glow, index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  glow: string;
  index: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index * 0.07}
      className="group relative p-6 rounded-2xl bg-white/4 border border-white/8 hover:border-indigo-500/40 hover:bg-white/6 transition-all duration-300 cursor-default overflow-hidden"
    >
      {/* Subtle hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(235 85% 55% / 0.08), transparent 70%)' }}
      />
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110',
          color,
          glow,
        )}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-base font-bold mb-2 tracking-tight text-white">{title}</h3>
      <p className="text-indigo-200/60 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function TestimonialCard({
  name, role, text, rating, avatar, index,
}: {
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
  index: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index * 0.1}
      className="p-6 rounded-2xl bg-white/4 border border-white/8 hover:border-indigo-400/30 transition-all duration-300 flex flex-col gap-4"
    >
      <div className="flex gap-0.5">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-indigo-100/80 text-sm leading-relaxed flex-1">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">{avatar}</span>
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">{name}</p>
          <p className="text-indigo-300/60 text-xs">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main LandingPage ─────────────────────────────────────────────────────────

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const handleCta = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      blink.auth.login();
    }
  };

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #07071f 0%, #0d0d2e 40%, #0a0a24 100%)' }}
    >
      <Navbar onCta={handleCta} isAuthenticated={isAuthenticated} />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background orbs */}
        <GradientOrb className="w-[600px] h-[600px] bg-indigo-600/20 -top-32 -right-48" />
        <GradientOrb className="w-[500px] h-[500px] bg-violet-600/15 top-1/2 -left-48" />
        <GradientOrb className="w-[400px] h-[400px] bg-blue-600/10 bottom-0 left-1/3" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(hsl(235 85% 65% / 0.04) 1px, transparent 1px),
              linear-gradient(90deg, hsl(235 85% 65% / 0.04) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative max-w-5xl mx-auto px-6 py-24 text-center w-full"
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
              </span>
              Plateforme tout-en-un · Essai gratuit 14 jours
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.03] mb-7"
          >
            Pilotez toute votre{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              activité
            </span>
            <br />
            depuis une seule plateforme
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="text-lg md:text-xl text-indigo-200/60 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            ORBiS réunit CRM, facturation, comptabilité, e-commerce, marketing et réseaux sociaux
            dans une plateforme française pensée pour les PME qui veulent aller vite.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={handleCta}
              size="lg"
              className="h-14 px-10 rounded-full font-bold text-base bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-xl shadow-indigo-500/30 border-0 text-white transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-14 px-10 rounded-full font-bold text-base border border-white/15 text-indigo-200 hover:bg-white/8 hover:text-white transition-all duration-200"
            >
              Voir la démo
            </Button>
          </motion.div>

          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={0.45}
            className="text-xs text-indigo-400/50 mt-6 font-medium"
          >
            Aucune carte bancaire requise · Configuration en 5 minutes
          </motion.p>

          {/* Stats */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.5}
            className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p
                  className="text-2xl sm:text-3xl font-black tracking-tight mb-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #c7d2fe, #a5b4fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {value}
                </p>
                <p className="text-xs text-indigo-300/50 font-medium">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Dashboard preview mockup */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.6}
            className="mt-20 relative mx-auto max-w-4xl"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/20 to-transparent" style={{ filter: 'blur(40px)', transform: 'translateY(20px) scale(0.95)' }} />
            <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-[#0d0d2e] shadow-2xl shadow-black/40">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0a24] border-b border-white/8">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 mx-4 h-6 rounded-md bg-white/5 flex items-center px-3">
                  <span className="text-[11px] text-indigo-300/40">app.orbis.fr/dashboard</span>
                </div>
              </div>

              {/* Fake dashboard grid */}
              <div className="p-5 grid grid-cols-4 gap-3">
                {[
                  { label: 'Chiffre d\'affaires', value: '48 200 €', trend: '+12%', color: 'text-emerald-400' },
                  { label: 'Factures en attente', value: '12 650 €', trend: '4 docs', color: 'text-amber-400' },
                  { label: 'Nouvelles commandes', value: '28', trend: 'ce mois', color: 'text-blue-400' },
                  { label: 'Nouveaux leads', value: '15', trend: '+5', color: 'text-violet-400' },
                ].map(({ label, value, trend, color }) => (
                  <div key={label} className="bg-white/4 rounded-xl p-3 border border-white/6">
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-lg font-black text-white tracking-tight">{value}</p>
                    <p className={cn('text-xs font-bold mt-0.5', color)}>{trend}</p>
                  </div>
                ))}

                {/* Wide chart placeholder */}
                <div className="col-span-3 bg-white/4 rounded-xl p-4 border border-white/6">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">Revenus — 6 derniers mois</p>
                  <div className="flex items-end gap-2 h-16">
                    {[35, 52, 41, 68, 78, 85].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-md"
                        style={{
                          height: `${h}%`,
                          background: i === 5
                            ? 'linear-gradient(180deg, #818cf8, #6366f1)'
                            : 'rgba(129, 140, 248, 0.2)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Mini right panel */}
                <div className="bg-white/4 rounded-xl p-4 border border-white/6 flex flex-col gap-2">
                  <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Modules actifs</p>
                  {['CRM', 'Factures', 'Compta', 'Shop'].map((m) => (
                    <div key={m} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-white/60">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Logos band ───────────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/6">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <motion.p
              variants={fadeUp}
              className="text-center text-xs font-bold uppercase tracking-widest text-indigo-400/50 mb-10"
            >
              Ils nous font confiance
            </motion.p>
          </AnimatedSection>
          <AnimatedSection className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {logoPlaceholders.map(({ name, abbr }, i) => (
              <motion.div
                key={name}
                variants={fadeIn}
                custom={i * 0.06}
                className="flex items-center gap-2 opacity-30 hover:opacity-60 transition-opacity duration-300"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-black">{abbr}</span>
                </div>
                <span className="text-white font-bold text-sm tracking-tight">{name}</span>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-3">
              Fonctionnalités
            </motion.p>
            <motion.h2 variants={fadeUp} custom={0.08} className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-5">
              Tout ce dont vous avez besoin
            </motion.h2>
            <motion.p variants={fadeUp} custom={0.16} className="text-indigo-200/50 text-lg max-w-2xl mx-auto">
              Fini les 8 outils différents. ORBiS centralise tous vos processus métier dans une interface unifiée.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── All-in-one split section ──────────────────────────────────────────── */}
      <section id="allinone" className="py-24 px-6 relative overflow-hidden">
        <GradientOrb className="w-[600px] h-[600px] bg-violet-600/10 -left-64 top-0" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <AnimatedSection>
              <motion.p variants={fadeUp} className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-3">
                Tout-en-un
              </motion.p>
              <motion.h2 variants={fadeUp} custom={0.08} className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6">
                Une plateforme,<br />
                <span style={{
                  background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  zéro friction
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.16} className="text-indigo-200/50 leading-relaxed mb-8">
                ORBiS remplace votre CRM, votre logiciel de facturation, votre outil comptable,
                votre plateforme e-commerce et vos outils marketing. Tout est connecté, tout est synchronisé.
              </motion.p>
              <motion.div variants={fadeUp} custom={0.24} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allInOneFeatures.map((feat, i) => (
                  <div
                    key={feat}
                    className="flex items-center gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-indigo-100/70">{feat}</span>
                  </div>
                ))}
              </motion.div>
              <motion.div variants={fadeUp} custom={0.32} className="mt-8">
                <Button
                  onClick={() => blink.auth.login()}
                  className="h-12 px-8 rounded-full font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/30 border-0 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Commencer maintenant <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </AnimatedSection>

            {/* Right: feature highlights panel */}
            <AnimatedSection>
              <motion.div variants={fadeUp} custom={0.1} className="relative">
                <div
                  className="rounded-3xl border border-white/10 p-6 space-y-3"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))' }}
                >
                  {[
                    { icon: ShieldCheck, label: 'Données hébergées en France', sub: 'RGPD natif, conformité garantie', color: 'text-emerald-400' },
                    { icon: TrendingUp, label: 'ROI mesurable dès J+7', sub: 'Économisez 3h/jour en moyenne', color: 'text-blue-400' },
                    { icon: Target, label: 'Adapté à votre secteur', sub: 'PME, freelances, agences, e-commerce', color: 'text-violet-400' },
                    { icon: Settings, label: 'Modules activables', sub: 'Payez uniquement ce que vous utilisez', color: 'text-amber-400' },
                    { icon: Bot, label: 'Assistant IA intégré', sub: 'Automatisez les tâches répétitives', color: 'text-pink-400' },
                  ].map(({ icon: Icon, label, sub, color }, i) => (
                    <div
                      key={label}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-white/4 border border-white/6 hover:border-indigo-500/30 transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/6 flex items-center justify-center shrink-0">
                        <Icon className={cn('w-5 h-5', color)} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm leading-tight">{label}</p>
                        <p className="text-indigo-200/50 text-xs mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 relative overflow-hidden">
        <GradientOrb className="w-[500px] h-[500px] bg-indigo-600/12 left-1/2 -translate-x-1/2 top-0" />
        <div className="max-w-4xl mx-auto relative">
          <AnimatedSection className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-3">
              Tarifs
            </motion.p>
            <motion.h2 variants={fadeUp} custom={0.08} className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
              Simple. Transparent. Tout inclus.
            </motion.h2>
            <motion.p variants={fadeUp} custom={0.16} className="text-indigo-200/50 text-lg">
              Un seul plan, toutes les fonctionnalités. Pas de surprise, pas de module caché.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection>
            <motion.div
              variants={fadeUp}
              custom={0.1}
              className="relative max-w-sm mx-auto"
            >
              {/* Glow ring */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-violet-600 opacity-20 blur-xl" />

              <div
                className="relative rounded-3xl border border-indigo-400/25 p-8"
                style={{ background: 'linear-gradient(160deg, rgba(13,13,46,0.95), rgba(8,8,42,0.95))' }}
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30">
                    <Zap className="w-3 h-3" /> TOUT INCLUS
                  </span>
                </div>

                <div className="text-center mb-8 pt-2">
                  <p className="text-indigo-400/70 text-sm font-semibold mb-1">Plan Pro</p>
                  <div className="flex items-baseline justify-center gap-1 mb-1">
                    <span className="text-5xl font-black tracking-tighter text-white">49</span>
                    <span className="text-xl font-bold text-indigo-300/60">€</span>
                    <span className="text-indigo-400/50 text-sm">/mois</span>
                  </div>
                  <p className="text-indigo-400/40 text-xs">par organisation · sans engagement</p>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {pricingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-indigo-100/70 font-medium">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => blink.auth.login()}
                  className="w-full h-12 rounded-xl font-bold text-base bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border-0 text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Démarrer l'essai gratuit
                </Button>
                <p className="text-center text-xs text-indigo-400/40 mt-3">
                  14 jours d'essai gratuit · Aucune CB requise
                </p>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-3">
              Avis clients
            </motion.p>
            <motion.h2 variants={fadeUp} custom={0.08} className="text-4xl font-black tracking-tighter text-white mb-4">
              Ce qu'ils disent d'ORBiS
            </motion.h2>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} {...t} index={i} />
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.12))' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, hsl(235 85% 55% / 0.12), transparent 60%)`,
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-5">
              Prêt à transformer votre activité ?
            </motion.h2>
            <motion.p variants={fadeUp} custom={0.1} className="text-indigo-200/60 text-lg mb-10">
              Rejoignez 500+ entreprises qui font confiance à ORBiS chaque jour.
            </motion.p>
            <motion.div variants={fadeUp} custom={0.2} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => blink.auth.login()}
                size="lg"
                className="h-14 px-12 rounded-full font-bold text-base bg-white text-indigo-700 hover:bg-indigo-50 shadow-2xl shadow-white/20 transition-all duration-200 hover:scale-105 active:scale-95 border-0"
              >
                Créer mon compte gratuitement
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
            <motion.p variants={fadeIn} custom={0.35} className="text-xs text-indigo-400/40 mt-5 font-medium">
              Aucune carte bancaire · 14 jours d'essai · Annulation à tout moment
            </motion.p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span
                  className="text-lg font-black tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #e2e8ff, #a5b4fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ORBiS
                </span>
              </div>
              <p className="text-xs text-indigo-300/40 leading-relaxed">
                La plateforme tout-en-un pour les entreprises françaises qui veulent croître sans complexité.
              </p>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Produit</p>
                <ul className="space-y-2 text-indigo-300/50">
                  {['Fonctionnalités', 'Tarifs', 'Roadmap', 'Mises à jour'].map((l) => (
                    <li key={l}><a href="#" className="hover:text-indigo-200 transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Entreprise</p>
                <ul className="space-y-2 text-indigo-300/50">
                  {['À propos', 'Blog', 'Partenaires', 'Contact'].map((l) => (
                    <li key={l}><a href="#" className="hover:text-indigo-200 transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Légal</p>
                <ul className="space-y-2 text-indigo-300/50">
                  {['CGU', 'Confidentialité', 'Mentions légales', 'Cookies'].map((l) => (
                    <li key={l}><a href="#" className="hover:text-indigo-200 transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-white/6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-indigo-400/40">© 2025 ORBiS. Tous droits réservés.</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-indigo-400/40">Tous les systèmes opérationnels</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
