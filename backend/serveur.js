const path = require("path");
const fs = require("fs");

// Charger .env manuellement (évite les problèmes de cwd avec dotenv v17)
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf-8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}
console.log("YOUTUBE_API_KEY:", process.env.YOUTUBE_API_KEY ? "loaded" : "MISSING");

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 3080;

let cachedWeather = null;
let needDailyRefresh = true;

try {
  const rawData = fs.readFileSync("data/weatherData7Days.json", "utf-8");
  cachedWeather = JSON.parse(rawData);

  if (cachedWeather.daily && cachedWeather.daily.time) {
    const lastForecastDate = cachedWeather.daily.time[6];

    const today = new Date().toISOString().split("T")[0];

    if (lastForecastDate >= today) {
      needDailyRefresh = false;
    }

    console.log("Last forecast date:", lastForecastDate);
    console.log("Today:", today);
    console.log("Need daily refresh:", needDailyRefresh);
  }
} catch (error) {
  console.log("No cache file found, daily data will be fetched.");
}

app.use(cors());
app.use(express.json());

// --- Cache YouTube avec TTL de 12 heure ---
const youtubeCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000 * 12;

function getCachedOrNull(key) {
  const entry = youtubeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    youtubeCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  youtubeCache.set(key, { data, timestamp: Date.now() });
}

// --- Route météo (Open-Meteo) ---
app.get("/weather", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }

    let url = "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto";

    if(needDailyRefresh) url += "&daily=weather_code,temperature_2m_mean,wind_speed_10m_mean,precipitation_probability_mean,cloud_cover_mean,relative_humidity_2m_mean";

    console.log("Fetching from:", url);
    const response = await axios.get(url);
    console.log("Response received:", response.data);

    if (response.data && response.data.current) {
      const current = response.data.current;
      let daily = null;
      if(needDailyRefresh) daily = response.data.daily;

      res.json({
        temperature: current.temperature_2m,
        weatherCode: current.weather_code,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
      });

      fs.writeFileSync("data/weatherDataCurrent.json",JSON.stringify(current,null,2),"utf-8");
      if(needDailyRefresh){
        fs.writeFileSync("data/weatherData7Days.json",JSON.stringify(daily,null,2),"utf-8");
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

// --- Route recherche YouTube ---
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

    // Vérifier le cache avant d'appeler l'API
    const cacheKey = `search:${mood}`;
    const cached = getCachedOrNull(cacheKey);
    if (cached) {
      console.log("YouTube search cache hit:", mood);
      return res.json(cached);
    }

    const url = "https://www.googleapis.com/youtube/v3/search";
    const response = await axios.get(url, {
      params: {
        part: "snippet",
        q: `${mood} music`,
        type: "video",
        videoCategoryId: "10",
        maxResults: 25,
        key: apiKey,
      },
    });

    // Transformer la réponse brute en format propre
    const tracks = response.data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url,
    }));

    setCache(cacheKey, tracks);
    console.log(`YouTube search: ${tracks.length} tracks for "${mood}"`);
    res.json(tracks);
  } catch (error) {
    // Gestion spécifique des erreurs YouTube (quota, clé invalide, etc.)
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
      return res
        .status(status)
        .json({ error: ytError?.message || "YouTube API error" });
    }
    console.error("YouTube search error:", error.message);
    res.status(500).json({ error: "Failed to search YouTube" });
  }
});

// --- Route création playlist YouTube ---
// NOTE : Cette route nécessite un token OAuth 2.0 utilisateur.
// Pour le MVP, le token doit être passé dans le header Authorization.
// En production, implémenter le flow OAuth complet (Google Cloud Console,
// redirect URI, refresh tokens, etc.)
app.post("/youtube/playlist", async (req, res) => {
  try {
    const { title, trackIds } = req.body;

    if (!title || !trackIds || !Array.isArray(trackIds) || !trackIds.length) {
      return res
        .status(400)
        .json({ error: "Missing title or trackIds (non-empty array)" });
    }

    // Le token OAuth doit être fourni par le client
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: "OAuth token required. Send Authorization: Bearer <token>",
      });
    }

    const headers = { Authorization: authHeader };
    const apiBase = "https://www.googleapis.com/youtube/v3";

    // Étape 1 : Créer la playlist
    const playlistRes = await axios.post(
      `${apiBase}/playlists`,
      {
        snippet: { title, description: `Playlist générée par SkyBeat` },
        status: { privacyStatus: "private" },
      },
      { params: { part: "snippet,status" }, headers }
    );

    const playlistId = playlistRes.data.id;

    // Étape 2 : Ajouter chaque track à la playlist
    const errors = [];
    for (const videoId of trackIds) {
      try {
        await axios.post(
          `${apiBase}/playlistItems`,
          {
            snippet: {
              playlistId,
              resourceId: { kind: "youtube#video", videoId },
            },
          },
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
      return res
        .status(status)
        .json({ error: ytError?.message || "YouTube API error" });
    }
    console.error("Playlist creation error:", error.message);
    res.status(500).json({ error: "Failed to create playlist" });
  }
});

app.listen(port, () => {
  console.log("Server is running on port " + port);
});
