const path = require("path");
const fs = require("fs");

// dotenv v17 auto-injecte depuis le cwd, pas depuis __dirname.
// On parse .env manuellement pour éviter ce piège quand le serveur
// est lancé depuis la racine du projet (ex: `node backend/serveur.js`).
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf-8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcrypt");

const app = express();
const port = 3080;

// ═══════════════════════════════════════════════════════════
// CACHE MÉTÉO (prévisions 7 jours)
// On stocke les prévisions sur disque pour ne pas rappeler
// Open-Meteo tant que le dernier jour couvert est dans le futur.
// ═══════════════════════════════════════════════════════════

let cachedWeather = null;
let needDailyRefresh = true;

try {
  const rawData = fs.readFileSync("data/weatherData7Days.json", "utf-8");
  cachedWeather = JSON.parse(rawData);

  const lastForecastDate = cachedWeather.time[6];
  const today = new Date().toISOString().split("T")[0];

  if (lastForecastDate >= today) {
    needDailyRefresh = false;
    console.log("Forecast data still accurate");
  } else {
    console.log("Forecast data outdated, fetching new data next request");
  }

  console.log("Last forecast date:", lastForecastDate);
  console.log("Today:", today);
  console.log("Need daily refresh:", needDailyRefresh);
} catch (error) {
  console.log(error);
  console.log("No cache file found, daily data will be fetched.");
}

app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════
// CACHE PLAYLIST (YouTube + Spotify) — Deux niveaux
//
// Problème : les quotas API sont limités (YouTube: 10k unités/jour,
// Spotify: rate limit). Un même mood génère les mêmes résultats
// pour tous les utilisateurs → on mutualise.
//
// Fichier JSON :   persistant, rechargé au boot.
// Expiration : journalière. À minuit les entrées deviennent obsolètes
// et un nouveau set de résultats sera généré au premier appel.
// ═══════════════════════════════════════════════════════════

const memoryCache = new Map();
const PLAYLIST_CACHE_FILE = path.join(__dirname, "data", "playlistCache.json");

let diskCache = {};
try {
  if (fs.existsSync(PLAYLIST_CACHE_FILE)) {
    diskCache = JSON.parse(fs.readFileSync(PLAYLIST_CACHE_FILE, "utf-8"));
    const today = new Date().toISOString().split("T")[0];

    let cleaned = 0;
    for (const key of Object.keys(diskCache)) {
      if (diskCache[key].date !== today) {
        delete diskCache[key];
        cleaned++;
      }
    }

    const remaining = Object.keys(diskCache).length;
    if (cleaned > 0) saveDiskCache();
    console.log(`Playlist cache loaded: ${remaining} valid entries (${cleaned} expired removed)`);
  }
} catch (err) {
  console.log("No playlist cache found, starting fresh.");
  diskCache = {};
}

function saveDiskCache() {
  try {
    const dir = path.dirname(PLAYLIST_CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PLAYLIST_CACHE_FILE, JSON.stringify(diskCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save playlist cache:", err.message);
  }
}

function getCachedOrNull(key) {
  const today = new Date().toISOString().split("T")[0];

  const memEntry = memoryCache.get(key);
  if (memEntry && memEntry.date === today) return memEntry.data;
  if (memEntry) memoryCache.delete(key);

  // Fallback disque — si trouvé, on le "promeut" en mémoire
  // pour que les accès suivants soient instantanés
  const diskEntry = diskCache[key];
  if (diskEntry && diskEntry.date === today) {
    memoryCache.set(key, diskEntry);
    return diskEntry.data;
  }
  if (diskEntry) delete diskCache[key];

  return null;
}

function setCache(key, data) {
  const today = new Date().toISOString().split("T")[0];
  const entry = { date: today, data };

  memoryCache.set(key, entry);
  diskCache[key] = entry;
  saveDiskCache();
}

function normalizeSpotifyPlaylists(playlists) {
  if (!Array.isArray(playlists)) return [];

  return playlists
    .filter((item) => item && item.playlistId)
    .map((item) => ({
      ...item,
      spotifyUrl: item.spotifyUrl || `https://open.spotify.com/playlist/${item.playlistId}`,
      title: item.title || "Untitled playlist",
      owner: item.owner || "Spotify",
      trackCount: Number.isFinite(item.trackCount) ? item.trackCount : 0,
      description: item.description || "",
      thumbnail: item.thumbnail || "",
    }));
}

// ═══════════════════════════════════════════════════════════
// ROUTE MÉTÉO — Proxy vers Open-Meteo
// On proxie pour : (1) éviter les problèmes CORS du client,
// (2) cacher les données météo 7 jours sur disque,
// (3) ne demander les prévisions daily que si elles sont périmées.
// ═══════════════════════════════════════════════════════════

app.get("/weather", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }

    let url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto";

    // On ajoute les données daily uniquement si le cache 7 jours est périmé
    if (needDailyRefresh)
      url += "&daily=weather_code,temperature_2m_mean,wind_speed_10m_mean,precipitation_probability_mean,cloud_cover_mean,relative_humidity_2m_mean";

    console.log("Fetching from:", url);
    const response = await axios.get(url);
    console.log("Response received:", response.data);

    if (response.data && response.data.current) {
      const current = response.data.current;
      let daily = null;
      if (needDailyRefresh) daily = response.data.daily;

      res.json({
        temperature: current.temperature_2m,
        weatherCode: current.weather_code,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
      });

      fs.writeFileSync("data/weatherDataCurrent.json", JSON.stringify(current, null, 2), "utf-8");
      if (needDailyRefresh) {
        fs.writeFileSync("data/weatherData7Days.json", JSON.stringify(daily, null, 2), "utf-8");
        needDailyRefresh = false;
      }
    } else {
      console.error("Invalid response structure:", response.data);
      res.status(400).json({ error: "Invalid response from weather API" });
    }
  } catch (error) {
    console.error("Weather API error:", error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// ═══════════════════════════════════════════════════════════
// YOUTUBE — Recherche de vidéos musicales
// Coût API : 100 unités/recherche (quota 10k/jour).
// Le cache journalier est critique ici : sans lui, 100 utilisateurs
// par jour = 10 000 unités = quota épuisé.
// ═══════════════════════════════════════════════════════════

app.get("/youtube/search", async (req, res) => {
  try {
    const { mood } = req.query;

    if (!mood) {
      return res.status(400).json({ error: "Missing mood parameter" });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || apiKey === "VOTRE_CLE_API_YOUTUBE") {
      return res.status(500).json({ error: "YouTube API key not configured" });
    }

    const cacheKey = `search:${mood}`;
    const cached = getCachedOrNull(cacheKey);
    if (cached) {
      console.log("YouTube search cache hit:", mood);
      return res.json(cached);
    }

    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: `${mood} music`,
        type: "video",
        videoCategoryId: "10", // Catégorie "Music" de YouTube
        maxResults: 25,
        key: apiKey,
      },
    });

    const tracks = response.data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    }));

    setCache(cacheKey, tracks);
    console.log(`YouTube search: ${tracks.length} tracks for "${mood}"`);
    res.json(tracks);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const ytError = error.response.data?.error;
      console.error("YouTube API error:", status, ytError?.message);

      if (status === 403) {
        return res.status(403).json({
          error: "YouTube API quota exceeded or access forbidden",
          details: ytError?.message,
        });
      }
      return res.status(status).json({ error: ytError?.message || "YouTube API error" });
    }
    console.error("YouTube search error:", error.message);
    res.status(500).json({ error: "Failed to search YouTube" });
  }
});

// ═══════════════════════════════════════════════════════════
// YOUTUBE — Création de playlist
// Nécessite OAuth 2.0 (le token est passé par le client).
// En production : implémenter le flow OAuth complet côté backend
// (Google Cloud Console, redirect URI, refresh tokens).
// ═══════════════════════════════════════════════════════════

app.post("/youtube/playlist", async (req, res) => {
  try {
    const { title, trackIds } = req.body;

    if (!title || !trackIds || !Array.isArray(trackIds) || !trackIds.length) {
      return res.status(400).json({ error: "Missing title or trackIds (non-empty array)" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "OAuth token required. Send Authorization: Bearer <token>" });
    }

    const headers = { Authorization: authHeader };
    const apiBase = "https://www.googleapis.com/youtube/v3";

    const playlistRes = await axios.post(
      `${apiBase}/playlists`,
      {
        snippet: { title, description: "Playlist générée par SkyBeat" },
        status: { privacyStatus: "private" },
      },
      { params: { part: "snippet,status" }, headers }
    );

    const playlistId = playlistRes.data.id;

    // Ajout séquentiel : l'API YouTube n'a pas de batch endpoint
    // pour playlistItems, chaque track nécessite un appel séparé
    const errors = [];
    for (const videoId of trackIds) {
      try {
        await axios.post(
          `${apiBase}/playlistItems`,
          { snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } } },
          { params: { part: "snippet" }, headers }
        );
      } catch (err) {
        console.error(`Failed to add video ${videoId}:`, err.message);
        errors.push(videoId);
      }
    }

    const result = {
      playlistId,
      playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
    };

    if (errors.length) {
      result.warnings = `${errors.length} track(s) failed to add`;
    }

    console.log(`Playlist created: ${playlistId} (${trackIds.length - errors.length}/${trackIds.length} tracks)`);
    res.json(result);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const ytError = error.response.data?.error;
      console.error("YouTube playlist error:", status, ytError?.message);
      return res.status(status).json({ error: ytError?.message || "YouTube API error" });
    }
    console.error("Playlist creation error:", error.message);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

// ═══════════════════════════════════════════════════════════
// SPOTIFY — Authentification
//
// Deux flows distincts :
// • Client Credentials : pour la recherche (pas besoin de compte user).
//   Le token est caché en mémoire ~55min (1h - 5min de marge).
// • Authorization Code : pour créer des playlists (besoin du compte user).
//   Le flow passe par /spotify/login → Spotify → /callback → frontend.
// ═══════════════════════════════════════════════════════════

let spotifyAccessToken = null;
let spotifyTokenExpiry = 0;

// Tokens par utilisateur — en prod, utiliser des sessions sécurisées
// (ex: Redis + cookies HttpOnly) au lieu d'une Map en mémoire.
const userTokens = new Map();

const SPOTIFY_MAX_RETRIES = 2;
const SPOTIFY_MAX_RETRY_DELAY_MS = 10000;

function parseRetryAfterMs(retryAfterHeader) {
  if (!retryAfterHeader) return null;

  const seconds = Number(retryAfterHeader);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, SPOTIFY_MAX_RETRY_DELAY_MS);
  }

  const dateMs = Date.parse(retryAfterHeader);
  if (!Number.isNaN(dateMs)) {
    return Math.min(Math.max(0, dateMs - Date.now()), SPOTIFY_MAX_RETRY_DELAY_MS);
  }

  return null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function spotifyRequestWithRetry(requestFn, label) {
  let attempt = 0;

  while (true) {
    try {
      return await requestFn();
    } catch (error) {
      const status = error.response?.status;
      const retryAfterHeader = error.response?.headers?.["retry-after"];
      const retryAfterMs = parseRetryAfterMs(retryAfterHeader);

      if (status !== 429 || attempt >= SPOTIFY_MAX_RETRIES) {
        throw error;
      }

      const backoffMs = Math.min(1000 * 2 ** attempt, SPOTIFY_MAX_RETRY_DELAY_MS);
      const delayMs = retryAfterMs ?? backoffMs;
      attempt += 1;

      console.warn(`Spotify rate limited on ${label}. Retry ${attempt}/${SPOTIFY_MAX_RETRIES} in ${delayMs}ms`);
      await wait(delayMs);
    }
  }
}

async function getSpotifyAccessToken() {
  if (spotifyAccessToken && Date.now() < spotifyTokenExpiry) {
    return spotifyAccessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  // Basic auth = base64(clientId:clientSecret), requis par le flow Client Credentials
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await spotifyRequestWithRetry(
    () => axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    ),
    "client_credentials_token"
  );

  spotifyAccessToken = response.data.access_token;
  // Marge de 5 minutes pour éviter les requêtes avec un token expiré
  // entre le moment où on vérifie et le moment où Spotify le reçoit
  spotifyTokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

  console.log("Spotify access token obtained, expires in", response.data.expires_in, "seconds");
  return spotifyAccessToken;
}

// ═══════════════════════════════════════════════════════════
// SPOTIFY — OAuth (Authorization Code Flow)
// /spotify/login → redirige vers Spotify → /callback → frontend
// ═══════════════════════════════════════════════════════════

app.get("/spotify/login", (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3080/callback";

  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-modify-public",
    "playlist-modify-private",
  ].join(" ");

  const authUrl =
    `https://accounts.spotify.com/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}`;

  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`http://localhost:4200/login?error=${error}`);
  }

  if (!code) {
    return res.redirect("http://localhost:4200/login?error=no_code");
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3080/callback";

    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Échanger le code d'autorisation contre un access + refresh token
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          Authorization: `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Token ID aléatoire — sert de "clé de session" côté frontend.
    // ⚠️ En prod, préférer un vrai système de sessions (JWT, cookies HttpOnly, etc.)
    const tokenId = Math.random().toString(36).substring(7);
    userTokens.set(tokenId, {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + expires_in * 1000,
    });

    console.log("Spotify OAuth successful, token ID:", tokenId);
    res.redirect(`http://localhost:4200/login?spotify_token=${tokenId}&success=true`);
  } catch (error) {
    console.error("Spotify OAuth error:", error.response?.data || error.message);
    res.redirect("http://localhost:4200/login?error=auth_failed");
  }
});

// ═══════════════════════════════════════════════════════════
// SPOTIFY — Profil utilisateur
// ═══════════════════════════════════════════════════════════

app.get("/spotify/me", async (req, res) => {
  const tokenId = req.query.token_id;

  if (!tokenId) {
    return res.status(401).json({ error: "Missing token_id" });
  }

  const tokenData = userTokens.get(tokenId);
  if (!tokenData) {
    return res.status(401).json({ error: "Invalid token_id" });
  }

  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.accessToken}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Spotify /me error:", error.response?.data);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

// ═══════════════════════════════════════════════════════════
// SPOTIFY — Recherche de tracks
// Même logique de cache que YouTube : un mood = un résultat
// identique pour tous les utilisateurs → on mutualise.
// ═══════════════════════════════════════════════════════════

app.get("/spotify/search", async (req, res) => {
  try {
    const { mood } = req.query;

    if (!mood) {
      return res.status(400).json({ error: "Missing mood parameter" });
    }

    const cacheKey = `spotify:${mood}`;
    const cached = getCachedOrNull(cacheKey);
    if (cached) {
      console.log("Spotify search cache hit:", mood);
      const normalizedCached = normalizeSpotifyPlaylists(cached);
      return res.json(normalizedCached);
    }

    const accessToken = await getSpotifyAccessToken();

    const searchParams = new URLSearchParams({
      q: String(mood),
      type: "playlist",
      limit: "10"
    });
    const url = `https://api.spotify.com/v1/search?${searchParams.toString()}`;
    console.log("Spotify search URL:", url);

    const response = await spotifyRequestWithRetry(
      () => axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      "search_playlists"
    );

    // On ne garde que les champs utiles pour le frontend
    // (la réponse brute Spotify fait ~50 champs par track) avec les playlists
    const playlists = response.data.playlists.items
      .filter((item) => item && item.id)
      .map((item) => ({
      playlistId: item.id,
      title: item.name || "Untitled playlist",
      owner: item.owner?.display_name || "Spotify",
      trackCount: item.tracks?.total ?? 0,
      thumbnail:
        item.images[0]?.url || "",
      description: item.description || "",
      spotifyUrl: item.external_urls?.spotify || `https://open.spotify.com/playlist/${item.id}`,
      }));

    const normalizedPlaylists = normalizeSpotifyPlaylists(playlists);

    setCache(cacheKey, normalizedPlaylists);
    console.log(`Spotify search: ${normalizedPlaylists.length} playlists for "${mood}"`);
    res.json(normalizedPlaylists);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const spotifyError = error.response.data?.error;
      console.error("Spotify API error:", status, spotifyError?.message);

      if (status === 401) {
        // Token expiré ou révoqué — on force le renouvellement au prochain appel
        spotifyAccessToken = null;
        spotifyTokenExpiry = 0;
        return res.status(401).json({
          error: "Spotify authentication failed",
          details: spotifyError?.message,
        });
      }
      if (status === 429) {
        const retryAfterSeconds = Number(error.response.headers?.["retry-after"]);
        return res.status(429).json({
          error: "Spotify rate limit exceeded",
          details: spotifyError?.message,
          retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
        });
      }
      return res.status(status).json({ error: spotifyError?.message || "Spotify API error" });
    }
    console.error("Spotify search error:", error.message);
    res.status(500).json({ error: "Failed to search Spotify" });
  }
});

// ═══════════════════════════════════════════════════════════
// SPOTIFY — Création de playlist
// Nécessite un token utilisateur (Authorization Code Flow),
// pas le token Client Credentials utilisé pour la recherche.
// L'API Spotify accepte jusqu'à 100 tracks par requête POST,
// on découpe donc en chunks si nécessaire.
// ═══════════════════════════════════════════════════════════

app.post("/spotify/playlist", async (req, res) => {
  try {
    const { title, trackIds } = req.body;

    if (!title || !trackIds || !Array.isArray(trackIds) || !trackIds.length) {
      return res.status(400).json({ error: "Missing title or trackIds (non-empty array)" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "OAuth token required. Send Authorization: Bearer <token>" });
    }

    const headers = { Authorization: authHeader };
    const apiBase = "https://api.spotify.com/v1";

    // L'ID utilisateur est nécessaire pour l'endpoint de création de playlist
    const userRes = await spotifyRequestWithRetry(
      () => axios.get(`${apiBase}/me`, { headers }),
      "get_user_profile"
    );
    const userId = userRes.data.id;

    const playlistRes = await spotifyRequestWithRetry(
      () => axios.post(
        `${apiBase}/users/${userId}/playlists`,
        { name: title, description: "Playlist générée par SkyBeat", public: false },
        { headers }
      ),
      "create_playlist"
    );

    const playlistId = playlistRes.data.id;

    // Convertir les IDs en URIs Spotify (format requis par l'API)
    const trackUris = trackIds.map((id) => `spotify:track:${id}`);
    const errors = [];

    for (let i = 0; i < trackUris.length; i += 100) {
      const chunk = trackUris.slice(i, i + 100);
      try {
        await spotifyRequestWithRetry(
          () => axios.post(`${apiBase}/playlists/${playlistId}/tracks`, { uris: chunk }, { headers }),
          `add_tracks_chunk_${i}_${i + chunk.length}`
        );
      } catch (err) {
        console.error(`Failed to add tracks chunk ${i}-${i + chunk.length}:`, err.message);
        errors.push(...chunk);
      }
    }

    const result = {
      playlistId,
      playlistUrl: playlistRes.data.external_urls.spotify,
    };

    if (errors.length) {
      result.warnings = `${errors.length} track(s) failed to add`;
    }

    console.log(`Spotify playlist created: ${playlistId} (${trackIds.length - errors.length}/${trackIds.length} tracks)`);
    res.json(result);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const spotifyError = error.response.data?.error;
      console.error("Spotify playlist error:", status, spotifyError?.message);
      if (status === 429) {
        const retryAfterSeconds = Number(error.response.headers?.["retry-after"]);
        return res.status(429).json({
          error: "Spotify rate limit exceeded",
          details: spotifyError?.message,
          retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
        });
      }
      return res.status(status).json({ error: spotifyError?.message || "Spotify API error" });
    }
    console.error("Spotify playlist creation error:", error.message);
    res.status(500).json({ error: "Failed to create Spotify playlist" });
  }
});

const USERS_FILE = "data/users.json";
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);

// --- Fonction utilitaire pour lire les users ---
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, "utf-8");
  return JSON.parse(data);
}

// --- Fonction utilitaire pour sauvegarder ---
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

// --- ROUTE SIGNUP ---
app.post("/accounts/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    let users = readUsers();

    const existingUser = users.find(user => user.email === email);

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = {
      id: Date.now(),
      username,
      email,
      password: hashedPassword
    };

    users.push(newUser);

    saveUsers(users);

    res.json({
      message: "User created",
      user: {
        id: newUser.id,
        username,
        email
      }
    });

  } catch (error) {

    console.error("Signup error:", error.message);
    res.status(500).json({ error: "Signup failed" });

  }
});



// --- ROUTE SIGNIN ---
app.post("/accounts/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const users = readUsers();

    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {

    console.error("Signin error:", error.message);
    res.status(500).json({ error: "Signin failed" });

  }
});

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
