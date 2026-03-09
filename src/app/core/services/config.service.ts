import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Service de configuration centralisé.
 * Expose les clés API et variables d'environnement de manière typée.
 * En production, les valeurs proviennent de environment.prod.ts
 * (injecté via fileReplacements dans angular.json).
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {

  get isProduction(): boolean {
    return environment.production;
  }

  get backendUrl(): string {
    return environment.backendUrl;
  }

  getYoutubeApiKey(): string {
    return environment.youtubeApiKey;
  }

  getSpotifyClientId(): string {
    return environment.spotifyClientId;
  }

  /**
   * ⚠️ Ne JAMAIS utiliser côté client en production.
   * Le clientSecret Spotify doit transiter uniquement par un backend proxy.
   */
  getSpotifyClientSecret(): string {
    if (environment.production) {
      console.warn(
        '[ConfigService] spotifyClientSecret ne doit pas être utilisé côté client en production. Utilisez un backend proxy.'
      );
    }
    return environment.spotifyClientSecret;
  }

  getSpotifyRedirectUri(): string {
    return environment.spotifyRedirectUri;
  }
}
