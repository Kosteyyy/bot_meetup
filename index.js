const { default: axios } = require("axios");
require("dotenv").config();
const EventEmitter = require("events");
const {
  getCurrentWeather,
  getWeatherForecast,
  getLatLon,
} = require("./service");
// const { BOT_TOKEN } = require("./constants");
const { Telegraf } = require("telegraf");

console.log(process.env.BOT_TOKEN, process.env.WEATHER_API_KEY);

// Эмиттер событий (используем при обнаружении дождя)
const emitter = new EventEmitter();
const bot = new Telegraf(process.env.BOT_TOKEN);

// ----------------------- Обрабатываем команду боту /rain {city} -------------------------------
// по этой команде бот наблюдает за погодой в {city} и при обнаружении в прогнозе дождя - сигналит в телеграм

const REQUEST_INTERVAL = 3600000; // Интервал запроса в мс - в продакшене час примерно
// предельное количество запросов к серверу при котором прекращаем следить за городом.
// технический параметр, просто чтобы не крутить опросы постоянно а они сами заканчивались
const MAX_REQUEST_COUNT = 40;
let rainListenCities = []; // список городов, в которых наблюдаем будет ли дождь

// обработчик события 'rain' при обнаружении дождя проверяет, его ли это город и если да, пишет всем подписанным пользователям
function handleRain(event, ctx, city) {
  if (event.city === city) {
    ctx.reply("Дождь через час в " + city);
    console.log("Rain coming!!! ", city);
  }
}

//При получении команды '/rain {город}' бот отслеживает дождь в данном городе
bot.command("rain", async (ctx) => {
  //Разбиваем текст на 2 слова, второе - город. Если нет - Москва
  let city = ctx.message.text.split(" ")[1] || "Moscow";
  function watchRain(event) {
    handleRain(event, ctx, city);
  }
  // Добавляем листенер дождя
  // emitter.on("rain", (event) => {
  //   handleRain(event, ctx, city);
  // });
  emitter.on("rain", watchRain);
  ctx.reply("Наблюдаю в " + city);

  // Если город ещё не в списке наблюдаемых, добавляем и запускаем интервальный опрос сервера погоды
  // Если город уже наблюдается, то просто слушаем событие 'rain'
  if (rainListenCities.indexOf(city) < 0) {
    rainListenCities.push(city);

    let latLon = await getLatLon(city);

    let counter = 0;
    let timerId = setTimeout(async function checkWeather() {
      counter++;

      let weather = await getWeatherForecast(latLon);
      let forcast = weather.data.hourly[1].weather[0].main;

      if (forcast === "Rain") {
        emitter.emit("rain", { city: city });
      }
      // при счётчике 3 генерируем событие 'rain' в демо целях, все подписанные пользователи получат уведомление
      if (counter === 3) {
        console.log("bingo");
        emitter.emit("rain", { city: "Moscow" }); // Уведомление получат только подписчики "Moscow"
        setTimeout(checkWeather, REQUEST_INTERVAL * 3); // Когда мы получили что будет дождь можем увеличить один раз интервал опроса сервера (просто опция, можно оставить такую же)
      } else {
        if (counter > MAX_REQUEST_COUNT) {
          emitter.removeListener("rain", watchRain);
          rainListenCities = rainListenCities.filter((c) => c !== city);
          return;
        }
        timerId = setTimeout(checkWeather, REQUEST_INTERVAL);
      }
    });
  }
  console.log("command recieved", city);
});

// -----------------------------------Если бот получает простой текст-------------------------------------------
// При получении текста воспринимаем его как город и возвращаем погоду. В случае белиберды/неправильного города
// отлавливаем ошибку и выводим в консоль
bot.on("text", async function (ctx) {
  let city = ctx.message.text;
  try {
    let weather = await getCurrentWeather(city);
    ctx.reply(
      `${weather.data.name} : ${weather.data.main.temp} C, ${weather.data.weather[0].main}: ${weather.data.weather[0].description}`
    );
  } catch (error) {
    console.log(error.message);
  }

  // axios
  //   .get("https://api.openweathermap.org/data/2.5/weather", {
  //     params: {
  //       q: ctx.message.text,
  //       appid: "e6063dfa277992718fc12b200d25313f",
  //       units: "metric",
  //     },
  //   })
  //   .then((res) =>
  //     ctx.reply(
  //       `${res.data.name} : ${res.data.main.temp} C, ${res.data.weather[0].main}: ${res.data.weather[0].description}`
  //     )
  //   )
  //   .catch((error) => ctx.reply("не понял"));
  // `https://api.openweathermap.org/data/2.5/weather?q=${ctx.message.text}&appid=e6063dfa277992718fc12b200d25313f&units=metric`
  // console.log("text получен " + ctx.message.text);
});

bot.launch();
console.log("Бот запущен");
