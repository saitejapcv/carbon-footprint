# Carbon Footprint Educational Site — Main Content Pack

**Audience:** general public, 8th-grade reading level  
**License of this document:** original work, free to use  
**Underlying sources:** all public domain (US/UN/EPA/IPCC) or CC BY 4.0  
**Last reviewed:** June 2026

---

## Table of Contents

1. [How to Calculate (Calculator)](#1-how-to-calculate-calculator)
2. [Measures Based on the Calculation](#2-measures-based-on-the-calculation)
3. [Guided Approach to Reduce Your Carbon Footprint](#3-guided-approach-to-reduce-your-carbon-footprint)
4. [Information to Educate People About Carbon Footprint](#4-information-to-educate-people-about-carbon-footprint)
5. [Information About the Measure of Danger (Per Stage)](#5-information-about-the-measure-of-danger-per-stage)

---

## 1. How to Calculate (Calculator)

### 1.1 Plain-language explanation

A personal carbon footprint is the total amount of greenhouse gases (mostly carbon dioxide, CO2) released into the atmosphere by one person's activities in one year. The calculator below sums emissions from four everyday areas:

- **Transport** — cars, motorcycles, buses, trains, flights
- **Home energy** — electricity, natural gas, fuel oil, propane
- **Food** — weekly consumption of common foods
- **Other** — goods and services (handled separately as a multiplier in advanced versions)

The result is in **tonnes (metric tons) of CO2-equivalent per person per year** (t CO2e/yr).

### 1.2 Calculation formula (hard-code-ready)

```js
// === Emission factors ===
// Source: EPA Emission Factors Hub 2024 (US public domain)
// Source: Poore & Nemecek 2018, Science (CC BY 4.0)

const EF = {
  // Transport (kg CO2e per mile)
  car_gasoline_per_mile:  0.404,
  car_diesel_per_mile:    0.430,
  motorcycle_per_mile:    0.180,
  bus_local_per_mile:     0.150,
  rail_per_mile:          0.060,
  flight_short_per_mile:  0.255,   // <1500 mi
  flight_long_per_mile:   0.195,   // >1500 mi, includes radiative forcing

  // Home energy (US national grid average)
  electricity_per_kwh:    0.371,
  natural_gas_per_therm:  53.07,
  fuel_oil_per_gallon:    10.21,
  propane_per_gallon:      5.68,

  // Food (kg CO2e per kg of food)
  food: {
    beef: 60.0, lamb: 24.0, cheese: 21.0, chocolate: 19.0,
    pork: 7.0, poultry: 6.0, eggs: 4.5, rice: 4.0,
    tofu: 3.0, milk: 3.2, beans: 0.9,
    vegetables: 0.5, fruits: 0.5, farmed_fish: 5.0
  }
};

function calculateFootprint(i) {
  let kg = 0;

  // Transport
  kg += (i.carMiles        || 0) * EF.car_gasoline_per_mile;
  kg += (i.motorcycleMiles || 0) * EF.motorcycle_per_mile;
  kg += (i.busMiles        || 0) * EF.bus_local_per_mile;
  kg += (i.railMiles       || 0) * EF.rail_per_mile;
  kg += (i.flightShortMiles|| 0) * EF.flight_short_per_mile;
  kg += (i.flightLongMiles || 0) * EF.flight_long_per_mile;

  // Home energy
  kg += (i.electricityKwh    || 0) * EF.electricity_per_kwh;
  kg += (i.naturalGasTherms  || 0) * EF.natural_gas_per_therm;
  kg += (i.fuelOilGallons    || 0) * EF.fuel_oil_per_gallon;
  kg += (i.propaneGallons    || 0) * EF.propane_per_gallon;

  // Food (i.food = { beef: 0.3, ... } in kg per week)
  if (i.food) {
    for (const [k, kgPerWeek] of Object.entries(i.food)) {
      const ef = EF.food[k];
      if (ef) kg += kgPerWeek * 52 * ef;
    }
  }

  return kg / 1000; // tonnes CO2e per year
}
```

### 1.3 Score to stage mapping

| Stage | Score band | Tonnes CO2e/yr | Real-world meaning |
|-------|------------|----------------|--------------------|
| 1 — Lush | 0–20% | 0 – 4 | At or below IPCC 1.5°C target |
| 2 — Early damage | 21–40% | 4 – 8 | Around global average |
| 3 — Tipping point | 41–60% | 8 – 12 | EU / UK developed-world average |
| 4 — Severe damage | 61–80% | 12 – 16 | US / Canada / Australia range |
| 5 — Collapse | 81–100% | 16 – 20+ | Top 10% global emitters |

```js
function stageFromTonnes(t) {
  if (t <  4) return 1;
  if (t <  8) return 2;
  if (t < 12) return 3;
  if (t < 16) return 4;
  return 5;
}
```

Anchored to **IPCC SR1.5 ~2.5 t/person by 2030** (public domain) and **UNEP 2023 global average ~4.7 t/person** (public domain).

---

## 2. Measures Based on the Calculation

Each stage links to one open-source consequence fact that matches your on-screen animation.

### 2.1 Stage 1 (0–4 t): Lush, thriving ecosystem

- Most tree species still show no climate-driven range loss.
- ~70–90% of warm-water coral reefs remain viable.
- *Source:* IPCC AR6 WG2 Ch. 2 — public domain — [ipcc.ch/report/ar6/wg2/chapter/chapter-2](https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/)
- *Source:* IPCC SR1.5 Ch. 3 — public domain — [ipcc.ch/sr15/chapter/chapter-3](https://www.ipcc.ch/sr15/chapter/chapter-3/)

### 2.2 Stage 2 (4–8 t): Early damage

- Rivers and lakes show more algal blooms because warmer water holds less oxygen.
- Trees shed leaves earlier in autumn; bird migration shifts by days to weeks.
- *Source:* EPA Climate Indicators — public domain — [epa.gov/climate-indicators](https://www.epa.gov/climate-indicators)
- *Source:* NASA Earth Observatory — public domain — [earthobservatory.nasa.gov](https://earthobservatory.nasa.gov/)

### 2.3 Stage 3 (8–12 t): Tipping point

- ~70–90% of warm-water coral reefs lost.
- Heat waves that used to happen once a decade now hit major cities every 2–3 years.
- *Source:* IPCC SR1.5 Ch. 3 — public domain — [ipcc.ch/sr15/chapter/chapter-3](https://www.ipcc.ch/sr15/chapter/chapter-3/)
- *Source:* IPCC AR6 WG1 Ch. 11 — public domain — [ipcc.ch/report/ar6/wg1/chapter/chapter-11](https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/)

### 2.4 Stage 4 (12–16 t): Severe damage

- US Western wildfire seasons are roughly 3 months longer than in the 1970s.
- Plankton populations at the base of ocean food webs have declined in many regions.
- *Source:* EPA Climate Indicators — public domain — [epa.gov/climate-indicators](https://www.epa.gov/climate-indicators)
- *Source:* NOAA Climate.gov — public domain — [climate.gov](https://www.climate.gov/)

### 2.5 Stage 5 (16+ t): Total collapse

- The Amazon risks flipping from rainforest to savanna under this emission path.
- Multi-meter sea-level rise becomes locked in over centuries.
- *Source:* Lovejoy & Nobre 2018, *Nature Climate Change* — open-access — [doi.org/10.1038/s41558-017-0033-0](https://doi.org/10.1038/s41558-017-0033-0) *(verify exact license)*
- *Source:* IPCC AR6 WG1 Ch. 9 — public domain — [ipcc.ch/report/ar6/wg1/chapter/chapter-9](https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/)

---

## 3. Guided Approach to Reduce Your Carbon Footprint

Tiered from cheapest daily swaps to systemic action. Every line is anchored to a public source.

### 3.1 Daily swaps (no cost) — moves you ~0.5–1 t/yr

- Swap one car commute per day for walking, biking, transit, or remote work.
- Replace one beef meal per week with beans or tofu (saves ~250 kg CO2e per meal).
- Lower heating thermostat 1°C in winter, raise 1°C in summer.
- *Source:* EPA household emissions guidance — public domain — [epa.gov](https://www.epa.gov/)
- *Source:* Poore & Nemecek 2018, *Science* — CC BY 4.0 — [science.org/doi/10.1126/science.aaq0216](https://www.science.org/doi/10.1126/science.aaq0216)
- *Source:* IEA Energy Efficiency — [iea.org/energy-efficiency](https://www.iea.org/energy-efficiency) *(verify license)*

### 3.2 Home upgrades (low–medium cost) — moves you ~1–3 t/yr

- Switch to a heat pump for heating and cooling (cuts home-energy emissions ~50–70%).
- Insulate attic and seal air leaks.
- Switch to a green-electricity tariff where available.
- *Source:* IEA heat-pump report — [iea.org/reports/heat-pumps](https://www.iea.org/reports/heat-pumps) *(verify license)*
- *Source:* EPA ENERGY STAR — public domain — [energystar.gov](https://www.energystar.gov/)
- *Source:* EPA Green Power — public domain — [epa.gov/greenpower](https://www.epa.gov/greenpower)

### 3.3 Transport upgrades (medium cost) — moves you ~2–5 t/yr

- Choose a used EV or efficient hybrid for your next car purchase.
- Drop one round-trip long-haul flight per year (saves ~1.5 t CO2).
- *Source:* EPA Green Vehicle Guide — public domain — [epa.gov/greenvehicles](https://www.epa.gov/greenvehicles)
- *Source:* IPCC AR6 WG3 Ch. 9 (aviation) — public domain — [ipcc.ch/report/ar6/wg3/chapter/chapter-9](https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-9/)

### 3.4 Diet and consumption redesign — moves you ~1–3 t/yr

- Shift toward mostly plant-based eating.
- Reduce new goods purchases; favor second-hand, repair, and share.
- *Source:* Poore & Nemecek 2018 — CC BY 4.0 — [science.org/doi/10.1126/science.aaq0216](https://www.science.org/doi/10.1126/science.aaq0216)
- *Source:* UNEP Life-cycle guidance — public domain — [unep.org](https://www.unep.org/)

### 3.5 Systemic action (for high emitters) — moves you ~5+ t/yr

- Move closer to work or switch to remote; car-light living.
- Electrify everything available (cooking, heating, transport).
- Use your vote and voice for carbon pricing, public transit, and building electrification.
- Avoid paid carbon offsets as a primary strategy — most lack integrity.
- *Source:* IPCC AR6 WG3 — public domain — [ipcc.ch/report/ar6/wg3](https://www.ipcc.ch/report/ar6/wg3/)
- *Source:* UNEP "Integrity Matters" — public domain — [unep.org](https://www.unep.org/)

---

## 4. Information to Educate People About Carbon Footprint

### 4.1 What is a carbon footprint?

A carbon footprint is the total amount of greenhouse gases — mostly carbon dioxide (CO2) — that your everyday activities release into the air. Driving a car, flying on a plane, heating a home, eating food that was farmed and shipped long distances, and buying factory-made goods all burn fuel or energy and therefore release CO2. Those gases act like a blanket around the planet, trapping heat and changing the climate. The bigger your carbon footprint, the larger your share of that warming.

*Source:* NASA Climate Kids — public domain — [climatekids.nasa.gov](https://climatekids.nasa.gov/)

### 4.2 Why does it matter?

- Each 1°C of warming lets the atmosphere hold about 7% more water vapor, which is why storms and floods get worse the more we emit.
- The poorest half of the world causes only ~10% of emissions but suffers ~75% of the climate damages.

*Source:* IPCC AR6 WG1 Ch. 8 — public domain — [ipcc.ch/report/ar6/wg1/chapter/chapter-8](https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/)
*Source:* IPCC AR6 WG2 Ch. 16 — public domain — [ipcc.ch/report/ar6/wg2/chapter/chapter-16](https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-16/)

### 4.3 What is a fair share?

- **2.5 t CO2e/person/yr by 2030** keeps warming near 1.5°C.
- **4.7 t** is the current global average (2022).
- **14–15 t** is the current US / Canada / Australia average.
- **6–8 t** is the current EU / UK / Japan average.

*Source:* IPCC SR1.5 — public domain — [ipcc.ch/sr15](https://www.ipcc.ch/sr15/)
*Source:* UNEP Emissions Gap 2023 — public domain — [unep.org/resources/emissions-gap-report-2023](https://www.unep.org/resources/emissions-gap-report-2023)
*Source:* Our World in Data — CC BY 4.0 — [ourworldindata.org/co2-and-greenhouse-gas-emissions](https://ourworldindata.org/co2-and-greenhouse-gas-emissions)

### 4.4 How individual choices scale to global harm

- One round-trip transatlantic flight (~8 hours) emits roughly 1.5 t CO2 per passenger — equal to a full year of driving a small EV on a clean grid.
- Eating beef three times a week adds ~1.5 t CO2/yr — about the same as 4,000 miles in an average gasoline car.
- The richest 10% of the world's population is responsible for ~50% of global emissions; the poorest 50% for ~10%.
- Every 1°C of warming increases the air's water-vapor capacity by ~7%.

*Source:* IPCC AR6 WG3 — public domain
*Source:* World Inequality Lab — CC BY 4.0 — [wid.world](https://wid.world/)
*Source:* Poore & Nemecek 2018 — CC BY 4.0

---

## 5. Information About the Measure of Danger (Per Stage)

On-screen captions matched to your animation, each anchored to an open source.

### 5.1 Stage 1 (0–4 t): Lush, thriving ecosystem

> With per-person emissions this low, ecosystems stay in balance: forests grow, rivers run clear, and most species can adapt to local conditions.

*Source:* IPCC AR6 WG2 Ch. 2 — public domain

### 5.2 Stage 2 (4–8 t): Early damage

> Damage is visible but local: trees shed leaves out of season, lakes and rivers develop algal blooms, and bird migrations shift by days to weeks.

*Source:* EPA Climate Indicators + NASA Earth Observatory — public domain

### 5.3 Stage 3 (8–12 t): Tipping point

> The climate has crossed regional tipping points: 70–90% of warm-water coral reefs lost, half of all tree species show drought stress, and once-a-decade heat waves now hit every 2–3 years.

*Source:* IPCC SR1.5 Ch. 3 — public domain

### 5.4 Stage 4 (12–16 t): Severe damage

> Severe damage: wildfire seasons months longer, plankton declines at the base of ocean food webs, and the first human-caused permanent extinctions of mammals and amphibians.

*Source:* EPA Climate Indicators + NOAA Climate.gov — public domain

### 5.5 Stage 5 (16+ t): Total collapse

> Total collapse: parts of the Amazon flip from rainforest to savanna, multi-meter sea-level rise locks in over centuries, and large regions of farmland can no longer grow traditional crops.

*Source:* Lovejoy & Nobre 2018 *(verify license)* + IPCC AR6 WG1 Ch. 9 — public domain

---

## Quick Reference Table

| Topic | Source | License |
|-------|--------|---------|
| Global per-capita average (4.7 t) | UNEP Emissions Gap 2023 | Public domain |
| 1.5°C target (~2.5 t) | IPCC SR1.5 | Public domain |
| Emission factors (transport, energy) | EPA Emission Factors Hub | Public domain |
| Food emission factors | Poore & Nemecek 2018, Science | CC BY 4.0 |
| Country emissions data | Our World in Data | CC BY 4.0 |
| Carbon pricing data | OECD Effective Carbon Rates | CC BY 4.0 |
| Climate inequality data | World Inequality Lab | CC BY 4.0 |

See `content/sources-and-credits.md` for full attribution and license-compliance guide.
