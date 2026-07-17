const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const weatherStatus = document.getElementById('weather-status');
const weatherEmoji = document.getElementById('weather-emoji');

const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const forecastContainer = document.getElementById('forecast-container');

// Справочник WMO кодов погоды: конвертируем цифры от сервера в эмодзи и текст
const weatherMap = {
    0: { text: 'Ясно', emoji: '☀️', theme: 'theme-sunny' },
    1: { text: 'Преимущественно ясно', emoji: '🌤️', theme: 'theme-sunny' },
    2: { text: 'Переменная облачность', emoji: '⛅', theme: 'theme-cloudy' },
    3: { text: 'Пасмурно', emoji: '☁️', theme: 'theme-cloudy' },
    45: { text: 'Туман', emoji: '🌫️', theme: 'theme-cloudy' },
    48: { text: 'Иней', emoji: '🌫️', theme: 'theme-cloudy' },
    51: { text: 'Легкая морось', emoji: '🌦️', theme: 'theme-rainy' },
    53: { text: 'Морось', emoji: '🌧️', theme: 'theme-rainy' },
    55: { text: 'Плотная морось', emoji: '🌧️', theme: 'theme-rainy' },
    61: { text: 'Слабый дождь', emoji: '🌦️', theme: 'theme-rainy' },
    63: { text: 'Дождь', emoji: '🌧️', theme: 'theme-rainy' },
    65: { text: 'Сильный дождь', emoji: '🌧️', theme: 'theme-rainy' },
    71: { text: 'Небольшой снег', emoji: '❄️', theme: 'theme-snowy' },
    73: { text: 'Снег', emoji: '❄️', theme: 'theme-snowy' },
    75: { text: 'Снегопад', emoji: '☃️', theme: 'theme-snowy' },
    80: { text: 'Слабый ливень', emoji: '🌧️', theme: 'theme-rainy' },
    81: { text: 'Ливневый дождь', emoji: '⛈️', theme: 'theme-rainy' },
    82: { text: 'Сильный ливень', emoji: '⛈️', theme: 'theme-rainy' },
    95: { text: 'Гроза', emoji: '⛈️', theme: 'theme-cloudy' }
};

searchBtn.addEventListener('click', performSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

function performSearch() {
    const city = cityInput.value.trim();
    if (city !== '') {
        getCoordinates(city);
    }
}

async function getCoordinates(city) {
    try {
        weatherStatus.innerText = "Сканирование атмосферы...";
        
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=ru&format=json`;
        const response = await fetch(geoUrl);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            weatherStatus.innerText = "Город не обнаружен";
            return;
        }

        const { latitude: lat, longitude: lon, name: correctName } = data.results[0];
        cityName.innerText = correctName;
        
        getWeatherData(lat, lon);
    } catch (error) {
        weatherStatus.innerText = "Ошибка геолокации";
    }
}

async function getWeatherData(lat, lon) {
    try {
        // Запрашиваем текущую погоду + расширенные метрики + ежедневный прогноз
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        const response = await fetch(url);
        const data = await response.json();

        updateCurrentWeather(data.current);
        updateForecast(data.daily);

    } catch (error) {
        weatherStatus.innerText = "Ошибка обновления данных";
    }
}

function updateCurrentWeather(current) {
    const code = current.weather_code;
    // Ищем расшифровку кода погоды, если кода нет в базе — ставим дефолт
    const info = weatherMap[code] || { text: 'Неизвестно', emoji: '🌍', theme: 'theme-cloudy' };

    // Сброс и запуск анимации обновления
    const mainBlock = document.querySelector('.main-weather');
    mainBlock.classList.remove('animate-fade');
    void mainBlock.offsetWidth; // Магия принудительного перезапуска CSS анимации
    mainBlock.classList.add('animate-fade');

    // Меняем тему фона приложения
    document.body.className = info.theme;

    // Вставляем данные на страницу
    temperature.innerText = Math.round(current.temperature_2m);
    weatherStatus.innerText = info.text;
    weatherEmoji.innerText = info.emoji;

    feelsLike.innerText = Math.round(current.apparent_temperature);
    humidity.innerText = current.relative_humidity_2m;
    wind.innerText = Math.round(current.wind_speed_10m);
}

function updateForecast(daily) {
    forecastContainer.innerHTML = ''; // Очищаем старый прогноз

    // Ограничиваем цикл тремя днями
    for (let i = 1; i <= 3; i++) {
        const dateStr = daily.time[i];
        // Красиво форматируем дату (получаем только день и месяц)
        const dateObj = new Date(dateStr);
        const formattedDate = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

        const code = daily.weather_code[i];
        const info = weatherMap[code] || { emoji: '✨' };
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);

        // Генерируем HTML код для карточки дня
        const dayHtml = `
            <div class="forecast-day" style="animation-delay: ${i * 0.1}s">
                <p class="date">${formattedDate}</p>
                <p class="icon">${info.emoji}</p>
                <p class="temp">${maxTemp}° / ${minTemp}°</p>
            </div>
        `;
        forecastContainer.innerHTML += dayHtml;
    }
}
