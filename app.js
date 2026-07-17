// Находим все нужные элементы на HTML-странице
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const wind = document.getElementById('wind');

// Вешаем событие клика на кнопку поиска
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city !== '') {
        getCoordinates(city);
    }
});

// Шаг 1: Получаем координаты города по его названию
async function getCoordinates(city) {
    try {
        description.innerText = "Ищем город...";
        
        // Летим в бесплатное геокодирование Open-Meteo
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=ru&format=json`;
        const response = await fetch(geoUrl);
        const data = await response.json();

        // Проверяем, нашел ли сервер такой город
        if (!data.results || data.results.length === 0) {
            description.innerText = "Город не найден. Попробуйте на английском.";
            return;
        }

        // Забираем координаты и правильное название города
        const lat = data.results[0].latitude;
        const lon = data.results[0].longitude;
        const correctName = data.results[0].name;

        cityName.innerText = correctName;

        // Передаем координаты в функцию получения погоды
        getWeather(lat, lon);

    } catch (error) {
        description.innerText = "Ошибка при поиске города.";
        console.error(error);
    }
}

// Шаг 2: Получаем реальную погоду по координатам
async function getWeather(lat, lon) {
    try {
        description.innerText = "Загружаем погоду...";

        // Запрашиваем данные погоды
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const response = await fetch(weatherUrl);
        const data = await response.json();

        // Достаем из ответа сервера температуру и ветер
        const currentTemp = Math.round(data.current_weather.temperature);
        const windSpeed = data.current_weather.windspeed;
        
        // Меняем текст прямо на нашей HTML странице!
        temperature.innerText = currentTemp;
        wind.innerText = windSpeed;
        description.innerText = "Данные обновлены прямо сейчас";

    } catch (error) {
        description.innerText = "Ошибка при получении погоды.";
        console.error(error);
    }
}
