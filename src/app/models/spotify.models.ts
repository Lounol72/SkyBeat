/** Représentation d'une track Spotify */
export interface SpotifyTrack {
  trackId: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string;
  previewUrl: string | null;
}

/** Représentation d'une playlist Spotify */
export interface SpotifyPlaylist {
  playlistId: string;
  title: string;
  owner: string;
  trackCount: number;
  thumbnail: string;
  description: string | null;
  spotifyUrl: string;
}

/** Réponse après création d'une playlist Spotify */
export interface SpotifyPlaylistResponse {
  playlistUrl: string;
  playlistId: string;
}
