import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { YoutubeService } from '../../services/youtube.service';
import { SpotifyService } from '../../services/spotify.service';

// Weather condition mapping based on WMO weather codes
const WEATHER_CONDITIONS: { [key: number]: { name: string; icon: string } } = {
  0: { name: 'Cloud development not observed or not observable', icon: '🌤️' },
  1: { name: 'Clouds generally dissolving or becoming less developed', icon: '🌤️' },
  2: { name: 'State of sky unchanged', icon: '🌥️' },
  3: { name: 'Clouds generally forming or developing', icon: '☁️' },
  4: { name: 'Visibility reduced by smoke', icon: '🌫️' },
  5: { name: 'Haze', icon: '🌫️' },
  6: { name: 'Widespread dust in suspension', icon: '🌫️' },
  7: { name: 'Dust or sand raised by wind', icon: '🌪️' },
  8: { name: 'Well-developed dust or sand whirls', icon: '🌪️' },
  9: { name: 'Duststorm or sandstorm (weak)', icon: '🌪️' },
  10: { name: 'Mist', icon: '🌫️' },
  11: { name: 'Patches of shallow fog', icon: '🌫️' },
  12: { name: 'Continuous shallow fog', icon: '🌫️' },
  13: { name: 'Lightning visible, no thunder heard', icon: '🌩️' },
  14: { name: 'Precipitation within sight not reaching the ground', icon: '🌧️' },
  15: { name: 'Precipitation within sight (>5km)', icon: '🌧️' },
  16: { name: 'Precipitation within sight (nearby)', icon: '🌧️' },
  17: { name: 'Thunderstorm without precipitation', icon: '⛈️' },
  18: { name: 'Squalls', icon: '💨' },
  19: { name: 'Funnel cloud / tornado / waterspout', icon: '🌪️' },
  20: { name: 'Drizzle or snow grains (past hour)', icon: '🌨️' },
  21: { name: 'Rain (past hour)', icon: '🌧️' },
  22: { name: 'Snow (past hour)', icon: '❄️' },
  23: { name: 'Rain and snow (past hour)', icon: '🌨️' },
  24: { name: 'Freezing rain or drizzle (past hour)', icon: '🌨️' },
  25: { name: 'Showers (past hour)', icon: '🌦️' },
  26: { name: 'Ice pellets (past hour)', icon: '🧊' },
  27: { name: 'Hail (past hour)', icon: '🌨️' },
  28: { name: 'Fog (past hour)', icon: '🌫️' },
  29: { name: 'Thunderstorm (past hour)', icon: '⛈️' },
  30: { name: 'Slight or moderate duststorm', icon: '🌪️' },
  31: { name: 'Duststorm moderate', icon: '🌪️' },
  32: { name: 'Duststorm severe', icon: '🌪️' },
  33: { name: 'Duststorm decreasing', icon: '🌪️' },
  34: { name: 'Duststorm no change', icon: '🌪️' },
  35: { name: 'Duststorm increasing', icon: '🌪️' },
  36: { name: 'Slight drifting snow', icon: '❄️' },
  37: { name: 'Moderate drifting snow', icon: '❄️' },
  38: { name: 'Heavy drifting snow', icon: '❄️' },
  39: { name: 'Heavy drifting snow with storm', icon: '🌨️' },
  40: { name: 'Fog at a distance', icon: '🌫️' },
  41: { name: 'Fog in patches', icon: '🌫️' },
  42: { name: 'Fog thinning', icon: '🌫️' },
  43: { name: 'Fog thinning, sky visible', icon: '🌥️' },
  44: { name: 'Fog thinning, sky invisible', icon: '🌫️' },
  45: { name: 'Fog', icon: '🌫️' },
  46: { name: 'Freezing fog', icon: '🌫️' },
  47: { name: 'Dense fog', icon: '🌫️' },
  48: { name: 'Dense freezing fog', icon: '🌫️' },
  49: { name: 'Fog depositing rime', icon: '🌫️' },
  50: { name: 'Drizzle slight intermittent', icon: '🌦️' },
  51: { name: 'Drizzle slight continuous', icon: '🌦️' },
  52: { name: 'Drizzle moderate intermittent', icon: '🌦️' },
  53: { name: 'Drizzle moderate continuous', icon: '🌦️' },
  54: { name: 'Drizzle heavy intermittent', icon: '🌧️' },
  55: { name: 'Drizzle heavy continuous', icon: '🌧️' },
  56: { name: 'Freezing drizzle slight', icon: '🌨️' },
  57: { name: 'Freezing drizzle moderate or heavy', icon: '🌨️' },
  58: { name: 'Drizzle and rain slight', icon: '🌦️' },
  59: { name: 'Drizzle and rain moderate or heavy', icon: '🌧️' },
  60: { name: 'Rain slight intermittent', icon: '🌧️' },
  61: { name: 'Rain slight continuous', icon: '🌧️' },
  62: { name: 'Rain moderate intermittent', icon: '🌧️' },
  63: { name: 'Rain moderate continuous', icon: '🌧️' },
  64: { name: 'Rain heavy intermittent', icon: '🌧️' },
  65: { name: 'Rain heavy continuous', icon: '🌧️' },
  66: { name: 'Freezing rain slight', icon: '🌨️' },
  67: { name: 'Freezing rain moderate or heavy', icon: '🌨️' },
  68: { name: 'Rain and snow slight', icon: '🌨️' },
  69: { name: 'Rain and snow moderate or heavy', icon: '🌨️' },
  70: { name: 'Snow slight intermittent', icon: '❄️' },
  71: { name: 'Snow slight continuous', icon: '❄️' },
  72: { name: 'Snow moderate intermittent', icon: '❄️' },
  73: { name: 'Snow moderate continuous', icon: '❄️' },
  74: { name: 'Snow heavy intermittent', icon: '❄️' },
  75: { name: 'Snow heavy continuous', icon: '❄️' },
  76: { name: 'Diamond dust', icon: '❄️' },
  77: { name: 'Snow grains', icon: '❄️' },
  78: { name: 'Snow and rain slight', icon: '🌨️' },
  79: { name: 'Snow and rain moderate or heavy', icon: '🌨️' },
  80: { name: 'Rain showers slight', icon: '🌦️' },
  81: { name: 'Rain showers moderate', icon: '🌦️' },
  82: { name: 'Rain showers violent', icon: '⛈️' },
  83: { name: 'Rain and snow showers', icon: '🌨️' },
  84: { name: 'Snow showers', icon: '🌨️' },
  85: { name: 'Snow showers slight', icon: '🌨️' },
  86: { name: 'Snow showers heavy', icon: '🌨️' },
  87: { name: 'Showers of ice pellets', icon: '🧊' },
  88: { name: 'Hail showers slight', icon: '🌨️' },
  89: { name: 'Hail showers heavy', icon: '🌨️' },
  90: { name: 'Thunderstorm without precipitation', icon: '⛈️' },
  91: { name: 'Thunderstorm with slight rain', icon: '⛈️' },
  92: { name: 'Thunderstorm with moderate rain', icon: '⛈️' },
  93: { name: 'Thunderstorm with heavy rain', icon: '⛈️' },
  94: { name: 'Thunderstorm with hail', icon: '⛈️' },
  95: { name: 'Thunderstorm', icon: '⛈️' },
  96: { name: 'Thunderstorm with slight hail', icon: '⛈️' },
  97: { name: 'Thunderstorm with heavy hail', icon: '⛈️' },
  98: { name: 'Thunderstorm with duststorm', icon: '⛈️' },
  99: { name: 'Severe thunderstorm', icon: '⛈️' },
};

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  location: string;
}

interface WeatherLocalData {
  weather: WeatherData;
  fetchDate: number;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private youtubeService = inject(YoutubeService);
  private spotifyService = inject(SpotifyService);

  // Weather state
  weatherData = signal<WeatherData | null>(null);
  isLoadingWeather = signal<boolean>(false);
  weatherError = signal<string | null>(null);
  locationName = signal<string>('');

  // Default coordinates (Paris area)
  private defaultLatitude = 48.8566;
  private defaultLongitude = 2.3522;

  ngOnInit(): void {
    /**
     * CONST
     */
    const EXPIRATION_TIME = 1000 * 3600 //One hour

    if (isPlatformBrowser(this.platformId)) {
      const jsonData = localStorage.getItem("weatherData");
      if(jsonData){
        const data: WeatherLocalData = JSON.parse(jsonData);

        const isExpired = Date.now() - data.fetchDate > EXPIRATION_TIME;

        if(!isExpired){
          this.weatherData.set({
            temperature: data.weather.temperature,
            weatherCode: data.weather.weatherCode,
            humidity: data.weather.humidity,
            windSpeed: data.weather.windSpeed,
            location: data.weather.location
          });
          this.isLoadingWeather.set(false);
          // Précharger les tracks YouTube et playlists Spotify en arrière-plan
          this.youtubeService.preloadTracks(data.weather.weatherCode);
          this.spotifyService.preloadPlaylists(data.weather.weatherCode);
          console.log("Weather Data loaded from LocalStorage.")
        }
        else{
          console.log("Weather Data expired, fetching new data.")
          this.getUserLocation();
        }
      }
      else{
        console.log("Weather Data NOT loaded from LocalStorage !")
        this.getUserLocation();
      }
    }
  }

  /**
   * Attempts to get user's geolocation, falls back to default coordinates
   */
  private getUserLocation(): void {
    if (!navigator.geolocation) {
      // Geolocation not supported, use default location
      this.fetchWeatherData(this.defaultLatitude, this.defaultLongitude);
      this.locationName.set('Paris');
      return;
    }

    this.isLoadingWeather.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        this.fetchWeatherData(lat, lon);
        // For now, show coordinates. Could enhance with reverse geocoding later
        this.locationName.set(`${lat.toFixed(1)}°N, ${lon.toFixed(1)}°E`);
      },
      (error) => {
        // User denied permission or error occurred, use default location
        console.warn('Geolocation error:', error);
        this.fetchWeatherData(this.defaultLatitude, this.defaultLongitude);
        this.locationName.set('Paris');
      }
    );
  }

  /**
   * Fetches weather data from Open-Meteo API
   */
  private fetchWeatherData(latitude: number, longitude: number): void {
    this.isLoadingWeather.set(true);
    this.weatherError.set(null);
          const url = `http://localhost:3080/weather?latitude=${latitude}&longitude=${longitude}`;

    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response) {
          this.weatherData.set({
            temperature: response.temperature,
            weatherCode: response.weatherCode,
            humidity: response.humidity,
            windSpeed: response.windSpeed,
            location: this.locationName(),
          });

          this.isLoadingWeather.set(false);

          // Précharger les tracks YouTube et playlists Spotify en arrière-plan
          this.youtubeService.preloadTracks(response.weatherCode);
          this.spotifyService.preloadPlaylists(response.weatherCode);

          /**
           *  Saving weather data in LocalStorage
           */

          const toStore = {
            weather: this.weatherData(),
            fetchDate: Date.now()
          };

          localStorage.setItem("weatherData", JSON.stringify(toStore));
        } else {
          this.weatherError.set('Invalid response');
          this.isLoadingWeather.set(false);
        }
      },
      error: (err) => {
        console.error('Weather API error:', err);
        this.weatherError.set('Failed to load');
        this.isLoadingWeather.set(false);
      },
    });
  }

  /**
   * Get weather condition name and icon from weather code
   */
  getWeatherCondition(code: number): { name: string; icon: string } {
    return WEATHER_CONDITIONS[code] || { name: 'Unknown', icon: '🌤️' };
  }

  getWeatherColor(): string {
    const code = this.weatherData()?.weatherCode ?? 0;
    if (code === 0) return '#ffaa00'; // Soleil = Orange
    if (code > 0 && code < 50) return '#00d2ff'; // Nuage/Brume = Bleu ciel
    return '#ff4b2b'; // Pluie/Orage = Rouge/Rose
  }

  getWeatherTheme(): string {
  const code = this.weatherData()?.weatherCode ?? 0;
  if (code === 0) return 'theme-sunny';
  if (code >= 1 && code < 60) return 'theme-cloudy';
  return 'theme-rainy';
  }
}
