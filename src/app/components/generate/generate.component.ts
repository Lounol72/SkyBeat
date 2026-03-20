import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

import { YoutubeService } from '../../services/youtube.service';
import { YouTubeTrack } from '../../models/youtube.models';
import { SpotifyService } from '../../services/spotify.service';
import { SpotifyPlaylist } from '../../models/spotify.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-generate',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="generate">
      <!-- État : chargement -->
      @if (isLoading()) {
        <div class="generate__loader">
          <div class="generate__spinner"></div>
          <p class="generate__loader-text">Génération de votre playlist...</p>
        </div>
      }

      <!-- État : erreur -->
      @else if (error()) {
        <div class="generate__error">
          <span class="generate__error-icon">!</span>
          <p class="generate__error-text">{{ error() }}</p>
          <button class="generate__btn generate__btn--retry" (click)="loadTracks()">Réessayer</button>
          <a routerLink="/" class="generate__back-link">Retour à l'accueil</a>
        </div>
      }

      <!-- État : résultats -->
      @else if (tracks().length) {
        @let coverTrack = tracks()[0];

        <!-- Couverture de la playlist -->
        <section class="generate__cover">
          <div class="generate__cover-img-wrapper">
            <img
              [src]="coverTrack.thumbnail"
              [alt]="coverTrack.title"
              class="generate__cover-img"
            />
            <div class="generate__cover-overlay"></div>
          </div>
          <div class="generate__cover-info">
            <span class="generate__cover-badge">SkyBeat Mix</span>
            <h1 class="generate__cover-title">{{ moodLabel() }}</h1>
            <p class="generate__cover-count">{{ tracks().length }} titres</p>
          </div>
        </section>

        <!-- 3 premiers tracks -->
        <section class="generate__tracklist">
          <h2 class="generate__tracklist-heading">Aperçu</h2>
          @for (track of displayedTracks(); track trackId(track); let i = $index) {
            <a
              class="generate__track"
              [href]="getItemUrl(track)"
              target="_blank"
              rel="noopener"
            >
              <span class="generate__track-index">{{ i + 1 }}</span>
              <img
                [src]="track.thumbnail"
                [alt]="getItemTitle(track)"
                class="generate__track-thumb"
              />
              <div class="generate__track-info">
                <span class="generate__track-title">{{ getItemTitle(track) }}</span>
                @if (isSpotifyPlaylist(track)) {
                  <span class="generate__track-artist">Par {{ track.owner }} • {{ track.trackCount }} titres</span>
                }
              </div>
              <svg class="generate__track-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </a>
          }
        </section>

        <div class="generate__actions">
          <a routerLink="/" class="generate__btn generate__btn--back">Retour</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .generate {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6rem 1.5rem 3rem;
      box-sizing: border-box;
      max-width: 640px;
      margin: 0 auto;
    }

    /* --- Loader --- */
    .generate__loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 1.5rem;
    }

    .generate__spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255, 255, 255, 0.15);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .generate__loader-text {
      font-family: var(--font-secondary);
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.8);
      letter-spacing: 0.01em;
    }

    /* --- Error --- */
    .generate__error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 1rem;
      text-align: center;
    }

    .generate__error-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(220, 38, 38, 0.2);
      color: #fca5a5;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .generate__error-text {
      font-family: var(--font-secondary);
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.85);
      max-width: 32ch;
      line-height: 1.5;
    }

    /* --- Cover --- */
    .generate__cover {
      width: 100%;
      position: relative;
      border-radius: 24px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 24px 48px rgba(0, 0, 0, 0.12);
      animation: fadeSlideUp 0.6s ease-out;
    }

    .generate__cover-img-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }

    .generate__cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .generate__cover-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 60%);
    }

    .generate__cover-info {
      padding: 1.25rem 1.5rem 1.5rem;
    }

    .generate__cover-badge {
      display: inline-block;
      font-family: var(--font-ui);
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.15);
      padding: 0.3rem 0.75rem;
      border-radius: 980px;
      margin-bottom: 0.75rem;
    }

    .generate__cover-title {
      margin: 0 0 0.25rem;
      font-size: clamp(1.5rem, 4vw, 2rem);
      font-weight: 400;
      color: #fff;
      letter-spacing: -0.025em;
      line-height: 1.2;
      text-transform: capitalize;
    }

    .generate__cover-count {
      margin: 0;
      font-family: var(--font-secondary);
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.65);
    }

    /* --- Tracklist --- */
    .generate__tracklist {
      width: 100%;
      margin-top: 1.5rem;
      animation: fadeSlideUp 0.6s ease-out 0.15s both;
    }

    .generate__tracklist-heading {
      font-size: 1.1rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 0.75rem;
      letter-spacing: -0.01em;
    }

    .generate__track {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 1rem;
      border-radius: 14px;
      text-decoration: none;
      color: #fff;
      transition: background 0.2s ease;
    }

    .generate__track:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .generate__track-index {
      font-family: var(--font-ui);
      font-size: 0.8rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.4);
      width: 1.25rem;
      text-align: center;
      flex-shrink: 0;
    }

    .generate__track-thumb {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .generate__track-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      overflow: hidden;
    }

    .generate__track-title {
      font-family: var(--font-ui);
      font-size: 0.9rem;
      font-weight: 450;
      color: rgba(255, 255, 255, 0.92);
      line-height: 1.35;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .generate__track-artist {
      font-family: var(--font-secondary);
      font-size: 0.75rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.5);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .generate__track-play {
      width: 20px;
      height: 20px;
      color: rgba(255, 255, 255, 0.35);
      flex-shrink: 0;
      transition: color 0.2s ease;
    }

    .generate__track:hover .generate__track-play {
      color: rgba(255, 255, 255, 0.8);
    }

    /* --- Actions --- */
    .generate__actions {
      margin-top: 2rem;
      display: flex;
      gap: 1rem;
      animation: fadeSlideUp 0.6s ease-out 0.3s both;
    }

    /* --- Buttons (shared) --- */
    .generate__btn {
      display: inline-block;
      padding: 0.875rem 1.75rem;
      font-family: var(--font-secondary);
      font-size: 0.9rem;
      font-weight: 600;
      color: #fff;
      border: none;
      border-radius: 980px;
      text-decoration: none;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease;
    }

    .generate__btn:hover {
      transform: scale(1.04);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .generate__btn:active {
      transform: scale(0.98);
    }

    .generate__btn--back {
      background: rgba(0, 0, 0, 0.5);
    }

    .generate__btn--retry {
      background: rgba(220, 38, 38, 0.6);
    }

    .generate__back-link {
      font-family: var(--font-secondary);
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      margin-top: 0.25rem;
    }

    .generate__back-link:hover {
      color: rgba(255, 255, 255, 0.9);
    }

    /* --- Animations --- */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeSlideUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* --- Responsive --- */
    @media (max-width: 599px) {
      .generate {
        padding: 5rem 1rem 2rem;
      }

      .generate__cover-info {
        padding: 1rem 1.25rem 1.25rem;
      }

      .generate__track {
        padding: 0.625rem 0.5rem;
        gap: 0.625rem;
      }

      .generate__track-thumb {
        width: 40px;
        height: 40px;
      }
    }
  `],
})
export class GenerateComponent implements OnInit {
  private youtubeService = inject(YoutubeService);
  private spotifyService = inject(SpotifyService);
  private platformId = inject(PLATFORM_ID);

  tracks = signal<(YouTubeTrack | SpotifyPlaylist)[]>([]);
  displayedTracks = signal<(YouTubeTrack | SpotifyPlaylist)[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  moodLabel = signal('Playlist');
  musicPreference: 'youtube' | 'spotify' = 'youtube';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Lire la préférence musicale depuis localStorage
      const preference = localStorage.getItem('musicPreference');
      if (preference === 'spotify' || preference === 'youtube') {
        this.musicPreference = preference;
      }
      this.loadTracks();
    }
  }

  loadTracks(): void {
    this.isLoading.set(true);
    this.error.set(null);

    if (this.musicPreference === 'spotify') {
      // Spotify : charger les playlists
      const mood = this.spotifyService.getCurrentMood();
      if (mood) {
        this.moodLabel.set(mood.replace(/\b\w/g, (c) => c.toUpperCase()));
      }

      this.spotifyService.getPreloadedPlaylists().subscribe({
        next: (playlists: SpotifyPlaylist[]) => {
          this.tracks.set(playlists);
          this.displayedTracks.set(playlists.slice(0, 3));
          this.isLoading.set(false);

          if (!mood) {
            const currentMood = this.spotifyService.getCurrentMood();
            if (currentMood) {
              this.moodLabel.set(currentMood.replace(/\b\w/g, (c) => c.toUpperCase()));
            }
          }
        },
        error: (err: any) => {
          this.error.set(err.message || 'Une erreur est survenue');
          this.isLoading.set(false);
        },
      });
    } else {
      // YouTube : charger les tracks
      const mood = this.youtubeService.getCurrentMood();
      if (mood) {
        this.moodLabel.set(mood.replace(/\b\w/g, (c) => c.toUpperCase()));
      }

      this.youtubeService.getPreloadedTracks().subscribe({
        next: (tracks: YouTubeTrack[]) => {
          this.tracks.set(tracks);
          this.displayedTracks.set(tracks.slice(0, 3));
          this.isLoading.set(false);

          if (!mood) {
            const currentMood = this.youtubeService.getCurrentMood();
            if (currentMood) {
              this.moodLabel.set(currentMood.replace(/\b\w/g, (c) => c.toUpperCase()));
            }
          }
        },
        error: (err: any) => {
          this.error.set(err.message || 'Une erreur est survenue');
          this.isLoading.set(false);
        },
      });
    }
  }

  // Helper methods pour gérer les deux types (tracks YouTube et playlists Spotify)
  trackId(track: YouTubeTrack | SpotifyPlaylist): string {
    return this.isSpotifyPlaylist(track) ? track.playlistId : track.videoId;
  }

  isSpotifyPlaylist(track: YouTubeTrack | SpotifyPlaylist): track is SpotifyPlaylist {
    return 'playlistId' in track;
  }

  getItemTitle(track: YouTubeTrack | SpotifyPlaylist): string {
    return track.title;
  }

  getItemUrl(track: YouTubeTrack | SpotifyPlaylist): string {
    if (this.isSpotifyPlaylist(track)) {
      return track.spotifyUrl;
    } else {
      return `https://www.youtube.com/watch?v=${track.videoId}`;
    }
  }
}
