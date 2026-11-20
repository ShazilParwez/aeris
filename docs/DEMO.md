# AERIS Three-Minute Demonstration Journey

This walkthrough provides the step-by-step sequence for judges evaluating AERIS.

---

## Scene 1 — The Problem (Command Center)
1. Open AERIS at `http://localhost:3000`.
2. Notice the refined, calm climate-tech aesthetic in **Midnight Ink** and **Botanical Teal**.
3. Search for **"Delhi"** or click into the **Command Center** (`/dashboard`).
4. Inspect the **Current AQI Hero**:
   - Shows **U.S. AQI (model-based estimate)** with explicit scientific labeling.
   - Notes raw PM2.5 and PM10 concentrations alongside meteorological variables (temperature, surface wind, humidity).
   - Shows the immediate plain-language advisory grounded in verified atmospheric conditions.

---

## Scene 2 — Intelligence & Cleaner Windows
1. Scrub the **Hourly Air Quality Forecast Timeline** (toggle between 24h and 48h, switch between AQI, PM2.5, and PM10).
2. Look at the **Relatively Cleaner Window Card**:
   - Highlights the early afternoon dispersion window (e.g., 13:00–16:00).
   - Explains the atmospheric physics: daytime solar heating drives vertical convective mixing, temporarily diluting particulate concentrations trapped by morning temperature inversions.

---

## Scene 3 — Personalization (The Cleaner Day Planner)
1. Navigate to **Day Planner** (`/planner`).
2. Notice the user's daily activities: Morning Cardio Run (07:00), School Drop-off (08:15, Fixed), Office Commute (09:00, Fixed), Evening Walk (18:30).
3. Click **"Optimize Schedule"**:
   - Watch AERIS evaluate the forecast intervals.
   - Notice that the **Morning Run** is recommended to move indoors or shift to the afternoon cleaner window, cutting personal particulate dose by over **35%**.
   - Notice that **School Drop-off** remains at 08:15 because it is marked fixed, with tailored protective advice (N95 respirator, enclosed transit).
4. Demonstrate accepting/rejecting suggestions and clicking **"Export Summary"**.

---

## Scene 4 — Sustainability & 2D Tradeoffs (Impact Optimizer)
1. Navigate to **Impact Optimizer** (`/impact`).
2. Select **Baseline: Private Car** and **Alternative: Cycling** over 14 km during severe smog (PM2.5 = 180 µg/m³).
3. Observe the **Two-Dimensional Decision Model**:
   - **Dimension 1 (Carbon):** Cycling cuts 2.4 kg of CO2 (-100%).
   - **Dimension 2 (Inhalation Exposure):** Cycling increases personal inhaled dose by **+350%** due to high minute-ventilation (~30 L/min) alongside vehicular exhaust.
4. Now select **Alternative: Electric Metro**:
   - Shows the true **Win-Win**: saves 2.07 kg CO2 (-86%) while reducing personal particulate exposure due to sealed, HVAC-filtered cabin air!

---

## Scene 5 — GenAI Assistance (Ask AERIS)
1. Click **"Ask AERIS"** in the top navigation bar.
2. Click the preset prompt: *"Is it advisable for my child to play outdoors this afternoon?"*
3. Observe the response:
   - Grounded strictly in current location and AQI readings.
   - Mentions children's higher respiratory rates per kilogram of body mass.
   - Shows verified grounding facts chips and recommended action bullets.
   - Demonstrates graceful fallback mode if `GEMINI_API_KEY` is unconfigured.

---

## Scene 6 — Classical Machine Learning (Forecast Lab)
1. Navigate to **Forecast Lab** (`/forecast-lab`).
2. Inspect the **3-Hour Lead PM2.5 Predictor**:
   - Shows the experimental prediction with empirical 90% confidence intervals.
   - Compares against the **Persistence Baseline**.
   - Highlights actual offline evaluation metrics: **MAE: 12.40 µg/m³ (beats persistence of 16.70 µg/m³ by 26%)**, $R^2 = 0.7564$.
   - Shows **Permutation Feature Importances** (current PM2.5, lag-24 diurnal cycle, rolling means, temperature).
3. Switch city to **"London"**:
   - Watch AERIS refuse to make out-of-domain predictions, demonstrating scientific integrity.

---

## Scene 7 — Engineering & Testing
1. Review the passing test suite:
   ```powershell
   python -m pytest apps/api/tests -v
   ```
   16 passing unit and integration tests.
2. Confirm the Next.js production build:
   ```powershell
   pnpm run build
   ```
   Compiled and static pages generated cleanly.
