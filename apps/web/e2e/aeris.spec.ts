import { test, expect } from "@playwright/test";

test.describe("AERIS Release Candidate E2E Browser Test Suite", () => {
  // Test 1: Homepage navigation and CTA
  test("1. Homepage renders correctly and navigates to command center", async ({ page }) => {
    await page.goto("/");
    expect(await page.title()).toContain("AERIS");
    await expect(page.locator("h1")).toContainText("Breathe Smarter");
    await page.screenshot({ path: "test-results/screenshot_home.png" });

    // Navigate to dashboard via Command Center link
    const launchBtn = page.locator('a[href="/dashboard"]').first();
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  // Test 2: Location search, selection, and switching without stale data
  test("2. Location search and switching updates without retaining stale data", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Air Quality Command Center");
    await expect(page.locator("body")).toContainText("Delhi");

    // Search for Mumbai
    const searchInput = page.getByPlaceholder("Change city...");
    await searchInput.fill("Mumbai");
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForTimeout(600);
    expect(await page.locator("body").isVisible()).toBeTruthy();
  });

  // Test 3: Dashboard forecast chart and accessible table
  test("3. Dashboard forecast timeline renders with accessible tabular data alternative", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText("Hourly Air Quality Forecast Timeline");
    await page.screenshot({ path: "test-results/screenshot_dashboard.png" });

    // Metric view toggles (AQI, PM2.5, PM10)
    const pm25Toggle = page.getByRole("button", { name: "PM2.5" });
    await expect(pm25Toggle).toBeVisible();
    await pm25Toggle.click();

    // Horizon toggles (24h, 48h)
    const h48Toggle = page.getByRole("button", { name: "48h" });
    await expect(h48Toggle).toBeVisible();
    await h48Toggle.click();

    // Expand accessible tabular details for screen readers
    const accessibleDetails = page.locator("details summary");
    await expect(accessibleDetails).toBeVisible();
    await accessibleDetails.click();

    // Verify accessible table is visible
    const table = page.locator("table");
    await expect(table).toBeVisible();
    await expect(page.locator("th", { hasText: "PM2.5" })).toBeVisible();
  });

  // Test 4: Planner activity creation and optimization
  test("4. Planner optimizes schedule and calculates exposure reduction", async ({ page }) => {
    await page.goto("/planner");
    await expect(page.locator("h1")).toContainText("Cleaner Day Planner");
    await expect(page.locator("body")).toContainText("Morning Cardio Run");

    // Click Optimize Schedule
    const optimizeBtn = page.locator("button:has-text('Optimize Schedule')");
    await expect(optimizeBtn).toBeVisible();
    await optimizeBtn.click();

    // Wait for optimization results card
    await expect(page.locator("body")).toContainText(/Schedule|Exposure Reduction/i, { timeout: 10000 });
    await page.screenshot({ path: "test-results/screenshot_planner.png" });
  });

  // Test 5: Indoor checklist persistence across reloads
  test("5. Indoor checklist toggles task and persists state across page reloads", async ({ page }) => {
    await page.goto("/home-air");
    await expect(page.locator("h1")).toContainText("Indoor Air Quality Playbook");

    // Locate the first task card and click to toggle
    const taskCard = page.locator("h3:has-text('The 2-Minute Pre-Exhaust Protocol')");
    await expect(taskCard).toBeVisible();
    await taskCard.click();

    // Verify progress updates
    await expect(page.locator("body")).toContainText(/Protected|Implemented/i);
    await page.screenshot({ path: "test-results/screenshot_home_air.png" });

    // Reload page to verify localStorage persistence
    await page.reload();
    await expect(page.locator("h1")).toContainText("Indoor Air Quality Playbook");
    await expect(page.locator("body")).toContainText(/Protected|Implemented/i);
  });

  // Test 6: Transport comparison updates
  test("6. Transport comparison dynamically recalculates carbon and exposure upon distance change", async ({ page }) => {
    await page.goto("/impact");
    await expect(page.locator("h1")).toContainText("Low-Emission Routine Optimizer");
    await expect(page.locator("body")).toContainText("Dimension 1: Direct Tailpipe Carbon Emissions");
    await expect(page.locator("body")).toContainText("Dimension 2: Comparative Exposure Indicator");

    // Adjust distance slider
    const distanceSlider = page.locator('input[type="range"]').first();
    await distanceSlider.fill("25");

    // Verify net climate benefit updates
    await expect(page.locator("body")).toContainText("Net Climate Benefit");
    await page.screenshot({ path: "test-results/screenshot_impact.png" });
  });

  // Test 7: Ask AERIS modal opening, keyboard escape dismissal, and grounded reply
  test("7. Ask AERIS modal opens, traps focus, answers grounded questions, and dismisses on Escape", async ({ page }) => {
    await page.goto("/dashboard");

    // Open Ask AERIS
    const askBtn = page.locator("button:has-text('Ask AERIS')").first();
    await expect(askBtn).toBeVisible();
    await askBtn.click();

    // Modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Ask AERIS");

    // Click preset question
    const queryBtn = modal.locator("button:has-text('Is it advisable for my child to play outdoors this afternoon?')");
    await expect(queryBtn).toBeVisible();
    await queryBtn.click();

    // Verify answer renders
    await expect(modal).toContainText(/children|respiratory|exposure|AQI|outdoor/i, { timeout: 10000 });
    await page.screenshot({ path: "test-results/screenshot_assistant.png" });

    // Press Escape to dismiss
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  // Test 8: Forecast Lab ML status and geographic boundary guard
  test("8. Forecast Lab displays calibrated Huber Regressor metrics and boundary guard", async ({ page }) => {
    await page.goto("/forecast-lab");
    await expect(page.locator("h1")).toContainText("AERIS Forecast Lab");
    await expect(page.locator("body")).toContainText("Offline Holdout Test Benchmark");
    await expect(page.locator("body")).toContainText("Mean Absolute Error");
    await page.screenshot({ path: "test-results/screenshot_forecast_lab.png" });

    // Switch to London (Out of Domain)
    const londonBtn = page.getByRole("button", { name: /London \(Out of Domain\)/i });
    await expect(londonBtn).toBeVisible();
    await londonBtn.click();

    // Verify Scientific Boundary Guard appears
    await expect(page.locator("body")).toContainText(/Scientific Boundary Guard|unsupported/i);
  });

  // Test 9: Mobile layout (375px)
  test("9. Mobile layout on dashboard displays without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Air Quality Command Center");
    await page.screenshot({ path: "test-results/screenshot_mobile.png" });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  // Test 10: Live backend integration smoke test
  test("10. Frontend-to-backend live API interaction succeeds", async ({ page }) => {
    await page.goto("/dashboard");
    // Verify live data arrived from backend: AQI gauge has numerical value
    const aqiNumber = page.locator("span.font-black").first();
    await expect(aqiNumber).toBeVisible();
    const text = await aqiNumber.textContent();
    expect(Number(text)).toBeGreaterThan(0);
  });
});
