const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");

const app = express();
const port = 3080;

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
  }
  else{
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
    console.error("Full error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

app.listen(port, () => {
  console.log("Server is running on port " + port);
});