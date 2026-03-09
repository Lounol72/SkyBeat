// Environnement de développement local
// Les valeurs ici sont des placeholders pour le dev — remplacez-les par vos clés locales
export const environment = {
  production: false,
  backendUrl: 'http://localhost:3080',

  youtubeApiKey: 'DEV_YOUTUBE_API_KEY',

  spotifyClientId: 'DEV_SPOTIFY_CLIENT_ID',
  // ⚠️ Ne JAMAIS exposer le clientSecret en frontend en production.
  // Utilisez un backend proxy pour les appels nécessitant le secret.
  spotifyClientSecret: 'DEV_SPOTIFY_CLIENT_SECRET',
  spotifyRedirectUri: 'http://localhost:4200/callback',
};
