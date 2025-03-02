const apiKey = 'f905fe9e61013cb322bd4b6a6f940def'; // Your OpenWeatherMap API key
let currentLocation = '';

async function fetchWeatherData(location = currentLocation) {
    if (!location || location.trim() === '') {
        alert("Please enter a valid city name to get the weather data.");
        return;
    }

    // Normalize the location (remove extra spaces, capitalize first letter, etc.)
    const normalizedLocation = location.trim().toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(normalizedLocation)}&appid=${apiKey}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(normalizedLocation)}&appid=${apiKey}&units=metric`;

        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(forecastUrl)
        ]);

        const weatherData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

        if (weatherData.cod === "404" || forecastData.cod === "404") {
            alert(`City "${normalizedLocation}" not found! Please check the spelling or try a different city (e.g., "London, UK" for specificity).`);
            return;
        } else if (weatherData.cod !== 200 || forecastData.cod !== "200") {
            alert(`An error occurred: ${weatherData.message || forecastData.message}. Please try again later.`);
            return;
        }

        currentLocation = normalizedLocation;
        displayWeatherData(weatherData, forecastData);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert("An error occurred while fetching weather data. Please try again later.");
    }
}

function displayWeatherData(weatherData, forecastData) {
    const placeholder = document.getElementById('placeholder');
    const weatherDataDiv = document.getElementById('weatherData');

    // Hide placeholder and show weather data
    placeholder.style.display = 'none';
    weatherDataDiv.style.display = 'block';

    displayCurrentWeather(weatherData);
    displayHourlyForecast(forecastData);
    displayFiveDayForecast(forecastData);
}

function displayCurrentWeather(data) {
    document.getElementById('location').textContent = data.name;
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('condition').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity}%`;
    document.getElementById('wind').textContent = `Wind: ${data.wind.speed} m/s`;
    document.getElementById('pressure').textContent = `Pressure: ${data.main.pressure} hPa`;
    document.getElementById('weatherIcon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

    const date = new Date();
    document.getElementById('time').textContent = `Updated: ${date.toLocaleTimeString()} | H:${Math.round(data.main.temp_max)}° | L:${Math.round(data.main.temp_min)}°`;

    // Change background based on weather condition
    updateBackground(data.weather[0].main);
}

function updateBackground(weatherCondition) {
    const body = document.body;
    // Remove existing weather classes
    body.classList.remove('sunny', 'rainy', 'cloudy', 'snowy', 'foggy', 'thunderstorm');

    // Determine the weather class based on the condition
    let weatherClass = 'cloudy'; // Default to cloudy if condition isn’t matched
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            weatherClass = 'sunny';
            break;
        case 'rain':
        case 'drizzle':
            weatherClass = 'rainy';
            break;
        case 'clouds':
            weatherClass = 'cloudy';
            break;
        case 'snow':
            weatherClass = 'snowy';
            break;
        case 'mist':
        case 'haze':
        case 'fog':
            weatherClass = 'foggy';
            break;
        case 'thunderstorm':
            weatherClass = 'thunderstorm';
            break;
        default:
            weatherClass = 'cloudy';
    }

    body.classList.add(weatherClass);
}

function displayHourlyForecast(data) {
    const hourlyGrid = document.getElementById('hourly');
    hourlyGrid.innerHTML = '';

    // Get the current time
    const now = new Date();
    const hours = data.list.filter(item => {
        const itemTime = new Date(item.dt * 1000);
        // Filter for the next 8 hours, starting from the current time
        return itemTime > now && itemTime.getHours() <= now.getHours() + 8;
    }).slice(0, 8); // Ensure we only take up to 8 hours

    if (hours.length === 0) {
        console.warn('No hourly forecast data available for the next 8 hours.');
        hourlyGrid.innerHTML = '<p>No hourly forecast available at this time.</p>';
        return;
    }

    hours.forEach(hour => {
        const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(hour.main.temp);
        const icon = hour.weather[0].icon;

        const hourItem = document.createElement('div');
        hourItem.className = 'hourly-item';
        hourItem.innerHTML = `
            <p>${time}</p>
            <img src="http://openweathermap.org/img/wn/${icon}.png" alt="Weather icon">
            <p>${temp}°C</p>
        `;
        hourlyGrid.appendChild(hourItem);
    });
}

function displayFiveDayForecast(data) {
    const fiveDayGrid = document.getElementById('fiveDay');
    fiveDayGrid.innerHTML = '';

    const daily = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        if (!daily[date]) {
            daily[date] = { temp: item.main.temp, icon: item.weather[0].icon, max: item.main.temp_max, min: item.main.temp_min };
        } else {
            daily[date].max = Math.max(daily[date].max, item.main.temp_max);
            daily[date].min = Math.min(daily[date].min, item.main.temp_min);
        }
    });

    Object.entries(daily).slice(0, 5).forEach(([day, info]) => {
        const fiveDayItem = document.createElement('div');
        fiveDayItem.className = 'five-day-item';
        fiveDayItem.innerHTML = `
            <p>${day}</p>
            <img src="http://openweathermap.org/img/wn/${info.icon}.png" alt="Weather icon">
            <p>${Math.round(info.temp)}°C</p>
            <div class="temp-range">
                <span>${Math.round(info.min)}°</span>
                <span>${Math.round(info.max)}°</span>
            </div>
        `;
        fiveDayGrid.appendChild(fiveDayItem);
    });
}

// Handle search input
function handleSearch() {
    const locationInput = document.getElementById('locationInput').value.trim();
    if (locationInput) {
        fetchWeatherData(locationInput);
    }
}

// Initial state: Show placeholder, hide weather data
window.onload = () => {
    document.getElementById('placeholder').style.display = 'block';
    document.getElementById('weatherData').style.display = 'none';
};