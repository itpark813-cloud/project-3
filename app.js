// Объект с реальными данными из твоего запроса (для инициализации или дефолта)
const weatherData = {
    location: {
        name: "Urganch",
        region: "Khorazm",
        country: "Uzbekistan"
    },
    current: {
        temp_c: 46.3,
        condition: { text: "Sunny" },
        wind_kph: 17.6,
        wind_dir: "NNW",
        humidity: 9,
        feelslike_c: 38.9,
        heatindex_c: 50.2,
        uv: 5.3
    }
};

// 1. Фишка: Переводчик направления ветра для удобства пользователей
function translateWindDir(dir) {
    const directions = {
        'N': 'С', 'S': 'Ю', 'E': 'В', 'W': 'З',
        'NE': 'СВ', 'NW': 'СЗ', 'SE': 'ЮВ', 'SW': 'ЮЗ',
        'NNE': 'ССВ', 'NNW': 'ССЗ', 'SSE': 'ЮЮВ', 'SSW': 'ЮЮЗ',
        'ENE': 'ВСВ', 'ESE': 'ВЮВ', 'WNW': 'ЗСЗ', 'WSW': 'ЗЮЗ'
    };
    return directions[dir] || dir;
}

// 2. Фишка: Определение уровня опасности УФ-излучения
function getUvStatus(uvIndex) {
    if (uvIndex <= 2) return "Низкий";
    if (uvIndex <= 5) return "Умеренный";
    if (uvIndex <= 7) return "Высокий";
    if (uvIndex <= 10) return "Очень высокий";
    return "Экстремальный";
}

// 3. Фишка: Динамический ИИ-советник (генерирует текст без изменения HTML-структуры)
function generateAdvice(temp, uv, humidity) {
    if (temp >= 40) {
        return `⚠️ Экстремальная жара! Тепловой индекс зашкаливает. УФ-индекс: ${getUvStatus(uv)}. Настоятельно рекомендуется оставаться в помещении с кондиционером и пить минеральную воду. Влажность всего ${humidity}%, воздух очень сухой.`;
    } else if (temp > 30) {
        return "Жарко. Не забывайте про головной убор и солнцезащитный крем. Пейте больше воды.";
    }
    return "Погода комфортная. Отличный день для прогулки!";
}

// Функция обновления данных на UI
function updateWeatherUI(data) {
    const current = data.current;
    const location = data.location;

    // Подставляй сюда ID своих существующих элементов
    document.getElementById("city-name").innerText = location.name;
    document.getElementById("temperature").innerText = Math.round(current.temp_c);
    document.getElementById("weather-status").innerText = current.condition.text === "Sunny" ? "Ясно / Солнечно" : current.condition.text;
    
    // Новые параметры из JSON
    if(document.getElementById("humidity")) {
        document.getElementById("humidity").innerText = `${current.humidity}%`;
    }
    
    if(document.getElementById("wind")) {
        const windDirection = translateWindDir(current.wind_dir);
        document.getElementById("wind").innerText = `${current.wind_kph} км/ч (${windDirection})`;
    }

    if(document.getElementById("feels-like")) {
        document.getElementById("feels-like").innerText = `${current.feelslike_c}°C`;
    }

    // Рендеринг фишек: тепловой индекс и УФ
    if(document.getElementById("heat-index")) {
        document.getElementById("heat-index").innerText = `${current.heatindex_c}°C`;
    }

    if(document.getElementById("uv-index")) {
        document.getElementById("uv-index").innerText = `${current.uv} (${getUvStatus(current.uv)})`;
    }

    // Вывод совета в твой текстовый блок
    if(document.getElementById("weather-advice")) {
        document.getElementById("weather-advice").innerText = generateAdvice(current.temp_c, current.uv, current.humidity);
    }
}

// Запуск при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    updateWeatherUI(weatherData);
});
