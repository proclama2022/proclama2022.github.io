---
phase: 15-weather-integration
plan: "02"
subsystem: weather
tags: [climate-logic, rain-delay, heat-warning, weather-advice]
dependency_graph:
  requires:
    - 15-01 (weather store, weather service)
  provides:
    - services/climateLogic.ts
    - ClimateAdvice in weather store
    - WeatherWidget with advice display
  affects:
    - stores/weatherStore.ts
    - components/WeatherWidget.tsx
    - i18n/resources/en.json
    - i18n/resources/it.json

tech_stack:
  added: []
  patterns:
    - ClimateAdvice interface with type/messageKey/action
    - Rain/Heat/Cold detection rules

key_files:
  created:
    - services/climateLogic.ts
  modified:
    - stores/weatherStore.ts
    - components/WeatherWidget.tsx
    - i18n/resources/en.json
    - i18n/resources/it.json

decisions:
  - "Rain Delay: rain > 5mm in current or forecast triggers 'delay' action"
  - "Heat Warning: maxTemp > 30°C for 3+ days triggers 'water_more' action"
  - "Cold Warning: current temp < 5°C triggers 'protect' action"

metrics:
  duration_seconds: ~180
  completed_date: "2026-03-05"
  tasks_completed: 4
---

# Phase 15 Plan 02: Smart Logic & Climate Advice Summary

**One-liner:** Climate logic service interprets weather data into actionable plant care advice (Rain Delay, Heat Warning, Cold Warning) with UI integration.

## What Was Built

### Task 1: Climate Logic Service (services/climateLogic.ts)
- `analyzeWeather(data: WeatherData): ClimateAdvice` function
- ClimateAdvice interface with type/messageKey/action
- Detection rules:
  - **Rain Delay**: Current rain > 5mm OR daily rain_sum[0] > 5mm (today) OR daily rain_sum[1] > 5mm (tomorrow)
  - **Heat Warning**: daily maxTemp > 30°C for 3+ consecutive days
  - **Cold Warning**: current temp < 5°C

### Task 2: Store Integration
- Updated weatherStore.ts to compute and expose climateAdvice
- Added computeClimateAdvice selector

### Task 3: UI Updates
- WeatherWidget now displays climate advice
- Collapsible section showing advice details
- Color-coded indicators (blue for rain, red for heat, cyan for cold)

### Task 4: Localization
- Added advice strings to en.json and it.json
- Keys: rainDelay, heatWarning, coldWarning, neutral

## Files Created/Modified

| File | Purpose |
|------|---------|
| services/climateLogic.ts | Climate analysis rules |
| stores/weatherStore.ts | Added climateAdvice to store |
| components/WeatherWidget.tsx | Added advice display |
| i18n/resources/en.json | Added advice strings |
| i18n/resources/it.json | Added advice strings (IT) |

## Self-Check: PASSED

- [x] services/climateLogic.ts exists with analyzeWeather function
- [x] ClimateAdvice interface defined with type/messageKey/action
- [x] Rain/Heat/Cold rules implemented as specified
- [x] WeatherWidget shows advice with collapsible section
- [x] Localization strings present in both EN and IT

---

*Phase: 15-weather-integration*
*Plan 02 Completed: 2026-03-05*