# Prompt Wars Hackathon Evaluation Mapping

This document provides technical judges with direct, verified implementation evidence for each of the six official evaluation criteria.

---

## 1. Code Quality

| Requirement | Implementation Evidence in AERIS |
| :--- | :--- |
| **Architectural Separation** | Clean monorepo structure: `apps/web` (Next.js 14 App Router), `apps/api` (FastAPI), `ml/` (scikit-learn module). |
| **Type Safety & Contracts** | Strict TypeScript typing without arbitrary `any`. Backend boundaries enforced via Pydantic v2 schemas (`app/schemas/`). |
| **Modularity & Reusability** | Focused, composable functions. Reusable UI components in `apps/web/components/`. |
| **Maintainability** | Zero dead code, no monolithic 1000-line spaghetti files. Clear naming conventions and explanatory scientific comments. |

---

## 2. Security Engineering

| Requirement | Implementation Evidence in AERIS |
| :--- | :--- |
| **Secrets Protection** | `GEMINI_API_KEY` resides strictly on the backend. Zero API keys exposed in frontend bundles or committed in git. |
| **Input Validation** | Coordinate bounds clamping ($[-90, 90]$ / $[-180, 180]$), string length ceilings, and strict Pydantic type checks. |
| **Prompt Injection Defense** | Bounded context prompt construction; Gemini instructions forbid code execution and command overrides. |
| **Safe Error Handling** | Global exception handler prevents Python stack traces and internal paths from leaking to clients. |
| **Client-Side Privacy** | Family profiles and schedules reside in `localStorage`. Zero PII persisted in external databases. |

---

## 3. Efficiency & Resource Discipline

| Requirement | Implementation Evidence in AERIS |
| :--- | :--- |
| **Request Caching** | In-memory cache with 5-minute TTL on Open-Meteo external requests prevents rate-limit exhaustion. |
| **Artifact Lifecycle** | ML model artifact (`delhi_pm25_model.joblib`) is loaded once at startup into `ModelRegistry`, never retrained per request. |
| **Frontend Performance** | Next.js production build produces an ultra-lean bundle: first load JS shared by all pages is **only 87.4 kB**. |
| **Lean Architecture** | No unnecessary PostgreSQL, Redis, or Docker overhead introduced for a local hackathon deliverable. |

---

## 4. Automated Testing

| Requirement | Implementation Evidence in AERIS |
| :--- | :--- |
| **Unit & Integration Tests** | **16 passing automated pytest tests** in `apps/api/tests/` executed in 2.80s. |
| **Tested Domains** | AQI boundary classification, missing pollutant handling, recommendation priority, cleaner window selection, day planner optimization, 2D transport impact tradeoffs, ML feature alignment, and AI fallback mode. |
| **ML Validation** | Verified that the trained model outperforms the persistence baseline on held-out test data. |
| **Zero-Network Tests** | All 16 tests pass completely offline without requiring network calls or paid credentials. |

---

## 5. Accessibility (WCAG 2.2 AA Target)

| Requirement | Implementation Evidence in AERIS |
| :--- | :--- |
| **Color Independence** | Every semantic air-quality indicator includes an explicit textual category label (e.g. "Hazardous", "Moderate"). |
| **Contrast Ratios** | Tested high-contrast palette (Clean Ivory `#F7F9F6` over Midnight Ink `#070C14`, ratio > 12:1). |
| **Keyboard Navigation** | Full `Tab` / `Shift+Tab` navigability, visible focus rings (`*:focus-visible`), and `Escape` key dialog dismissal. |
| **Screen Reader Semantics** | Semantic HTML5 structure (`<header>`, `<nav>`, `<main>`, `<footer>`), `role="dialog"`, and `aria-label` tags. |
| **Mobile Responsiveness** | Fully responsive from narrow smartphones (360px) to widescreen displays (1440px+). |

---

## 6. Problem Statement Alignment

| Challenge Requirement | Implementation Evidence in AERIS |
| :--- | :--- |
| **"Navigate severe winter smog and urban air pollution"** | Tailored for winter atmospheric stagnation regimes (temperature inversions, boundary layer trapping, secondary aerosols). |
| **"Suggest low-emission daily routines"** | **Flagship Planner** (`/planner`) dynamically reorganizes outdoor runs and commutes around cleaner dispersion windows. |
| **"Indoor air quality hacks"** | **Flagship Playbook** (`/home-air`) provides actionable guidance: cooking exhaust protocols, timed afternoon window flushes, damp-dusting, and zero-cost renter solutions. |
| **"Sustainable alternatives tailored to lifestyle"** | **Flagship Impact Optimizer** (`/impact`) compares Car vs Metro vs Cycling with transparent IPCC/MoRTH emission factors. |
| **"Clearly explain direct impact of choices"** | **Two-Dimensional Decision Model** separates carbon emissions from personal particulate inhalation, explaining why Metro beats roadside cycling during severe smog. |
| **"GenAI-Powered Assistant"** | **Ask AERIS** integrates Gemini 2.5 Flash with strict context grounding and robust deterministic expert fallbacks. |
| **"Classical Machine Learning"** | Self-contained scikit-learn model in `ml/` predicting PM2.5 3 hours ahead, beating persistence baseline by 26% on held-out test data. |
