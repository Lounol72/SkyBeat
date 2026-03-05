/** Représentation d'une vidéo musicale YouTube */
export interface YouTubeTrack {
  videoId: string;
  title: string;
  thumbnail: string;
}

/** Réponse après création d'une playlist YouTube */
export interface PlaylistResponse {
  playlistUrl: string;
  playlistId: string;
}
