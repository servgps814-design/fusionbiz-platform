import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fusionbizAuth } from '@/lib/auth-enhanced';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, XCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = fusionbizAuth.auth.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }

    setUser(currentUser);
    const companies = fusionbizAuth.db.companies.filter(
      (c: any) => c.createdByUserId === currentUser.id
    );

    if (companies.length > 0) {
      setCompany(companies[0]);
    }

    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    fusionbizAuth.auth.logout();
    navigate('/');
  };

  if (loading || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-700/50 border-slate-600 w-96">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-600 rounded"></div>
              <div className="h-4 bg-slate-600 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/50',
      title: 'En attente d\'approbation',
      description: 'Votre demande d\'inscription est en cours de traitement par notre équipe.',
    },
    approved: {
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/50',
      title: 'Compte approuvé',
      description: 'Votre compte a été approuvé! Vous pouvez maintenant accéder à la plateforme.',
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
      title: 'Compte rejeté',
      description: 'Votre demande a été rejetée. Veuillez contacter notre support pour plus d\'informations.',
    },
    suspended: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50',
      title: 'Compte suspendu',
      description: 'Votre compte a été temporairement suspendu. Veuillez contacter notre support.',
    },
  };

  const config = statusConfig[company.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Bienvenue chez FusionBiz</h1>
              <p className="text-slate-400 mt-2">Status de votre demande d'inscription</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Status Card */}
          <Card className={`${config.bgColor} border ${config.borderColor} mb-8`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <StatusIcon className={`w-12 h-12 ${config.color} flex-shrink-0`} />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{config.title}</h2>
                  <p className="text-slate-300">{config.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User & Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle>Vos informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Nom</p>
                  <p className="text-white font-semibold">{user?.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white font-semibold">{user?.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle>Informations entreprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400">Nom</p>
                  <p className="text-white font-semibold">{company?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Secteur</p>
                  <p className="text-white font-semibold">{company?.industry}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Details */}
          {company && (
            <Card className="bg-slate-700/50 border-slate-600 mb-8">
              <CardHeader>
                <CardTitle>Détails de votre entreprise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {company.siret && (
                    <div>
                      <p className="text-slate-400">SIRET</p>
                      <p className="text-white font-semibold">{company.siret}</p>
                    </div>
                  )}
                  {company.legalStatus && (
                    <div>
                      <p className="text-slate-400">Statut juridique</p>
                      <p className="text-white font-semibold">{company.legalStatus}</p>
                    </div>
                  )}
                  {company.address && (
                    <div className="col-span-full">
                      <p className="text-slate-400">Adresse</p>
                      <p className="text-white font-semibold">
                        {company.address}, {company.postalCode} {company.city}
                      </p>
                    </div>
                  )}
                  {company.phone && (
                    <div>
                      <p className="text-slate-400">Téléphone</p>
                      <p className="text-white font-semibold">{company.phone}</p>
                    </div>
                  )}
                  {company.website && (
                    <div>
                      <p className="text-slate-400">Site web</p>
                      <p className="text-white font-semibold">{company.website}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {company?.status === 'pending' && (
            <Card className="bg-blue-500/10 border border-blue-500/50 mb-8">
              <CardHeader>
                <CardTitle className="text-blue-400">Que se passe-t-il ensuite?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex gap-3">
                    <span className="text-blue-400 font-bold">1.</span>
                    <span>Notre équipe examinera votre demande dans les 24-48 heures</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-400 font-bold">2.</span>
                    <span>Vous recevrez un email de confirmation dès que possible</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-400 font-bold">3.</span>
                    <span>Une fois approuvé, vous aurez accès à toutes les fonctionnalités de la plateforme</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          {company?.status === 'approved' && (
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Accéder à votre tableau de bord
              </Button>
            </div>
          )}

          {company?.status === 'rejected' && (
            <Card className="bg-red-500/10 border border-red-500/50 mb-8">
              <CardHeader>
                <CardTitle className="text-red-400">Raison du rejet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">{company.rejectionReason || 'Aucune raison fournie'}</p>
                <p className="text-slate-400 text-sm mt-4">
                  Veuillez contacter notre support pour discuter de votre application.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Support Contact */}
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader>
              <CardTitle>Besoin d'aide?</CardTitle>
              <CardDescription>Contactez notre équipe de support</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-white">
                <strong>Email:</strong> support@fusionbiz.fr
              </p>
              <p className="text-white">
                <strong>Téléphone:</strong> +33 1 23 45 67 89
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default OnboardingPage;
