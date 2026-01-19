# SkyBeat 🎵🌤️

> **SkyBeat** — L'harmonie entre météo et musique

## 🎯 Concept

**SkyBeat** est une application web intelligente qui synchronise la météo de votre localisation avec la musique parfaite pour votre humeur du moment.

Le site analyse les conditions météorologiques en temps réel — soleil éclatant, pluie battante ou ciel orageux — et génère automatiquement une playlist adaptée à l'atmosphère ambiante.

## ✨ Fonctionnalités actuelles (Mode Placeholder)

### 🌦️ Conditions météo disponibles
- **Ensoleillé** ☀️ - Musique énergique et joyeuse
- **Pluvieux** 🌧️ - Ambiance douce et introspective (Lo-Fi, Jazz)
- **Nuageux** ☁️ - Musique calme et contemplative
- **Orageux** ⛈️ - Morceaux intenses et puissants (Rock, Électro)
- **Coucher de soleil** 🌅 - Ambiance romantique et nostalgique

### 🎨 Design et expérience utilisateur

- **Animation météo dynamique** en fond (pluie, éclaircies, orages ou coucher de soleil virtuel)
- **Lecteur musical intégré** affichant la playlist correspondant au climat actuel
- **Carte météo détaillée** avec température, vent et humidité
- **Bouton "Changer d'ambiance"** pour explorer différentes conditions météo et leurs playlists associées
- **Harmonie visuelle et sonore** : couleurs, transitions et animations s'ajustent automatiquement

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Lancement du serveur de développement

```bash
npm start
```

Ouvrez votre navigateur sur `http://localhost:4200/`

### Build de production

```bash
npm run build
```

## 🛠️ Technologies utilisées

- **Angular 21** - Framework web moderne
- **TypeScript** - Langage de programmation typé
- **CSS3** - Animations et transitions avancées
- **RxJS** - Gestion réactive des données

## 📁 Structure du projet

```
src/app/
├── components/
│   ├── home/                    # Page principale
│   ├── weather-animation/       # Animations météo de fond
│   ├── weather-card/           # Carte d'informations météo
│   └── music-player/           # Lecteur musical avec playlist
├── services/
│   ├── weather.service.ts      # Service météo (données mock)
│   └── music.service.ts        # Service musique (données mock)
└── ...
```

## 🎵 Playlists disponibles

### ☀️ Vibes Ensoleillées
- Here Comes The Sun - The Beatles
- Good Vibrations - The Beach Boys
- Walking on Sunshine - Katrina and the Waves
- Happy - Pharrell Williams

### 🌧️ Pluie Apaisante
- Rainy Days and Mondays - The Carpenters
- The Rain Song - Led Zeppelin
- November Rain - Guns N' Roses
- Have You Ever Seen The Rain - CCR

### ☁️ Nuages Mélancoliques
- Both Sides Now - Joni Mitchell
- Cloudbusting - Kate Bush
- A Day in the Life - The Beatles
- Mad World - Tears for Fears

### ⛈️ Tempête Électrique
- Thunderstruck - AC/DC
- Riders on the Storm - The Doors
- When the Levee Breaks - Led Zeppelin
- Storm - Godspeed You! Black Emperor

### 🌅 Coucher de Soleil
- Sunset Lover - Petit Biscuit
- Golden Hour - JVKE
- Sunset - The xx
- Here Comes The Sun - The Beatles

## 🔮 Prochaines étapes (Intégration d'APIs)

- [ ] Intégration de l'API **OpenWeatherMap** pour la météo en temps réel
- [ ] Connexion à l'API **Spotify** pour les playlists réelles
- [ ] Intégration de **YouTube Music** comme alternative
- [ ] Géolocalisation automatique de l'utilisateur
- [ ] Historique des écoutes
- [ ] Partage de playlists météo
- [ ] **Création de compte client** avec préférences musicales (Spotify ou YouTube Music)
- [ ] **Réception quotidienne par email** de la playlist du jour adaptée à la météo
- [ ] Système de notifications personnalisées
- [ ] Sauvegarde des playlists favorites

## 💡 Utilisation

1. **Consultez la météo actuelle** affichée sur la carte météo
2. **Découvrez la playlist** automatiquement sélectionnée selon la météo
3. **Cliquez sur une chanson** pour la "jouer" (mode placeholder)
4. **Utilisez le bouton "Changer d'ambiance"** pour explorer d'autres conditions météo
5. **Profitez des animations** qui s'adaptent à chaque changement de météo

## 📝 Notes de développement

Ce projet utilise actuellement des **données mockées** pour simuler :
- Les conditions météorologiques
- Les playlists musicales
- La lecture de musique

Les APIs réelles seront intégrées dans une version future.

## 👨‍💻 Développement

Le projet utilise les dernières fonctionnalités d'Angular :
- **Signals** pour la réactivité des données
- **Standalone Components** pour une meilleure modularité
- **Input/Output avec signals** pour la communication entre composants
- **Control Flow Syntax** (@if, @for) pour les templates

---

**SkyBeat** - Transformez chaque instant en moment musical parfaitement accordé à la météo 🎶☁️

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
