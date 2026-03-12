# Phase 15: Weather Integration & Climate-Aware Reminders

## Context
The goal of Phase 15 is to make Plantid "smart" about the user's local environment. Currently, watering schedules are static (e.g., "every 7 days"). However, real-world plant needs vary significantly with weather:
- **Rain**: Outdoor plants don't need watering if it rained recently.
- **Heat**: Plants dry out faster in hot weather.
- **Cold/Winter**: Many plants go dormant and need less water.

## Goals
1.  **Weather Awareness**: Fetch local weather data (temperature, rain, condition) for the user's location.
2.  **Privacy First**: Store location data locally; do not track users.
3.  **Smart Adjustments**:
    - **Rain Delay**: If rain > 5mm in last 24h, delay watering by 1-2 days.
    - **Heat Acceleration**: If temp > 30°C for 3 consecutive days, suggest watering sooner.
    - **Winter Mode**: If temp < 10°C consistently, suggest reduced frequency.
4.  **User Control**: Allow users to toggle "Weather Awareness" on/off in Settings.

## Architecture
- **Service Layer**:
    - `LocationService`: Handles permissions and reverse geocoding.
    - `WeatherService`: Fetches data from Open-Meteo API.
- **State Management**:
    - `WeatherStore`: Zustand store to cache weather data and location. Persisted via `AsyncStorage`.
- **UI Components**:
    - `WeatherWidget`: Displays current weather on Home screen.
    - Settings Toggle: Enable/Disable feature.

## References
- [Open-Meteo API](https://open-meteo.com/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
