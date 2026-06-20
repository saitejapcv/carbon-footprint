# EcoVisual — Immersive Carbon Footprint & Visual Decay Engine

EcoVisual is an interactive, gamified carbon footprint calculator and educational climate library. It translates abstract ecological data into a tangible, real-time audio-visual decay experience, helping individuals track, understand, and reduce their carbon footprint through simple actions and personalized insights.

---

## 1. Chosen Vertical
* **Climate Tech & Gamified Environmental Education**: This solution targets individuals who want to understand their ecological impact but experience "climate fatigue" from abstract numbers (e.g., *14 tonnes of CO₂e/year*). By coupling calculation inputs directly with a responsive visual decay engine, EcoVisual bridges the gap between lifestyle choices and immediate environmental feedback.
* **Target Audience**: Students, educators, and environmentally conscious individuals seeking a highly interactive, premium, and aesthetic web platform that makes climate science engaging and accessible.

---

## 2. Approach and Logic
* **Immersive Visual Feedback**: A canvas-based leaf particle system represents ecological health. As the calculated pollution factor increases, the visual environment shifts colors from a lush emerald green to amber, orange, and a warning crimson/brown.
* **GPU-Accelerated Tint Decay**: Rather than swapping heavy image assets, static green illustrations shift color dynamically using CSS variable-driven filters (`hue-rotate(Xdeg) saturate(Y) brightness(Z)`) on the GPU, ensuring a buttery-smooth 60 FPS scroll.
* **Intelligent Idle Loops**: To ensure zero CPU/GPU overhead at rest, the `requestAnimationFrame` render loop pauses automatically when the particle canvas is scrolled off-screen and visual transitions have settled. The loop wakes up instantly on scroll, mouse movement, or window resize.
* **Accessibility First**: Focus indicators are styled using the modern CSS `:focus-visible` pseudo-class. Keyboard users navigating tabs, range inputs, and read buttons get high-contrast focus rings without compromising the aesthetics for pointer users (WCAG 2.1 AA compliant).
* **Markdown-to-HTML Translation**: Integrated a custom regex-based parser that handles headers, bold texts, lists, tables, blockquotes, and converts markdown link formatting `[Text](URL)` into secure anchor tags (`target="_blank" rel="noopener noreferrer"`).

---

## 3. How the Solution Works

### A. The Landing (Hero Section)
* **Title Morph**: The massive "ECOVISUAL" title shrinks dynamically to a header nav bar on scroll.
* **Brackets Spring Effect**: A custom spring algorithm translates brackets on the "SCROLL DOWN" indicator, stretching them outward based on mouse speed and settling smoothly when mouse motion stops.

### B. The Assembly (Decay Engine)
* **Image Shatter**: A landscape illustration is sliced into scattered fragments that assemble dynamically as the user scrolls, creating a visual metaphor of ecosystem construction.

### C. The Carbon Calculator (Actionable Tracking)
* **Emissions Math**: Computes daily carbon footprints in kilograms of CO₂ equivalent (kg CO₂e/day) based on inputs across Transport, Home Energy, and Diet/Waste.
* **Personalized Insight Generation**: Dynamically evaluates which category contributes most to the user's footprint (Transport, Energy, or Diet) and appends a **specific action tip** (e.g. *💡 RECOMMENDED ACTION: Your transport emissions are your largest impact source. Try reducing weekly driving by 30 miles (saves ~11 kg CO₂e/day)...*).
* **Decay State logs**: Displays active emissions stage and ecosystem theme name dynamically in the site footer log readout.

### D. Educational Library (Climate Reads)
* **Search & Filters**: Users can browse 15 detailed climate articles in a fullscreen slide-out library overlay, filtering by categories (`action`, `science`, `policy`, `foundational`) and matching text searches in real-time.
* **Reader Modal**: Clicking an article card opens a slide-in reader modal rendered on top of the library with the parsed markdown text.

---

## 4. Assumptions Made

### A. Calculation Benchmarks
* **IPCC Sustainable Target**: Baseline emissions are mapped against an IPCC target of **6.8 kg CO₂e/day** (equivalent to ~2.5 tonnes/year, the maximum sustainable threshold to limit warming to 1.5°C).
* **US Average Benchmark**: The benchmark comparison uses a US Average of **41.1 kg CO₂e/day** (~15 tonnes/year per capita).
* **Calculator Range**: The calculator UI scales from 0 to **55 kg CO₂e/day** on the progress bar.

### B. Emission Factors & Mathematical Formulas (Annual to Daily)
All annual values are computed in metric tonnes of CO₂e, and then converted to daily values in kilograms using:
$$\text{Daily Emissions (kg)} = \frac{\text{Annual Emissions (Tonnes)} \times 1000}{365}$$

1. **Transport**:
   * **Car**: Assumes $\text{carMiles} \text{ (weekly)} \times 52 \times 0.00035$ tonnes/mile ($\approx 0.35$ kg CO₂e/mile).
   * **Flights**: Assumes $0.4$ tonnes CO₂e per flight per year.
   * **Transit**: Assumes $\text{transitMiles} \text{ (weekly)} \times 52 \times 0.0001$ tonnes/mile ($\approx 0.1$ kg CO₂e/mile).

2. **Home Energy**:
   * **Electricity**: Assumes an average utility cost of $\$0.15/\text{kWh}$. The annual bill is divided by $0.15$ to estimate annual energy use, then multiplied by $0.00038$ tonnes CO₂e/kWh ($\approx 0.38$ kg CO₂e/kWh).
   * **Clean Energy Offset**: Directly reduces electricity emissions by the selected percentage: $\text{Electricity Emissions} \times (1 - \text{cleanEnergyShare} / 100)$.
   * **Heating fuel baseline**: Gas ($1.2$ tonnes/year), Electric ($0.3$ tonnes/year), Coal ($2.8$ tonnes/year).

3. **Diet & Waste**:
   * **Diet Profile Baseline**: Heavy meat diet ($2.8$ tonnes/year), Average diet ($1.6$ tonnes/year), Vegetarian diet ($0.8$ tonnes/year).
   * **Local Food Sourcing**: Up to $15\%$ reduction in diet emissions if 100% of food is local: $\text{localReduction} = 1 - 0.15 \times (\text{localShare} / 100)$.
   * **Food Waste**: Up to $40\%$ increase in diet emissions based on waste slider ($0$ to $50$ scale): $\text{wasteIncrease} = 0.40 \times (\text{foodWaste} / 50)$.
   * **Total Diet**: $\text{dietBase} \times (\text{localReduction} + \text{wasteIncrease})$.

### C. Technical & Environment Assumptions
* **Asset Location**: Assumes that the educational articles are stored locally under `content/articles/` named `01-daily-life-carbon-footprint.md` through `15-how-to-talk-to-friends-and-family.md`.
* **Libraries**: Relies on GSAP (GreenSock Animation Platform) and ScrollTrigger loaded via a public CDN for scroll animation triggering and timeline interpolation.
* **Local Timezone**: Uses the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone` to display the active local time zone in the footer dashboard.

---

## 5. Secure Deployment & CD Hardening
* **Live Site URL**: [https://carbon-footprint-saiteja.web.app](https://carbon-footprint-saiteja.web.app)
* **Hosting Platform**: Firebase Hosting (Classic) with secure content distribution via a global CDN.
* **Security Headers Configured**:
  * **HSTS (Strict-Transport-Security)**: Enforces SSL/TLS connections for a duration of 1 year.
  * **Content Security Policy (CSP)**: Restricts asset execution (`default-src 'self'`). Scripts are allowed exclusively from local files and the secure Cloudflare CDN (`https://cdnjs.cloudflare.com`). Font styling resources are locked down to Google Fonts API hosts.
  * **X-Frame-Options (DENY)** & **frame-ancestors 'none'**: Defends the site from clickjacking attacks.
  * **X-Content-Type-Options (nosniff)**: Safeguards against MIME-sniffing vulnerabilities.
  * **Permissions Policy**: Hard-disables accesses to browser hardware sensors (microphone, camera, accelerometer, geolocation, etc.).
* **GitHub Actions Pipeline Security**:
  * **Commit SHA Pinning**: Pinned third-party workflow actions (checkout and deploy) to specific immutable commit SHAs to prevent tag-hijacking supply-chain exploits.
  * **Principle of Least Privilege**: Declared explicit write-level token permissions restrictions (`contents: read`) in continuous deployment tasks.
* **Firebase Ignored Rules**: Excluded developer configuration files, tests (`tests/**`), coverage reports (`coverage/**`), and project manifests (`package.json`, `package-lock.json`, `vitest.config.js`, `playwright.config.js`) from uploading to the public site.

---

## 6. Code Quality & Clean Refactoring
* **Centralized Configuration**: Extracted all magic numbers, emission multipliers, and environment boundaries into a global, documented, and read-only `CONSTANTS` object at the top of `app.js`.
* **Central DOM Reference Cache**: Implemented a central `DOM` reference manager and `updateDOMReferences()` utility function to cache queries. This avoids redundant `document.getElementById` calls during calculations, and prevents stale element references during dynamic DOM replacements (e.g., in unit testing).
* **Standard JSDoc Annotations**: Documented all business logic, color manipulation, and rendering setup functions with detailed JSDoc comment blocks describing parameters, types, outputs, and behaviors.

---

## 7. Automated Testing Suite & Code Coverage
We have integrated a comprehensive testing framework using **Vitest** (under mocked JSDOM) and **Playwright** (for browser-based End-to-End verification).

### A. Testing Structure
1. **Unit & Integration Tests (Vitest + JSDOM)**:
   - **`helpers.test.js`**: Verifies hex normalization and color interpolations.
   - **`markdown.test.js`**: Verifies markdown parsing (headers, lists, blockquotes, tables, links) and checks security sanitization on URL protocols (e.g., blocking `javascript:` links).
   - **`calculations.test.js`**: Verifies carbon calculator calculations and stage/theme changes.
   - **`dom.test.js`**: Verifies mobile drawer controls, library filter/search, article modal rendering, custom video transitions, and HTML character escaping.
2. **E2E Browser Tests (Playwright)**:
   - **`app.spec.js`**: Simulates headless Chrome interactions, testing homepage loading, live slider movements, and article library workflows.

### B. Mocks Setup (`tests/setup.js`)
Stubs web API modules that are unimplemented in JSDOM:
* `IntersectionObserver` & `ResizeObserver` global stubs.
* `GSAP Timeline` & `ScrollTrigger` animation triggers.
* `Canvas 2D Rendering Context` & `HTML5 Video/Audio` player stubs.
* Network `fetch` calls.

### C. Test Metrics
* **Total Tests**: 63 Unit/Integration Tests + 3 E2E Browser Tests (100% Passing).
* **Code Coverage**:
  - **Statements**: 100%
  - **Functions**: 100%
  - **Lines**: 100%
  - **Branches**: 93.95%
* **Available Scripts**:
  - Run unit/integration tests: `npm test`
  - Run E2E tests: `npm run test:e2e`
  - Analyze code coverage: `npm run test:coverage`

