# 📋 Guide de Déploiement - FusionBiz Platform

Ce guide vous aidera à déployer FusionBiz Platform en production.

## 📦 Prérequis

- Node.js 18+ ou Bun
- Git
- Un service d'hébergement (Vercel, Netlify, AWS, DigitalOcean, etc.)
- Un domaine personnalisé (optionnel mais recommandé)

## 🔧 Configuration Pré-Déploiement

### 1️⃣ Préparer les Variables d'Environnement

Créez un fichier `.env.production` à la racine du projet :

```bash
# ──────────────────────────────────────────────────────────────────────────────
# API Configuration
# ──────────────────────────────────────────────────────────────────────────────
VITE_API_URL=https://api.fusionbiz.fr
VITE_API_TIMEOUT=30000

# ──────────────────────────────────────────────────────────────────────────────
# Application Configuration
# ──────────────────────────────────────────────────────────────────────────────
VITE_APP_NAME=FusionBiz Platform
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# ──────────────────────────────────────────────────────────────────────────────
# Blink Configuration (Backend-as-a-Service)
# ──────────────────────────────────────────────────────────────────────────────
VITE_BLINK_PROJECT_ID=fusionbiz-platform-eqm2kch7
VITE_BLINK_PUBLISHABLE_KEY=blnk_pk_CLYs4qBijrsw2zxR3P2tfh5N9Nvswfne

# ──────────────────────────────────────────────────────────────────────────────
# Feature Flags
# ──────────────────────────────────────────────────────────────────────────────
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_LOGGING=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_DEMO_MODE=false

# ──────────────────────────────────────────────────────────────────────────────
# Security Configuration
# ──────────────────────────────────────────────────────────────────────────────
VITE_ALLOWED_ORIGINS=https://fusionbiz.fr,https://app.fusionbiz.fr
VITE_SECURE_COOKIES=true
VITE_HTTPS_ONLY=true

# ──────────────────────────────────────────────────────────────────────────────
# Analytics & Monitoring
# ──────────────────────────────────────────────────────────────────────────────
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_MIXPANEL_TOKEN=xxx

# ──────────────────────────────────────────────────────────────────────────────
# Performance & CDN
# ──────────────────────────────────────────────────────────────────────────────
VITE_CDN_URL=https://cdn.fusionbiz.fr
VITE_ENABLE_SERVICE_WORKER=true
```

### 2️⃣ Vérifier les Configurations

```bash
# Installer les dépendances
npm install
# ou
bun install

# Exécuter les tests de linting
npm run lint
# ou
bun run lint

# Construire la version production
npm run build
# ou
bun run build

# Prévisualiser le build production
npm run preview
# ou
bun run preview
```

## 🚀 Déploiement sur Vercel (Recommandé)

### Étapes :

1. **Connecter le repository** :
   ```bash
   vercel link
   ```

2. **Configurer les variables d'environnement** dans Vercel :
   - Allez à `Settings` > `Environment Variables`
   - Ajoutez toutes les variables du fichier `.env.production`

3. **Déployer** :
   ```bash
   vercel deploy --prod
   ```

### Configuration Vercel (vercel.json) :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_BLINK_PROJECT_ID": "@vite_blink_project_id",
    "VITE_BLINK_PUBLISHABLE_KEY": "@vite_blink_publishable_key"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

## 🌐 Déploiement sur Netlify

1. **Connecter le repository** :
   - Allez sur [Netlify](https://netlify.com)
   - Connectez votre repository GitHub

2. **Configurer les paramètres de build** :
   - Build command: `npm run build` ou `bun run build`
   - Publish directory: `dist`

3. **Ajouter les variables d'environnement** :
   - Allez à `Site settings` > `Build & deploy` > `Environment`
   - Ajoutez toutes les variables du fichier `.env.production`

4. **Déployer** :
   - Commitez et pushez sur votre branche principale
   - Netlify déploiera automatiquement

## 📋 Checklist de Déploiement

- [ ] Variables d'environnement configurées
- [ ] HTTPS activé
- [ ] Certificat SSL valide
- [ ] Domaine personnalisé configuré
- [ ] Linting et tests passent
- [ ] Build production réussit
- [ ] Pas de console.log en production
- [ ] Service Worker fonctionne
- [ ] Manifest.json accessible
- [ ] Analytics configuré
- [ ] Monitoring/Sentry configuré
- [ ] Backups configurés
- [ ] Rate limiting activé
- [ ] CORS correctement configuré

## 🔐 Sécurité en Production

### Headers de Sécurité Essentiels

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://blink.new
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Configuration CORS

```javascript
// Pour votre serveur backend
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://fusionbiz.fr'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 📊 Monitoring et Logs

### Google Analytics
- Configurez votre ID dans `VITE_GOOGLE_ANALYTICS_ID`
- Accédez au dashboard via [Google Analytics Console](https://analytics.google.com)

### Sentry (Error Tracking)
- Configurez votre DSN dans `VITE_SENTRY_DSN`
- Accédez à [Sentry Dashboard](https://sentry.io)

### Performance Monitoring
- Utilisez les DevTools du navigateur
- Consultez Lighthouse pour les recommandations

## 🔄 Pipeline CI/CD (GitHub Actions)

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run lint
      - run: npm run build
      
      - name: Deploy to Vercel
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 🆘 Dépannage

### Erreur: "Configuration validation failed"
- Vérifiez que `VITE_API_URL` est défini
- Vérifiez que `VITE_BLINK_PROJECT_ID` est correct

### Performance lente
- Activez la compression GZIP
- Vérifiez les Chrome DevTools > Network
- Utilisez Lighthouse pour diagnostiquer

### Service Worker ne se synchronise pas
- Vérifiez que le navigateur supporte les Service Workers
- Vérifiez que le domaine utilise HTTPS

## 📞 Support

Pour toute question, consultez :
- [Documentation Vite](https://vitejs.dev)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Blink](https://blink.new)

## ✨ Prochaines Étapes

Après le déploiement :

1. **Tester en production** :
   - Vérifiez toutes les pages
   - Testez l'authentification
   - Vérifiez les performances

2. **Configurer les domaines** :
   - Ajoutez des domaines supplémentaires
   - Configurez les redirections

3. **Mettre en place le monitoring** :
   - Activez les alertes
   - Configurez les notifications

4. **Planifier les backups** :
   - Configurez les sauvegardes automatiques
   - Testez la récupération

---

**Bravo ! Votre FusionBiz Platform est en production ! 🎉**
