import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  Bot, 
  Globe, 
  Layers, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  Workflow,
  Target,
  Truck
} from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-8 rounded-2xl bg-card border border-border shadow-elegant glass"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </motion.div>
);

export const LandingPage = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter">FUSION<span className="text-primary">BIZ</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Solutions</a>
            <a href="#about" className="hover:text-primary transition-colors">Entreprise</a>
            <a href="#integrations" className="hover:text-primary transition-colors">Ecosystème</a>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={login} className="hidden sm:inline-flex">Connexion</Button>
            <Button onClick={login} className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              Commencer l'aventure
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1758520144667-3041caeff3c1?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero Background"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Propulsé par l'IA Fusion
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                L'OS ULTIME POUR LES <span className="text-primary">ENTREPRISES</span> MODERNES.
              </h1>
              <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium">
                FusionBiz combine ERP, Automatisation et Marketing dans une plateforme unique. Scalable, sécurisée et intelligente.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" onClick={login} className="w-full sm:w-auto rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20">
                  Déployer ma plateforme <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-10 h-14 text-lg font-bold border-2">
                  Voir la démo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-black tracking-tighter mb-6 uppercase">Un écosystème complet pour <span className="text-primary">fusionner</span> vos opérations.</h2>
              <p className="text-muted-foreground text-lg">Plus qu'un logiciel, FusionBiz est votre partenaire de croissance digitale.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Workflow}
              title="Automatisation Visuelle"
              description="Créez des workflows complexes en glisser-déposer. Connectez vos outils favoris sans une ligne de code."
            />
            <FeatureCard 
              icon={BarChart3}
              title="ERP Omnicanal"
              description="Gérez clients, facturation, stocks et RH depuis un centre de commande unifié et puissant."
            />
            <FeatureCard 
              icon={Bot}
              title="Assistant IA Central"
              description="Une intelligence artificielle qui comprend votre métier et optimise vos processus en temps réel."
            />
            <FeatureCard 
              icon={Target}
              title="Marketing Automatisé"
              description="Campagnes WhatsApp, Instagram et Emailing pilotées par l'IA pour maximiser votre conversion."
            />
            <FeatureCard 
              icon={Globe}
              title="Interconnexion B2B"
              description="Collaborez instantanément avec vos partenaires. Partagez données et processus en toute sécurité."
            />
            <FeatureCard 
              icon={Truck}
              title="Gestion de Livraison"
              description="Module logistique complet de type Uber Eats pour vos services de restauration ou livraison."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <div className="text-5xl font-black mb-2 tracking-tighter text-primary">500+</div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Entreprises</div>
            </div>
            <div>
              <div className="text-5xl font-black mb-2 tracking-tighter text-primary">12M</div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Transactions</div>
            </div>
            <div>
              <div className="text-5xl font-black mb-2 tracking-tighter text-primary">99.9%</div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Uptime</div>
            </div>
            <div>
              <div className="text-5xl font-black mb-2 tracking-tighter text-primary">24/7</div>
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            <span className="text-xl font-black tracking-tighter">FUSIONBIZ</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2026 FusionBiz Platform. Tous droits réservés.
          </div>
          <div className="flex items-center gap-6">
            <ShieldCheck className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer" />
            <Zap className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
};
