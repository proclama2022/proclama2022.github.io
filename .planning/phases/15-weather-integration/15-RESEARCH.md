# Phase 15 Research: Weather API & Location

## Weather API Options
We need a free, reliable weather API that doesn't require complex API key management for a client-side app (to avoid exposing keys or setting up a proxy).

### Option 1: Open-Meteo (Selected)
- **Pros**:
    - Free for non-commercial use.
    - No API key required.
    - Extensive data (current, forecast, historical).
    - HTTPS support.
- **Cons**:
    - Attribution required (we can add a small link in Settings or About).
- **Data Points Needed**:
    - `temperature_2m` (Current & Daily Max/Min)
    - `rain` (Current)
    - `rain_sum` (Daily)
    - `weather_code` (Condition)

### Option 2: OpenWeatherMap
- **Pros**: Standard industry choice.
- **Cons**: Requires API key (risk of exposure in client-side code).

## Location Strategy
- **Library**: `expo-location`
- **Permissions**: `Foreground` only. We don't need background tracking.
- **Flow**:
    1. User enables "Weather Awareness" in Settings.
    2. App requests `Foreground` permission.
    3. If granted, fetch coords `(lat, lon)`.
    4. Reverse geocode to get City/Country for display (optional but nice).
    5. Store coords in `AsyncStorage`.
- **Privacy**:
    - Coords are sent ONLY to Open-Meteo API.
    - Coords are stored LOCALLY on device.
    - No data sent to Plantid servers (Supabase).

## Logic for "Smart Reminders"
How do we adjust the schedule?

1.  **Rain Delay**:
    - Check `daily.rain_sum` for today and yesterday.
    - If `sum > 5mm`, skip watering today (push due date +1 day).
    - *UI*: Show "Rain delayed" badge on the plant card.

2.  **Heat Warning**:
    - Check `daily.temperature_2m_max` forecast.
    - If `max > 30°C` for next 3 days, alert user: "Heatwave expected, check plants daily."

3.  **Winter Dormancy**:
    - If `current.temp < 10°C` (and user is in Northern Hemisphere winter months?), suggest "Winter Mode" (reduce frequency by 50%).
    - *Simplification*: Just warn about cold for now.

## Implementation Plan
1.  **Infrastructure**: Services + Store.
2.  **UI**: Widget + Settings.
3.  **Logic**: Hook into `usePlantsStore` or `NotificationService`.
