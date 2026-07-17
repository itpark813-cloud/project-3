// Константы для интеграции с твоим WeatherAPI
const API_KEY = "0101d8e61bc04c7fb9580547251103";
const DEFAULT_CITY = "Urganch";

// 1. Фишка: Умный переводчик сложных направлений ветра с английского на русский
function translateWindDir(dir) {
    const directions = {
        'N': 'С', 'S': 'Ю', 'E': 'В', 'W': 'З',
        'NE': 'СВ', 'NW': 'СЗ', 'SE': 'ЮВ', 'SW': 'ЮЗ',
        'NNE': 'ССВ', 'NNW': 'ССЗ', 'SSE': 'ЮЮВ', 'SSW': 'ЮЮЗ',
        'ENE': 'ВСВ', 'ESE': 'ВЮВ', 'WNW': 'ЗСЗ', 'WSW': 'ЗЮЗ'
    };
    return directions[dir] || dir;
}

// 2. Фишка: Расчет уровня опасности УФ-излучения для прогресс-бара
function getUvStatus(uvIndex) {
    if (uvIndex <= 2) return { text: "Низкий", color: "#2ecc71" };
    if (uvIndex <= 5) return { text: "Умеренный", color: "#f1c40f" };
    if (uvIndex <= 7) return { text: "Высокий", color: "#e67e22" };
    if (uvIndex <= 10) return { text: "Очень высокий", color: "#e74c3c" };
    return { text: "Экстремальный", color: "#9b59b6" };
}

// 3. Фишка: Генератор динамических рекомендаций на основе живых данных
function generateAdvice(temp, uv, humidity) {
    const uvStatus = getUvStatus(uv).text;
    if (temp >= 40) {
        return `⚠️ Экстремальная жара! Температура воздуха ${temp}°C. Солнечная активность опасна (УФ-индекс: ${uvStatus}). Настоятельно рекомендуем оставаться в тени или помещении, пить больше чистой воды. Влажность воздуха составляет всего ${humidity}%.`;
    } else if (temp >= 30) {
        return `Летний зной. Температура ${temp}°C, солнце жарит ощутимо. Наденьте головной убор, возьмите солнцезащитные очки и не забывайте про SPF-крем.`;
    } else if (temp < 15) {
        return `На улице прохладно (${temp}°C). Стоит одеться потеплее. Влажность воздуха — ${humidity}%.`;
    }
    return `Погода отличная (${temp}°C)! Прекрасное время для прогулок на свежем воздухе. УФ-активность: ${uvStatus}.`;
}

// Главная функция: запрос к твоему API сервису
async function fetchWeatherData(city) {
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city)}&aqi=no`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Город не найден в базе данных weatherapi");
        }
        const data = await response.json();
        updateWeatherUI(data);
    } catch (error) {
        console.error("Ошибка запроса к WeatherAPI:", error);
        alert("Не удалось загрузить данные для города: " + city);
    }
}

// Распределение реальных данных по HTML элементам
function updateWeatherUI(data) {
    const current = data.current;
    const location = data.location;

    // Основные текстовые поля
    document.getElementById("city-name").innerText = location.name;
    document.getElementById("temperature").innerText = Math.round(current.temp_c);
    
    // Переводим статус погоды или оставляем оригинальный текст
    let statusText = current.condition.text;
    if (statusText === "Sunny") statusText = "Ясно / Солнечно";
    if (statusText === "Clear") statusText = "Чистое небо";
    document.getElementById("weather-status").innerText = statusText;

    // Влажность и Ветер (с автопереводом направления)
    document.getElementById("humidity").innerText = current.humidity;
    const readableDir = translateWindDir(current.wind_dir);
    document.getElementById("wind").innerText = `${current.wind_kph} км/ч (${readableDir})`;

    // Тепловой индекс (если API не передает его для холодной погоды, страхуемся текущей температурой)
    const heatIndexVal = current.heatindex_c ? current.heatindex_c : current.temp_c;
    document.getElementById("heat-index").innerText = Math.round(heatIndexVal);

    // Фишка: Настройка прогресс-бара УФ-индекса
    const uvValue = current.uv;
    const uvInfo = getUvStatus(uvValue);
    document.getElementById("uv-val").innerText = uvValue;
    
    const uvBadge = document.getElementById("uv-level");
    uvBadge.innerText = uvInfo.text;
    uvBadge.style.backgroundColor = uvInfo.color;

    // Вычисляем ширину шкалы УФ (максимум берем за 11+ единиц)
    const uvPercentage = Math.min((uvValue / 11) * 100, 100);
    document.getElementById("uv-fill").style.width = `${uvPercentage}%`;

    // Фишка: Экстренная огненная тема и баннер при аномальной жаре (>40°C)
    const cardElement = document.getElementById("weather-card");
    const alertBanner = document.getElementById("alert-banner");
    
    if (current.temp_c >= 40) {
        cardElement.classList.add("theme-extreme-hot");
        alertBanner.style.display = "flex";
    } else {
        cardElement.classList.remove("theme-extreme-hot");
        alertBanner.style.display = "none";
    }

    // Запись сгенерированного ИИ-совета
    document.getElementById("advisor-content").innerText = generateAdvice(current.temp_c, uvValue, current.humidity);
}

// Обработка событий поиска
document.getElementById("search-btn").addEventListener("click", () => {
    const input = document.getElementById("city-input");
    if (input.value.trim() !== "") {
        fetchWeatherData(input.value.trim());
    }
});

document.getElementById("city-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.target.value.trim() !== "") {
        fetchWeatherData(e.target.value.trim());
    }
});

// Первичный запуск — сразу выводим честный Ургенч
document.addEventListener("DOMContentLoaded", () => {
    fetchWeatherData(DEFAULT_CITY);
});
