function updateTripleClock() {
            const now = new Date();
            document.getElementById('clock-hours').textContent = String(now.getHours()).padStart(2, '0');
            document.getElementById('clock-minutes').textContent = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('clock-seconds').textContent = String(now.getSeconds()).padStart(2, '0');
        }
        setInterval(updateTripleClock, 1000);
        updateTripleClock();

        const ahora = new Date();
        document.getElementById('current-date').innerText = ahora.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('day-name').innerText = ahora.toLocaleDateString('es-ES', { weekday: 'long' });

        const lat = -45.8656;
        const lon = -67.4944;
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,wind_speed_10m,wind_gusts_10m,wind_direction_10m&timezone=America/Argentina/Buenos_Aires`;

        function getWindDirection(deg) {
            const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            return dirs[Math.floor(((deg + 11.25) % 360) / 22.5)] || 'W';
        }

        async function fetchWeatherData() {
            try {
                const response = await fetch(apiUrl);
                const data = await response.json();
                const hourly = data.hourly;
                const wrapper = document.getElementById('timeline-wrapper');
                wrapper.innerHTML = ''; 

                const horaLocalActual = new Date().getHours();
                let startIndex = hourly.time.findIndex(t => new Date(t).getHours() === horaLocalActual);
                if (startIndex === -1) startIndex = 0;

                for (let i = 0; i < 25; i++) {
                    const index = startIndex + i;
                    if (!hourly.time[index]) break; 

                    const horaData = new Date(hourly.time[index]);
                    const stringHora = `${horaData.getHours().toString().padStart(2, '0')}:00`;

                    const card = document.createElement('div');
                    card.className = `hour-card ${i === 0 ? 'now' : ''}`;
                    card.innerHTML = `
                        <div class="card-time">${stringHora}</div>
                        <div class="card-temp">${Math.round(hourly.temperature_2m[index])}°C</div>
                        <div class="card-feels-like">ST: ${Math.round(hourly.apparent_temperature[index])}°C</div>
                        <div class="card-wind-box">
                            <div class="card-wind">${Math.round(hourly.wind_speed_10m[index])} km/h</div>
                            <div class="card-gusts">Ráf: ${Math.round(hourly.wind_gusts_10m[index])}</div>
                        </div>
                        <div class="card-dir">
                            <span class="arrow" style="transform: rotate(${hourly.wind_direction_10m[index]}deg)">↓</span>
                            ${getWindDirection(hourly.wind_direction_10m[index])}
                        </div>
                    `;
                    wrapper.appendChild(card);
                }
            } catch (error) {
                console.error("Error:", error);
            }
        }
        fetchWeatherData();