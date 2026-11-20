# Environmental Data Sources & Attribution

AERIS integrates real, verified global atmospheric and weather datasets to ensure scientific integrity.

## 1. Primary Air Quality Provider

- **Provider:** Open-Meteo Air Quality API
- **Endpoint:** `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Underlying Atmospheric Models:**
  - Copernicus Atmosphere Monitoring Service (CAMS) European Ensemble
  - NOAA Global Forecast System (GFS) Aerosol Model
- **Variables Retrieved:**
  - `us_aqi`: Model-based U.S. EPA Air Quality Index
  - `pm2_5`: Fine particulate matter (< 2.5 µm) in µg/m³
  - `pm10`: Coarse particulate matter (< 10 µm) in µg/m³
  - `nitrogen_dioxide`: NO2 concentration in µg/m³
  - `sulphur_dioxide`: SO2 concentration in µg/m³
  - `ozone`: Ground-level O3 in µg/m³
  - `carbon_monoxide`: CO concentration in µg/m³
- **Temporal Horizon:** Current atmospheric reading + 48-hour hourly forecast.

---

## 2. Weather & Dispersion Context

- **Provider:** Open-Meteo Weather Forecast API
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Variables Retrieved:**
  - `temperature_2m`: Surface ambient temperature (°C)
  - `relative_humidity_2m`: Relative humidity (%)
  - `wind_speed_10m`: Surface wind velocity (km/h)
  - `wind_direction_10m`: Wind direction (degrees)
  - `precipitation`: Liquid equivalent precipitation (mm)
  - `weather_code`: WMO weather interpretation code

---

## 3. Geocoding & Location Search

- **Provider:** Open-Meteo Geocoding API
- **Endpoint:** `https://geocoding-api.open-meteo.com/v1/search`
- **Capabilities:**
  - Name-based query with debouncing
  - Returns latitude, longitude, country, state/admin region, and local timezone.
  - Default demonstration city: **Delhi, India** (28.6139°N, 77.2090°E).

---

## 4. AQI Standard Distinction (U.S. EPA vs Indian CPCB NAQI)

AERIS strictly observes scientific honesty regarding index standards:
1. Open-Meteo computes the **U.S. EPA AQI standard**.
2. AERIS labels this explicitly as: **"U.S. AQI — model-based estimate"**.
3. **India CPCB National Air Quality Index (NAQI)** uses different breakpoints:
   - India PM2.5 "Severe" category starts at 250 µg/m³ (CPCB AQI 401–500).
   - U.S. EPA PM2.5 "Hazardous" category starts at 250.5 µg/m³ (US AQI 301–500).
   - India NAQI requires 24-hour moving averages across at least 3 parameters with strict 16-hour completeness conditions.
4. AERIS never maps U.S. EPA numbers to CPCB category labels.

---

## 5. Offline Demonstration Fixtures

If network connectivity is unavailable or upstream providers experience transient outages:
- AERIS transitions gracefully into a clearly labeled **Offline Demonstration Mode**.
- Fixture data represents a real, verified winter smog episode in Delhi (typical November–January stagnation regime).
- Provenance metadata explicitly flags `is_demo_fixture: True`.
