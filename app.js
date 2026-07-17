const DEFAULT_CITY = "Urganch";

// Словарь направлений ветра из градусов угла
function getWindDirection(deg) {
    const directions = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
    const val = Math.floor((deg / 22.5) + 0.5);
    return directions[val % 16];
}

// Конвертер кодов международной классификации WMO в текст и эмодзи
function parseWeatherCode(code) {
    if (code === 0) return { text: "Ясно / Солнечно", emoji: "☀️" };
    if ([1, 2, 3].includes(code)) return { text: "Переменная облачность", emoji: "⛅" };
    if ([45, 48].includes(code)) return { text: "Туманность", emoji: "🌫️" };
    if ([51, 53, 55, 80, 81, 82].includes(code)) return { text: "Ливневый дождь", emoji: "🌧️" };
    if ([71, 73, 75, 85, 86].includes(code)) return { text: "Снегопад", emoji: "❄️" };
    if ([95, 96, 99].includes(code)) return { text: "Гроза с градом", emoji: "⛈️" };
    return { text: "Ясно", emoji: "☀️" };
}

// Вычисление степени опасности УФ для прогресс-бара
function getUvStatus(uvIndex) {
    if (uvIndex <= 2) return { text: "Низкий", color: "#2ecc71" };
    if (uvIndex <= 5) return { text: "Умеренный", color: "#f1c40f" };
    if (uvIndex <= 7) return { text: "Высокий", color: "#e67e22" };
    if (uvIndex <= 10) return { text: "Очень высокий", color: "#e74c3c" };
    return { text: "Экстремальный", color: "#9b59b6" };
}

// Интеллектуальные рекомендации аналитика
function generateAdvice(temp, uv, humidity) {
    const uvStatus = getUvStatus(uv).text;
    if (temp >= 40) {
        return `⚠️ Экстремальная жара! Температура воздуха достигла ${temp}°C. Настоятельно рекомендуется находиться под кондиционером. Солнечный индекс опасен (${uvStatus}). Влажность критическая: ${humidity}%.`;
    } else if (temp >= 30) {
        return `На улице летний зной (${temp}°C). Наденьте головной убор и солнцезащитные очки, используйте защитный крем SPF.`;
    } else if (temp < 15) {
        return `Прохладные атмосферные условия (${temp}°C). Рекомендуется одеться теплее. Текущая влажность: ${humidity}%.`;
    }
    return `Погода идеальна для прогулок (${temp}°C). УФ-активность в пределах нормы: ${uvStatus}.`;
}

// Запрос к живому метео-серверу
async function fetchWeather(cityName) {
    try {
        // Шаг 1: Свободный Геокодинг (ищет координаты любого города мира)
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=ru&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert("Указанный город не найден метеоспутником.");
            return;
        }

        const { latitude, longitude, name } = geoData.results[0];

        // Шаг 2: Свободный запрос погоды (без токенов и ограничений CORS)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index&wind_speed_unit=ms`;
        const response = await fetch(weatherUrl);
        const data = await response.json();

        updateWeatherUI(name, data.current);
    } catch (error) {
        console.error("Критический сбой метео-модуля:", error);
        alert("Ошибка сети при получении метеоданных.");
    }
}

// Обновление интерфейса
function updateWeatherUI(cityName, current) {
    document.getElementById("city-name").innerText = cityName;
    
    const temp = Math.round(current.temperature_2m);
    document.getElementById("temperature").innerText = temp;

    const weatherInfo = parseWeatherCode(current.weather_code);
    document.getElementById("weather-status").innerText = weatherInfo.text;
    document.getElementById("weather-emoji").innerText = weatherInfo.emoji;

    // Расчет метрик
    const windSpeedKmH = Math.round(current.wind_speed_10m * 3.6);
    const windDirectionText = getWindDirection(current.wind_direction_10m);
    
    document.getElementById("humidity").innerText = current.relative_humidity_2m;
    document.getElementById("wind").innerText = `${windSpeedKmH} км/ч (${windDirectionText})`;
    document.getElementById("heat-index").innerText = Math.round(current.apparent_temperature);

    // УФ-индекс и шкала
    const uvValue = current.uv_index || 0;
    const uvInfo = getUvStatus(uvValue);
    
    document.getElementById("uv-val").innerText = uvValue.toFixed(1);
    
    const uvBadge = document.getElementById("uv-level");
    uvBadge.innerText = uvInfo.text;
    uvBadge.style.backgroundColor = uvInfo.color;

    const uvPercentage = Math.min((uvValue / 11) * 100, 100);
    document.getElementById("uv-fill").style.width = `${uvPercentage}%`;

    // Активация экстренного дизайна при жаре от 40 градусов
    const cardElement = document.getElementById("weather-card");
    const alertBanner = document.getElementById("alert-banner");
    
    if (temp >= 40) {
        cardElement.classList.add("theme-extreme-hot");
        alertBanner.style.display = "flex";
    } else {
        cardElement.classList.remove("theme-extreme-hot");
        alertBanner.style.display = "none";
    }

    // Вывод текста рекомендаций
    document.getElementById("advisor-content").innerText = generateAdvice(temp, uvValue, current.relative_humidity_2m);
}

// Слушатели интерактивных событий поиска
document.getElementById("search-btn").addEventListener("click", () => {
    const input = document.getElementById("city-input");
    if (input.value.trim() !== "") fetchWeather(input.value.trim());
});

document.getElementById("city-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.target.value.trim() !== "") {
        fetchWeather(e.target.value.trim());
    }
});

// Стартовая инициализация
document.addEventListener("DOMContentLoaded", () => {
    fetchWeather(DEFAULT_CITY);
});
