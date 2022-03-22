# Телеграм БОТ

Нужно создать .env файл с токенами:
WEATHER_API_KEY = Open Weather api key
BOT_TOKEN = Токен бота телеграм

старт => npm start (или node index.js);

нужно в constants.js изменить BOT_TOKEN на свой или стучаться к боту @Kosteyyy_first_bot

## Задание митапа по боту

при написании просто текста боту он воспринимает это как город и дает прогноз погоды. Если города нет или билиберда - ничего

## Добавленный функционал - оповещение о дожде

Оповещение основано на принципе подписки пользователей на событие, которое даёт бот.
Это позволяет при подписке 10 000 пользователей на прогноз дождя делать только один запрос на всех в API погоды.

Команда боту: **/rain {city}**. Если city не указан - Москва.
При получении запроса, если город уже есть в наблюдаемых, пользователь просто подписывается на событие 'rain' по этому городу.

Если города нет в наблюдаемых - город добавляется в список наблюдаемых (чтобы не заводить новые запросы);
При этом заводится периодический опрос по погоде в этом городе.
Опрос сделан в виде рекурсивных таймаутов, с тем чтобы при определенных событиях (например, узнали, что дождь - три часа не опрашиваем погоду по этому городу) интервал можно было менять на некоторое время.

Если в прогнозе погоды появился дождь, мы зажигаем событие 'rain' и все пользователи, подписанные на событие 'rain' и на этот город
получают через свой листенер уведомление.

Для демонстрации по счётчику сделано объявление события 'дождь' в Москве. При этом пользователи, подписанные на погоду в Лондоне, уведомление не получат, а подписанные на Москву получат.
