# 🎉 Va-t-il pleuvoir sur mon défilé ?

Une Progressive Web App (PWA) simple et intuitive pour obtenir des prévisions météo et des recommandations IA personnalisées pour vos événements en extérieur.

## 🎯 Fonctionnalités

- **📍 Géolocalisation automatique** : Détecte votre position GPS via le navigateur
- **📅 Sélecteur de date** : Choisissez la date de votre événement
- **☁️ Données météo en temps réel** : Température, probabilité de pluie, force du vent
- **🤖 Recommandations IA** : Conseils personnalisés générés par intelligence artificielle
- **🎨 Interface simple et accessible** : Design épuré et facile à utiliser

## 🛠️ Stack Technique

### Frontend
- **React** (avec Vite)
- **TypeScript**
- **TailwindCSS** pour le design
- **shadcn/ui** pour les composants UI
- **Lovable** comme plateforme de développement

### Backend
- **Lovable Cloud** (Supabase sous le capot)
- **Edge Functions** (Deno/TypeScript) pour la logique serveur
- **Lovable AI** (Google Gemini 2.5 Flash) pour les recommandations

### APIs Externes
- **Open-Meteo API** : Données météorologiques gratuites et open-source

## 🚀 Mise en route

### Prérequis
- Un compte [Lovable](https://lovable.dev)
- Node.js 18+ (pour développement local)

### Installation et développement

1. **Cloner le projet depuis Lovable**
   - Ouvrez votre projet Lovable
   - Cliquez sur "Share" → "Export to GitHub" pour obtenir le repository

2. **Installer les dépendances**
   ```bash
   git clone <votre-repo-url>
   cd <nom-du-projet>
   npm install
   ```

3. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   L'application sera disponible sur `http://localhost:5173`

### Configuration Backend (Lovable Cloud)

Le backend est déjà configuré et déployé automatiquement ! 🎉

- **Edge Function** : `get-weather-forecast` est déployée automatiquement
- **Lovable AI** : La clé API est déjà configurée
- **Pas de configuration manuelle nécessaire**

Pour voir les logs ou gérer le backend :
1. Ouvrez votre projet dans Lovable
2. Cliquez sur l'onglet "Cloud" dans la barre latérale
3. Vous pouvez y voir les logs des fonctions, gérer les secrets, etc.

## 📱 Fonctionnalités PWA

L'application est une Progressive Web App, ce qui signifie :
- ✅ Fonctionne hors ligne (après la première visite)
- ✅ Installable sur mobile et desktop
- ✅ Rapide et performante
- ✅ Expérience native sur mobile

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       │ HTTP Request (lat, lon, date)
       │
       ▼
┌──────────────────────┐
│  Edge Function       │
│  get-weather-forecast│
│  (Deno/TypeScript)   │
└─────┬────────┬───────┘
      │        │
      │        │ Appel API
      │        ▼
      │  ┌──────────────┐
      │  │  Lovable AI  │
      │  │  (Gemini)    │
      │  └──────────────┘
      │
      │ Appel API
      ▼
┌──────────────┐
│  Open-Meteo  │
│  Weather API │
└──────────────┘
```

## 🔧 Personnalisation

### Modifier les seuils de vent
Dans `supabase/functions/get-weather-forecast/index.ts` :
```typescript
let windStrength = 'faible';
if (windSpeed > 30) windStrength = 'fort';        // Modifiez ici
else if (windSpeed > 15) windStrength = 'moyen';  // Et ici
```

### Personnaliser les recommandations IA
Modifiez le prompt système dans l'edge function :
```typescript
{
  role: 'system',
  content: 'Tu es un assistant météo... [votre nouveau prompt]'
}
```

### Changer le modèle d'IA
Dans l'edge function, remplacez :
```typescript
model: 'google/gemini-2.5-flash',  // Par : google/gemini-2.5-pro, openai/gpt-5, etc.
```

## 📊 API Open-Meteo

L'application utilise l'API Open-Meteo pour récupérer :
- Température maximale et minimale
- Probabilité de précipitations
- Vitesse du vent

Documentation : [https://open-meteo.com/](https://open-meteo.com/)

## 🚢 Déploiement

### Déploiement automatique avec Lovable

Le déploiement est entièrement géré par Lovable :

1. **Déployer en production**
   - Ouvrez votre projet dans Lovable
   - Cliquez sur "Share" → "Publish"
   - Votre app est déployée automatiquement sur `https://votreprojet.lovableproject.com`

2. **Domaine personnalisé (optionnel)**
   - Allez dans "Settings" → "Domains"
   - Cliquez sur "Connect Domain"
   - Suivez les instructions pour connecter votre domaine

### Edge Functions
Les Edge Functions sont déployées automatiquement avec votre code. Pas de configuration supplémentaire !

## 🧪 Tests

Pour tester l'application :

1. **Autoriser la géolocalisation** dans votre navigateur
2. **Sélectionner une date** future
3. **Cliquer sur "OBTENIR LA PRÉVISION"**
4. **Vérifier** les résultats affichés

## 📝 Notes Importantes

### Géolocalisation
- L'utilisateur doit **autoriser** la géolocalisation
- Sur **HTTPS uniquement** (ou localhost)
- Fonctionne mieux sur **mobile**

### Limites de l'API Open-Meteo
- Gratuite et sans clé API
- Prévisions jusqu'à 16 jours dans le futur
- Mise à jour 4 fois par jour

### Lovable AI
- **Gratuit** pour les modèles Gemini (jusqu'au 6 octobre 2025)
- Limite de requêtes par minute
- Voir vos quotas dans Settings → Workspace → Usage

## 🐛 Dépannage

### La géolocalisation ne fonctionne pas
- Vérifiez que vous êtes sur HTTPS
- Autorisez la géolocalisation dans les paramètres du navigateur
- Rechargez la page

### L'API météo ne répond pas
- Vérifiez votre connexion internet
- Les coordonnées GPS sont-elles valides ?
- Consultez les logs dans l'onglet "Cloud" de Lovable

### L'IA ne génère pas de recommandation
- Vérifiez les logs de la fonction `get-weather-forecast`
- Assurez-vous que Lovable AI est activé
- Vérifiez vos quotas d'utilisation

## 📚 Ressources

- [Documentation Lovable](https://docs.lovable.dev)
- [Documentation Lovable Cloud](https://docs.lovable.dev/features/cloud)
- [Documentation Lovable AI](https://docs.lovable.dev/features/ai)
- [API Open-Meteo](https://open-meteo.com/en/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🎓 Créé pour un Hackathon

Ce projet a été conçu pour être :
- ✅ **Simple** à comprendre et à modifier
- ✅ **Rapide** à déployer
- ✅ **Fonctionnel** dès le premier lancement
- ✅ **Évolutif** pour ajouter de nouvelles fonctionnalités

## 🤝 Contribution

Pour contribuer à ce projet :
1. Forkez le projet sur GitHub
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Committez vos changements (`git commit -m 'Ajout d'une fonctionnalité'`)
4. Pushez sur la branche (`git push origin feature/amelioration`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est open-source et disponible sous la licence MIT.

---

Fait avec ❤️ et ☁️ pour votre prochain défilé ensoleillé !
