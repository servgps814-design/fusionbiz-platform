# 🚀 FusionBiz Platform - Plateforme SaaS d'Entreprise

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/servgps814-design/fusionbiz-platform)
[![License](https://img.shields.io/badge/license-proprietary-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)

Une plateforme SaaS complète et moderne pour la gestion d'entreprise, combinant CRM, facturation, comptabilité, e-commerce, marketing et bien plus.

## ✨ Caractéristiques Principales

### 📊 Gestion d'Entreprise Complète
- **CRM** - Gestion des contacts, leads et opportunités
- **Facturation** - Création et suivi des factures et devis
- **Comptabilité** - Gestion des dépenses et TVA
- **E-commerce** - Gestion de produits et commandes
- **Marketing** - Campagnes et segmentation d'audience
- **Analytics** - Tableaux de bord et rapports
- **Automation** - Workflows automatisés
- **Delivery** - Gestion de la logistique
- **B2B** - Portal B2B intégré
- **Team & Billing** - Gestion d'équipe et facturation
- **Media & Social** - Gestion de contenu multimédia

### 🛠️ Stack Technologique Moderne
- **Frontend** : React 18+ avec TypeScript
- **Build** : Vite pour une performance optimale
- **Styling** : Tailwind CSS avec composants Shadcn/ui
- **Backend** : Blink Backend-as-a-Service
- **Forms** : React Hook Form avec validation Zod
- **State** : Gestion d'état réactive
- **UI** : Composants accessibles et animés

### 🔐 Sécurité
- Authentification sécurisée
- Headers de sécurité configurés
- HTTPS obligatoire en production
- Protection CSRF intégrée
- Validation des entrées

### ⚡ Performance
- Lazy loading des routes
- Code splitting automatique
- Compression GZIP
- Service Worker pour offline
- Cache intelligent

### 📱 Responsive & PWA
- Design mobile-first
- Support PWA complet
- Installation sur appareil
- Synchronisation offline

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ ou Bun
- Git

### Installation

```bash
# Cloner le repository
git clone https://github.com/servgps814-design/fusionbiz-platform.git
cd fusionbiz-platform

# Installer les dépendances
npm install
# ou avec Bun
bun install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos configurations
```

### Développement

```bash
# Démarrer le serveur de développement
npm run dev
# ou
bun run dev

# Accéder à http://localhost:5000
```

### Linting & Validation

```bash
# Exécuter tous les linters
npm run lint

# Vérifier les variables CSS
npm run check:css-vars

# Vérifier les classes CSS
npm run check:css-classes
```

### Build Production

```bash
# Construire pour la production
npm run build

# Prévisualiser le build
npm run preview

# Vérifier la production
npm run verify
```

## 📋 Variables d'Environnement

Voir [.env.example](.env.example) pour la liste complète des variables disponibles.

### Variables Essentielles

```env
# API
VITE_API_URL=https://api.fusionbiz.fr
VITE_API_TIMEOUT=30000

# Blink Backend-as-a-Service
VITE_BLINK_PROJECT_ID=fusionbiz-platform-eqm2kch7
VITE_BLINK_PUBLISHABLE_KEY=blnk_pk_XXX

# Application
VITE_APP_NAME=FusionBiz Platform
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_LOGGING=true
VITE_ENABLE_ERROR_TRACKING=true

# Monitoring
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

## 📚 Documentation

### Guides Principaux

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guide complet de déploiement
- **[Architecture](./docs/ARCHITECTURE.md)** - Architecture et structure du projet
- **[Contributing](./CONTRIBUTING.md)** - Guide de contribution
- **[Changelog](./CHANGELOG.md)** - Historique des modifications

### Guides Techniques

- [API Integration](./docs/API_INTEGRATION.md)
- [Authentication](./docs/AUTHENTICATION.md)
- [Performance](./docs/PERFORMANCE.md)
- [Security](./docs/SECURITY.md)

## 🔐 Authentification

Par défaut, le système utilise une authentification locale pour le développement :

```
Email: demo@orbis.fr
Password: demo123
```

En production, remplacez par votre système d'authentification réel (OAuth, JWT, etc.).

## 📊 Données de Démonstration

La plateforme inclut des données de démonstration stockées dans `localStorage`. Pour une application production réelle, connectez-vous à un vrai backend.

## 🐛 Dépannage

### Erreur: "Configuration validation failed"
```bash
# Vérifier les variables d'environnement
cat .env.local

# Reconstruire
npm run build
```

### Performance lente
```bash
# Analyser le bundle
npm run preview

# Vérifier avec Lighthouse
# Dans Chrome DevTools: Lighthouse > Analyze page load
```

### Service Worker ne fonctionne pas
- Assurez-vous d'utiliser HTTPS
- Vérifiez que `/public/sw.js` est accessible
- Vérifiez la console du navigateur pour les erreurs

## 📝 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrer le serveur de développement |
| `npm run build` | Construire pour la production |
| `npm run preview` | Prévisualiser le build |
| `npm run lint` | Exécuter tous les linters |
| `npm run verify` | Vérifier la préparation pour production |
| `npm run deploy:verify` | Vérification complète avant déploiement |

## 🚀 Déploiement

### Déploiement Rapide sur Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
vercel deploy --prod

# Ou connecter directement depuis GitHub
# https://vercel.com/new
```

Pour un guide complet, voir **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

### Autres Plateformes

- **Netlify** - [Guide Netlify](./docs/DEPLOY_NETLIFY.md)
- **AWS** - [Guide AWS](./docs/DEPLOY_AWS.md)
- **Docker** - [Guide Docker](./docs/DEPLOY_DOCKER.md)

## 📊 Monitoring & Analytics

### Google Analytics
Configurez `VITE_GOOGLE_ANALYTICS_ID` pour activer.

### Sentry (Error Tracking)
Configurez `VITE_SENTRY_DSN` pour activer.

### Performance Monitoring
Consultez les métriques Web Vitals dans Google Analytics.

## 🤝 Contribution

Les contributions sont bienvenues ! Veuillez consulter [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📄 License

Propriétaire - Tous droits réservés

## 🆘 Support

- 📧 support@fusionbiz.fr
- 🌐 https://fusionbiz.fr
- 📚 Documentation: https://docs.fusionbiz.fr
- 🐛 Issues: https://github.com/servgps814-design/fusionbiz-platform/issues

## ✅ Checklist Pré-Production

Avant de déployer en production :

- [ ] Variables d'environnement configurées
- [ ] HTTPS activé
- [ ] Linting et tests passent
- [ ] Build production réussit
- [ ] Service Worker fonctionne
- [ ] Analytics configuré
- [ ] Monitoring configuré
- [ ] Backups configurés
- [ ] Domaine personnalisé configuré
- [ ] Certificat SSL valide

Exécutez simplement : `npm run deploy:verify`

---

**Fait avec ❤️ par FusionBiz Team**

_Dernière mise à jour: 2026_
