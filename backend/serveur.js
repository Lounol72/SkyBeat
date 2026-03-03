const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 3080;

app.use(cors());

app.get("/weather", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }

    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m" +
      "&timezone=auto";

    console.log("Fetching from:", url);
    const response = await axios.get(url);
    console.log("Response received:", response.data);

    if (response.data && response.data.current) {
      const current = response.data.current;
      res.json({
        temperature: current.temperature_2m,
        weatherCode: current.weather_code,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
      });
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