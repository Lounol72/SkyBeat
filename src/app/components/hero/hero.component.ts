import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

// Weather condition mapping based on WMO weather codes
const WEATHER_CONDITIONS: { [key: number]: { name: string; icon: string } } = {
  0: { name: 'Clear sky', icon: '☀️' },
  1: { name: 'Mainly clear', icon: '🌤️' },
  2: { name: 'Partly cloudy', icon: '⛅' },
  3: { name: 'Overcast', icon: '☁️' },
  45: { name: 'Foggy', icon: '🌫️' },
  48: { name: 'Depositing rime fog', icon: '🌫️' },
  51: { name: 'Light drizzle', icon: '🌦️' },
  53: { name: 'Moderate drizzle', icon: '🌦️' },
  55: { name: 'Dense drizzle', icon: '🌦️' },
  56: { name: 'Light freezing drizzle', icon: '🌨️' },
  57: { name: 'Dense freezing drizzle', icon: '🌨️' },
  61: { name: 'Slight rain', icon: '🌧️' },
  63: { name: 'Moderate rain', icon: '🌧️' },
  65: { name: 'Heavy rain', icon: '🌧️' },
  66: { name: 'Light freezing rain', icon: '🌨️' },
  67: { name: 'Heavy freezing rain', icon: '🌨️' },
  71: { name: 'Slight snow', icon: '❄️' },
  73: { name: 'Moderate snow', icon: '❄️' },
  75: { name: 'Heavy snow', icon: '❄️' },
  77: { name: 'Snow grains', icon: '❄️' },
  80: { name: 'Slight rain showers', icon: '🌦️' },
  81: { name: 'Moderate rain showers', icon: '🌦️' },
  82: { name: 'Violent rain showers', icon: '⛈️' },
  85: { name: 'Slight snow showers', icon: '🌨️' },
  86: { name: 'Heavy snow showers', icon: '🌨️' },
  95: { name: 'Thunderstorm', icon: '⛈️' },
  96: { name: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { name: 'Thunderstorm with heavy hail', icon: '⛈️' },
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

    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      '&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m' +
      '&timezone=auto';

    this.http.get<any>(url).subscribe({
      next: (response) => {
        if (response.current) {
          const current = response.current;
          this.weatherData.set({
            temperature: current.temperature_2m,
            weatherCode: current.weather_code,
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            location: this.locationName(),
          });
          this.isLoadingWeather.set(false);

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
}
