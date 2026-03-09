import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, Subject, ReplaySubject } from 'rxjs';
import { tap, catchError, take } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { YouTubeTrack, PlaylistResponse } from '../models/youtube.models';

/**
 * Service YouTube pour SkyBeat.
 * Communique avec le backend Express qui proxie les appels vers YouTube Data API v3.
 * La clé API YouTube reste côté serveur — jamais exposée au client.
 *
 * Supporte le preloading : la landing page déclenche la recherche en arrière-plan,
 * et la page /generate récupère les résultats instantanément depuis le cache.
 */
@Injectable({ providedIn: 'root' })
export class YoutubeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.backendUrl;

  /** Cache client pour éviter les appels réseau répétés (double couche avec le cache serveur 12h) */
  private readonly searchCache = new Map<string, YouTubeTrack[]>();

  /** Mood actuellement préchargé (stocké pour que /generate puisse le récupérer) */
  private preloadedMood: string | null = null;

  /**
   * ReplaySubject pour notifier quand le preload est terminé.
   * ReplaySubject(1) permet aux souscripteurs tardifs (page /generate) de recevoir
   * la dernière valeur même si le preload est déjà terminé.
   */
  private preloadResult$ = new ReplaySubject<YouTubeTrack[]>(1);
  private preloadInProgress = false;

  // --- Mapping météo WMO → mood YouTube ---

  /** Table de correspondance entre codes WMO et mots-clés musicaux */
  private readonly weatherMoodMap: { codes: number[]; mood: string }[] = [
    { codes: [0, 1], mood: 'summer pop upbeat dance' },
    { codes: [2, 3], mood: 'acoustic jazz mellow' },
    { codes: [45, 48], mood: 'ambient atmospheric dreamy' },
    { codes: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], mood: 'rainy day chill lo-fi' },
    { codes: [71, 73, 75, 77, 85, 86], mood: 'winter instrumental ambient' },
    { codes: [95, 96, 99], mood: 'epic dramatic powerful' },
  ];

  /**
   * Convertit un code météo WMO en mots-clés de recherche YouTube.
   * @param weatherCode Code WMO retourné par Open-Meteo (0-99)
   */
  getPlaylistMood(weatherCode: number): string {
    const entry = this.weatherMoodMap.find((e) => e.codes.includes(weatherCode));
    return entry?.mood ?? 'chill vibes music';
  }

  /** Retourne le mood actuellement préchargé (ou null si aucun preload) */
  getCurrentMood(): string | null {
    return this.preloadedMood;
  }

  /**
   * Précharge les tracks en arrière-plan depuis la landing page.
   * Appelé par HeroComponent dès que la météo est disponible.
   * Ne fait rien si un preload est déjà en cours pour le même mood.
   */
  preloadTracks(weatherCode: number): void {
    const mood = this.getPlaylistMood(weatherCode);

    // Pas de double preload pour le même mood
    if (this.preloadedMood === mood && (this.preloadInProgress || this.searchCache.has(mood))) {
      return;
    }

    this.preloadedMood = mood;
    this.preloadInProgress = true;

    this.searchTracks(mood).pipe(take(1)).subscribe({
      next: (tracks) => {
        this.preloadInProgress = false;
        this.preloadResult$.next(tracks);
      },
      error: (err) => {
        this.preloadInProgress = false;
        this.preloadResult$.error(err);
        // Recréer le subject pour que les prochains appels fonctionnent
        this.preloadResult$ = new ReplaySubject<YouTubeTrack[]>(1);
      },
    });
  }

  /**
   * Récupère les tracks préchargés pour la page /generate.
   * - Si le cache client contient les résultats → retour instantané
   * - Si un preload est en cours → attend sa complétion
   * - Si aucun preload et pas de cache → fallback avec weatherCode depuis localStorage
   */
  getPreloadedTracks(): Observable<YouTubeTrack[]> {
    // Cas 1 : résultats déjà en cache client
    if (this.preloadedMood && this.searchCache.has(this.preloadedMood)) {
      return of(this.searchCache.get(this.preloadedMood)!);
    }

    // Cas 2 : preload en cours, on attend le résultat
    if (this.preloadInProgress) {
      return this.preloadResult$.pipe(take(1));
    }

    // Cas 3 : accès direct à /generate sans passer par la landing — fallback localStorage
    const weatherJson = typeof localStorage !== 'undefined'
      ? localStorage.getItem('weatherData')
      : null;

    if (weatherJson) {
      const { weather } = JSON.parse(weatherJson);
      const mood = this.getPlaylistMood(weather.weatherCode);
      this.preloadedMood = mood;
      return this.searchTracks(mood);
    }

    // Cas 4 : aucune donnée météo — mood par défaut
    this.preloadedMood = 'chill vibes music';
    return this.searchTracks(this.preloadedMood);
  }

  /**
   * Recherche des vidéos musicales via le backend proxy YouTube.
   * Utilise un cache client pour ne pas refaire la même requête.
   * @param mood Mots-clés de recherche (issus de getPlaylistMood)
   */
  searchTracks(mood: string): Observable<YouTubeTrack[]> {
    const cached = this.searchCache.get(mood);
    if (cached) {
      return of(cached);
    }

    return this.http
      .get<YouTubeTrack[]>(`${this.apiUrl}/youtube/search`, {
        params: { mood },
      })
      .pipe(
        tap((tracks) => this.searchCache.set(mood, tracks)),
        catchError((err: HttpErrorResponse) => this.handleError('searchTracks', err))
      );
  }

  /**
   * Crée une playlist YouTube et y ajoute les tracks.
   * Nécessite un token OAuth 2.0 valide (passé via le header Authorization).
   * @param title Nom de la playlist
   * @param trackIds Liste de videoId YouTube à ajouter
   * @param oauthToken Token OAuth 2.0 Bearer de l'utilisateur
   */
  createPlaylist(title: string, trackIds: string[], oauthToken: string): Observable<PlaylistResponse> {
    return this.http
      .post<PlaylistResponse>(
        `${this.apiUrl}/youtube/playlist`,
        { title, trackIds },
        { headers: { Authorization: `Bearer ${oauthToken}` } }
      )
      .pipe(
        catchError((err: HttpErrorResponse) => this.handleError('createPlaylist', err))
      );
  }

  /** Gestion centralisée des erreurs HTTP */
  private handleError(method: string, error: HttpErrorResponse): Observable<never> {
    let message: string;

    if (error.status === 0) {
      message = 'Impossible de contacter le serveur. Vérifiez que le backend est lancé.';
    } else if (error.status === 403) {
      message = 'Quota YouTube dépassé ou accès refusé.';
    } else if (error.status === 401) {
      message = 'Token OAuth manquant ou invalide.';
    } else {
      message = error.error?.error || `Erreur ${error.status} sur ${method}`;
    }

    console.error(`[YoutubeService.${method}]`, message, error);
    return throwError(() => new Error(message));
  }
}
