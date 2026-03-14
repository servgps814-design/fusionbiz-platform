import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Check, Zap, Shield, Calendar, AlertCircle } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const PLAN_FEATURES = [
  'CRM & Gestion clients illimités',
  'Devis & Facturation professionnels',
  'Comptabilité & Suivi TVA',
  'E-commerce & Boutique en ligne',
  'Constructeur de pages web',
  'Marketing multicanal (email, SMS)',
  'Réseaux sociaux & planification',
  'Médiathèque illimitée',
  'Analytique & Rapports',
  'Gestion d\'équipe & Rôles',
  'Automatisations & Workflows',
  'Support prioritaire',
];

export const BillingPage = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const subs = await blink.db.subscriptions.list({
        where: { organizationId: company.id },
        limit: 1,
        orderBy: { createdAt: 'desc' },
      });
      setSubscription((subs as any[])[0] || null);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const statusBadge = (status: string) => {
    const cfg: Record<string, { label: string; cls: string }> = {
      active:   { label: 'Actif',           cls: 'bg-emerald-100 text-emerald-700' },
      trialing: { label: 'Essai gratuit',   cls: 'bg-blue-100 text-blue-700' },
      past_due: { label: 'Paiement en retard', cls: 'bg-red-100 text-red-700' },
      canceled: { label: 'Annulé',          cls: 'bg-slate-100 text-slate-600' },
    };
    const c = cfg[status] ?? cfg.active;
    return <span className={cn('px-3 py-1 rounded-full text-xs font-bold', c.cls)}>{c.label}</span>;
  };

  const handleUpgrade = () => {
    // TODO: integrate Stripe checkout
    window.alert('Intégration Stripe requise. Configurez VITE_STRIPE_PUBLISHABLE_KEY pour activer le paiement.');
  };

  const handlePortal = () => {
    // TODO: redirect to Stripe customer portal
    window.alert('Portail de facturation Stripe. Configurez le webhook et l\'URL du portail.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Abonnement</h1>
          <p className="page-subtitle">Gérez votre plan ORBiS et votre facturation</p>
        </div>
      </div>

      {/* Current subscription status */}
      {loading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-lg">Plan Pro</p>
                  {subscription ? statusBadge(subscription.status) : statusBadge('trialing')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription
                    ? `Organisation: ${company?.name}`
                    : 'Essai gratuit de 14 jours — aucune carte bancaire requise'
                  }
                </p>
                {subscription?.trialEnd && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Essai jusqu'au {new Date(subscription.trialEnd).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {subscription?.status === 'active' ? (
                <Button variant="outline" onClick={handlePortal}>
                  Gérer l'abonnement
                </Button>
              ) : (
                <Button onClick={handleUpgrade} className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  Activer le plan Pro — 49 €/mois
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border-2 border-primary rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
            TOUT INCLUS
          </div>
          <div className="mb-6 pt-2">
            <p className="text-muted-foreground text-sm font-semibold mb-1">Plan Pro</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black tracking-tighter">49</span>
              <span className="text-xl font-bold text-muted-foreground">€</span>
              <span className="text-muted-foreground text-sm">/mois</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">par organisation · sans engagement</p>
          </div>
          <ul className="space-y-2.5 mb-6">
            {PLAN_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {!subscription || subscription.status !== 'active' ? (
            <Button onClick={handleUpgrade} className="w-full gap-2">
              <CreditCard className="w-4 h-4" />
              Démarrer à 49 €/mois
            </Button>
          ) : (
            <Button variant="outline" onClick={handlePortal} className="w-full">
              Gérer via le portail Stripe
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Security note */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-800 text-sm">Paiement sécurisé par Stripe</p>
              <p className="text-emerald-700 text-xs mt-0.5">
                Vos données bancaires ne sont jamais stockées sur nos serveurs.
                Chiffrement SSL/TLS et conformité PCI DSS garantis.
              </p>
            </div>
          </div>

          {/* Subscription info */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm">Détails de l'abonnement</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-semibold">Pro — Tout inclus</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarif</span>
                <span className="font-semibold">49 € / mois HT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA (20%)</span>
                <span className="font-semibold">9,80 €</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-bold">Total TTC</span>
                <span className="font-black text-primary">58,80 €</span>
              </div>
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-800 text-sm">Intégration Stripe</p>
              <p className="text-blue-700 text-xs mt-0.5">
                Pour activer le paiement en production, configurez les variables d'environnement
                Stripe dans votre espace déploiement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
