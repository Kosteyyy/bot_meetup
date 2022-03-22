const { default: axios } = require("axios");
require("dotenv").config();

// Возвращает текущую погоду для города
async function getCurrentWeather(city = "Moscow") {
  try {
    let data = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          q: city,
          appid: process.env.WEATHER_API_KEY,
          units: "metric",
        },
      }
    );
    return data;
  } catch (error) {
    console.log("error.message");
  }
}

// Возвращает прогноз погоды для города
async function getWeatherForecast(latLon) {
  try {
    let data = await axios.get(
      "https://api.openweathermap.org/data/2.5/onecall",
      {
        params: {
          lon: latLon.lon,
          lat: latLon.lat,
          appid: process.env.WEATHER_API_KEY,
          units: "metric",
          exclude: "current,minutely,daily",
        },
      }
    );
    return data;
  } catch (error) {
    console.log("error.message");
  }
}

// возвращает широту и долготу для города (кривым методом через запрос погоды)
async function getLatLon(city) {
  let res = await getCurrentWeather(city);
  return { lat: res.data.coord.lat, lon: res.data.coord.lon };
}

module.exports = { getCurrentWeather, getWeatherForecast, getLatLon };
