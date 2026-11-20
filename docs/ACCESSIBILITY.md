# Accessibility Engineering (WCAG 2.2 AA Target)

Accessibility is an explicit hackathon judging dimension. AERIS is engineered to be inclusive, responsive, and usable for individuals with visual, motor, or cognitive impairments.

---

## 1. Color Independence & Contrast

- **Color is Never the Sole Information Carrier:**
  - AQI indicators pair semantic colors with explicit textual labels (e.g. "Hazardous", "Unhealthy for Sensitive Groups").
  - Badges explicitly declare priority levels ("High Priority", "Medium Priority") in text.
- **High Contrast Palette:**
  - Background: `#070C14` / `#0B1220` (Midnight Ink)
  - Surface Cards: `#0D1624` / `#121D2F`
  - Text: `#F7F9F6` (Clean Ivory) and `#E9EEF1` (Cloud Gray)
  - Contrast ratios exceed WCAG AA requirements (minimum 4.5:1 for body text, 3:1 for large headers).

---

## 2. Keyboard Navigation & Visible Focus Indicators

- **Tab Navigation:** All interactive elements (buttons, links, search inputs, activity cards, checklist toggles) are reachable via standard keyboard navigation (`Tab` and `Shift+Tab`).
- **Visible Focus Rings:**
  ```css
  *:focus-visible {
    outline: 2px solid var(--teal-light);
    outline-offset: 2px;
  }
  ```
- **Escape Key Dismissal:** Modals (Ask AERIS, Add Activity) listen to the `Escape` key to allow immediate keyboard dismissal.

---

## 3. Screen Reader Semantics & ARIA Standards

- **Semantic HTML5 Elements:** Proper usage of `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, and `<article>`.
- **Dialogs & Live Regions:**
  - Modals implement `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
  - Icon-only buttons (close, refresh, trash) include explicit `aria-label` tags.
- **Chart Data Accessibility:**
  - Recharts timelines include accessible text summaries and structured numerical cards beneath the visualization.

---

## 4. Mobile & Touch Screen Usability

- Responsive layouts tested from narrow mobile viewports (360px) to widescreen desktop displays (1440px+).
- Touch target sizes meet the recommended 44x44px minimum for comfortable handheld interaction.
- Collapsible mobile navigation drawer with accessible open/close state toggles.
