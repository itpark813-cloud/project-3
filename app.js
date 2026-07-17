const DEFAULT_CITY = "Urganch";

// 1. Фишка: Перевод градусов направления ветра в понятные буквы (ССЗ, ЮВ и т.д.)
function getWindDirection(deg) {
    const directions = ['С', 'ССВ', 'СВ', 'ВСВ', 'В', 'ВЮВ', 'ЮВ', 'ЮЮВ', 'Ю', 'ЮЮЗ', 'ЮЗ', 'ЗЮЗ', 'З', 'ЗСЗ', 'СЗ', 'ССЗ'];
    const val = Math.floor((deg / 22.5) + 0.5);
    return directions[val % 16];
}

// 2. Фишка: Интерпретация кодов погоды в понятный текст и эмодзи
function parseWeatherCode(code) {
    if (code === 0) return { text: "Ясно / Солнечно", emoji: "☀️" };
    if ([1, 2, 3].includes(code)) return { text: "Переменная облачность", emoji: "⛅" };
    if ([45, 48].includes(code)) return { text: "Туман", emoji: "🌫️" };
    if ([51, 53, 55, 80, 81, 82].includes(code)) return { text: "Дождь / Ливень", emoji: "🌧️" };
    if ([71, 73, 75, 85, 86].includes(code)) return { text: "Снег", emoji: "❄️" };
    if ([95, 96, 99].includes(code)) return { text: "Гроза", emoji: "⛈️" };
    return { text: "Ясно", emoji: "☀️" };
}

// 3. Фишка: Расчет опасности УФ-лучей для шкалы
function getUvStatus(uvIndex) {
    if (uvIndex <= 2) return { text: "Низкий", color: "#2ecc71" };
    if (uvIndex <= 5) return { text: "Умеренный", color: "#f1c40f" };
    if (uvIndex <= 7) return { text: "Высокий", color: "#e67e22" };
    if (uvIndex <= 10) return { text: "Очень высокий", color: "#e74c3c" };
    return { text: "Экстремальный", color: "#9b59b6" };
}

// 4. Фишка: Динамические ИИ-рекомендации
function generateAdvice(temp, uv, humidity) {
    const uvStatus = getUvStatus(uv).text;
    if (temp >= 40) {
        return `⚠️ Экстремальная жара! Температура ${temp}°C. Солнце опасно (УФ: ${uvStatus}). Настоятельно рекомендуем оставаться в помещении и пить больше воды. Влажность воздуха: ${humidity}%.`;
    } else if (temp >= 30) {
        return `Летний зной (${temp}°C). Наденьте головной убор и используйте солнцезащитный крем SPF.`;
    } else if (temp < 15) {
        return `На улице прохладно (${temp}°C). Советуем одеться потеплее. Влажность — ${humidity}%.`;
    }
    return `Погода отличная (${temp}°C)! Прекрасное время для прогулки. УФ-индекс: ${uvStatus}.`;
}

// Главная функция получения погоды (Без ключей и без CORS)
async function fetchWeather(cityName) {
    try {
        // Шаг 1: Геокодинг — находим координаты города по его названию
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=ru&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert("Город не найден! Проверьте раскладку.");
            return;
        }

        const { latitude, longitude, name } = geoData.results[0];

        // Шаг 2: Запрос самой погоды по точным координатам
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index&wind_speed_unit=ms`;
        const response = await fetch(weatherUrl);
        const data = await response.json();

        updateWeatherUI(name, data.current);
    } catch (error) {
        console.error("Ошибка получения данных:", error);
        alert("Не удалось загрузить погоду. Проверьте интернет-соединение.");
    }
}

// Заполнение твоего HTML живыми данными
function updateWeatherUI(cityName, current) {
    // Температура, город, статус
    document.getElementById("city-name").innerText = cityName;
    
    const temp = Math.round(current.temperature_2m);
    document.getElementById("temperature").innerText = temp;

    const weatherInfo = parseWeatherCode(current.weather_code);
    document.getElementById("weather-status").innerText = weatherInfo.text;
    
    if (document.getElementById("weather-emoji")) {
        document.getElementById("weather-emoji").innerText = weatherInfo.emoji;
    }

    // Влажность и Ветер (переводим м/с в км/ч для соответствия твоему дизайну)
    const windSpeedKmH = Math.round(current.wind_speed_10m * 3.6);
    const windDirText = getWindDirection(current.wind_direction_10m);
    
    document.getElementById("humidity").innerText = current.relative_humidity_2m;
    document.getElementById("wind").innerText = `${windSpeedKmH} км/ч (${windDirText})`;

    // Тепловой индекс (в Open-Meteo это apparent_temperature — то, как температура ощущается телом)
    document.getElementById("heat-index").innerText = Math.round(current.apparent_temperature);

    // УФ-Индекс и управление шкалой
    const uvValue = current.uv_index || 0;
    const uvInfo = getUvStatus(uvValue);
    
    document.getElementById("uv-val").innerText = uvValue.toFixed(1);
    
    const uvBadge = document.getElementById("uv-level");
    if (uvBadge) {
        uvBadge.innerText = uvInfo.text;
        uvBadge.style.backgroundColor = uvInfo.color;
    }

    // Движение заполнения прогресс-бара УФ
    const uvFill = document.getElementById("uv-fill");
    if (uvFill) {
        const uvPercentage = Math.min((uvValue / 11) * 100, 100);
        uvFill.style.width = `${uvPercentage}%`;
    }

    // Экстренное переключение темы при жаре от 40 градусов
    const cardElement = document.getElementById("weather-card");
    const alertBanner = document.getElementById("alert-banner");
    
    if (temp >= 40) {
        if (cardElement) cardElement.classList.add("theme-extreme-hot");
        if (alertBanner) alertBanner.style.display = "flex";
    } else {
        if (cardElement) cardElement.classList.remove("theme-extreme-hot");
        if (alertBanner) alertBanner.style.display = "none";
    }

    // Вывод умной рекомендации
    if (document.getElementById("advisor-content")) {
        document.getElementById("advisor-content").innerText = generateAdvice(temp, uvValue, current.relative_humidity_2m);
    }
}

// Слушатели для интерактивного поиска
document.getElementById("search-btn").addEventListener("click", () => {
    const input = document.getElementById("city-input");
    if (input.value.trim() !== "") fetchWeather(input.value.trim());
});

document.getElementById("city-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.target.value.trim() !== "") {
        fetchWeather(e.target.value.trim());
    }
});

// Запуск приложения: сразу загружаем реальную погоду
document.addEventListener("DOMContentLoaded", () => {
    fetchWeather(DEFAULT_CITY);
});
