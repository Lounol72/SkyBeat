/** Représentation d'une track Spotify */
export interface SpotifyTrack {
  trackId: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string;
  previewUrl: string | null;
}

/** Réponse après création d'une playlist Spotify */
export interface SpotifyPlaylistResponse {
  playlistUrl: string;
  playlistId: string;
}
