# PLAN.md — Witmind Frontend Structural MVP

> **Notice:** This document is superseded by `plan-v2.md` (Witmind Mock Lab / Simulation Architecture) wherever conflicting requirements exist (specifically SQLite persistence, editable scenarios, physical curves, and reproducible simulation).

## 0. Purpose of this document

This file is the **primary implementation guide** for any AI or developer working on the Witmind frontend structural MVP.

The goal is to eliminate ambiguity.

The implementer must treat this document as the source of truth for:

- scope;
- architecture;
- data flow;
- frontend structure;
- responsive behavior;
- mock behavior;
- simulation behavior;
- component responsibilities;
- implementation order;
- validation;
- testing;
- acceptance criteria;
- explicit exclusions.

If an implementation decision conflicts with this document, this document takes precedence unless the user explicitly changes the requirement.

This project is **not** currently focused on visual polish.

The current priority is:

1. information architecture;
2. frontend architecture;
3. deterministic mock behavior;
4. responsive layout;
5. reusable components;
6. clean state flow;
7. future compatibility with Home Assistant;
8. demonstrable business value.

The frontend must make it possible to demonstrate that Witmind:

- observes context;
- makes a decision;
- changes an operating condition;
- explains why;
- quantifies the impact.

The MVP must work **without Home Assistant, without real devices, without a backend, and without real dimmers**.

---

# 1. Mandatory first step: install and use Impeccable

Before implementing UI structure or styling, the AI/developer MUST run:

```bash
npx impeccable install
```

This is not optional.

The implementation must use the installed Impeccable skill/guidance as an additional frontend quality reference.

## 1.1 How Impeccable must be used in this project

Impeccable is NOT a license to redesign the scope.

Its role is to help the implementer produce:

- structurally coherent layouts;
- readable hierarchy;
- consistent spacing;
- sensible responsive behavior;
- usable interaction states;
- accessible controls;
- clean component composition.

The AI must prioritize the requirements in this document over visual experimentation.

If Impeccable recommends an aesthetic choice that increases complexity without helping structure or responsive usability, do NOT implement that extra complexity.

### Required Impeccable usage sequence

1. Run:

```bash
npx impeccable install
```

2. Read the generated/installed instructions available in the project.
3. Extract only the guidance relevant to:
   - layout;
   - hierarchy;
   - spacing;
   - responsive behavior;
   - accessibility;
   - component clarity;
   - interaction states.
4. Apply that guidance consistently.
5. Do not introduce decorative complexity that makes the structural prototype harder to evaluate.

## 1.2 Visual constraint

The MVP must remain visually basic.

Allowed:

- neutral background;
- simple borders;
- simple spacing;
- typographic hierarchy;
- responsive grids;
- basic buttons;
- simple status labels;
- basic charts;
- simple progress bars/sliders;
- plain cards;
- minimal icons only where they improve comprehension.

Avoid:

- gradients;
- glassmorphism;
- heavy shadows;
- animated backgrounds;
- decorative illustrations;
- complex motion systems;
- marketing hero sections;
- expensive visual effects;
- elaborate theming;
- custom 3D;
- unnecessary SVG decoration;
- excessive iconography.

The objective is to validate **structure before appearance**.

---

# 2. Product objective

The frontend must demonstrate the transition from:

```text
Remote control dashboard
```

to:

```text
Context-aware building assistant
```

The interface must show not only what devices are doing, but also:

```text
WHAT happened
WHY Witmind acted
WHAT Witmind changed
WHAT impact that action produced
```

The core product narrative is:

> Witmind reduces operational waste and repetitive decisions by observing context, acting within defined rules, and explaining the result.

The frontend must communicate this concept using mocks only.

---

# 3. MVP scope

The frontend MVP consists of exactly five primary views:

1. Overview
2. Lighting
3. Climate
4. Activity
5. Simulator

These views must be navigable in all supported responsive sizes.

Do not create additional primary pages unless required by a concrete implementation need.

---

# 4. Explicitly out of scope

The following are NOT part of this MVP:

- Home Assistant connection;
- Home Assistant WebSocket implementation;
- Home Assistant REST implementation;
- YAML automation changes;
- Python backend;
- database;
- authentication;
- user accounts;
- RBAC;
- persistence across server sessions;
- real notifications;
- push notifications;
- real calendar integration;
- real occupancy sensors;
- real lux sensors;
- real dimmers;
- real energy meters;
- machine learning;
- AI inference;
- real anomaly detection;
- BIM;
- IFC;
- floor plans;
- 3D visualization;
- multi-building management;
- production deployment;
- branding refinement;
- final design system;
- final typography;
- dark mode unless trivial;
- localization beyond basic text organization;
- analytics backend;
- billing;
- commercial pricing.

Do not add these because they "might be useful later."

The architecture may leave extension points for them, but they must not be implemented now.

---

# 5. Technology baseline

Use:

```text
Vite
TypeScript
Lit
Web Components
CSS
Apache ECharts
```

Preferred package manager:

```text
npm
```

The application must run with:

```bash
npm install
npm run dev
```

The application must build with:

```bash
npm run build
```

No framework switch is allowed unless explicitly requested.

Do not replace Lit with:

- React;
- Vue;
- Angular;
- Svelte.

Do not introduce a large UI framework.

Avoid:

- Material UI;
- Bootstrap;
- Chakra;
- Ant Design;
- Prime;
- large component kits.

Tailwind is not required and should not be introduced unless it solves a concrete problem that plain CSS cannot reasonably solve.

---

# 6. Primary architectural rule

No component or view may import mock data directly.

Wrong:

```text
overview-view.ts
    ↓
energy.mock.ts
```

Correct:

```text
View
 ↓
Component
 ↓
Store
 ↓
Service
 ↓
Adapter
 ↓
Mock source
```

Future target:

```text
View
 ↓
Component
 ↓
Store
 ↓
Service
 ↓
Adapter
 ↓
Home Assistant
```

This separation is mandatory.

The frontend must not know whether data comes from:

- mocks;
- Home Assistant;
- REST;
- WebSocket;
- another backend.

---

# 7. Required project structure

Use this structure or a very close equivalent:

```text
witmind-demo/
│
├── src/
│   │
│   ├── app/
│   │   ├── app-shell.ts
│   │   ├── router.ts
│   │   └── navigation.ts
│   │
│   ├── views/
│   │   ├── overview/
│   │   │   └── overview-view.ts
│   │   ├── lighting/
│   │   │   └── lighting-view.ts
│   │   ├── climate/
│   │   │   └── climate-view.ts
│   │   ├── activity/
│   │   │   └── activity-view.ts
│   │   └── simulator/
│   │       └── simulator-view.ts
│   │
│   ├── components/
│   │   ├── metric-card/
│   │   ├── status-card/
│   │   ├── zone-card/
│   │   ├── chart-card/
│   │   ├── activity-item/
│   │   ├── recommendation-card/
│   │   ├── lighting-zone/
│   │   ├── climate-zone/
│   │   └── responsive-grid/
│   │
│   ├── services/
│   │   ├── energy.service.ts
│   │   ├── lighting.service.ts
│   │   ├── climate.service.ts
│   │   ├── activity.service.ts
│   │   └── demo.service.ts
│   │
│   ├── api/
│   │   ├── adapters/
│   │   │   ├── mock.adapter.ts
│   │   │   └── home-assistant.adapter.ts
│   │   └── contracts/
│   │
│   ├── stores/
│   │   ├── building.store.ts
│   │   ├── energy.store.ts
│   │   ├── climate.store.ts
│   │   └── demo.store.ts
│   │
│   ├── models/
│   │   ├── building.ts
│   │   ├── zone.ts
│   │   ├── occupancy.ts
│   │   ├── energy.ts
│   │   ├── lighting.ts
│   │   ├── climate.ts
│   │   └── activity.ts
│   │
│   ├── mocks/
│   │   ├── building.mock.ts
│   │   ├── energy.mock.ts
│   │   ├── lighting.mock.ts
│   │   ├── climate.mock.ts
│   │   ├── activity.mock.ts
│   │   └── scenarios/
│   │       ├── normal-day.ts
│   │       ├── high-daylight.ts
│   │       ├── empty-office.ts
│   │       ├── meeting.ts
│   │       └── after-hours.ts
│   │
│   └── styles/
│       ├── reset.css
│       ├── layout.css
│       └── tokens.css
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── PLAN.md
```

If the implementation uses different filenames, preserve the same separation of responsibilities.

---

# 8. Domain model

The UI must be built around a domain model, not directly around Home Assistant entity IDs.

## 8.1 Building

```ts
export interface Building {
  id: string;
  name: string;
  zones: Zone[];
}
```

## 8.2 Zone

```ts
export type ZoneType =
  | "office"
  | "showroom"
  | "meeting"
  | "corridor";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  occupancy: OccupancyState;
  lighting?: LightingState;
  climate?: ClimateState;
}
```

## 8.3 Occupancy

```ts
export interface OccupancyState {
  occupied: boolean;
  lastChangedAt: string;
  absenceMinutes: number;
}
```

## 8.4 Lighting

```ts
export type ControlMode = "auto" | "manual";

export interface LightingState {
  brightness: number;

  targetLux: number;
  currentLux: number;
  daylightLux: number;

  nominalPowerW: number;
  actualPowerW: number;
  baselinePowerW: number;

  mode: ControlMode;

  withinTarget: boolean;

  manualOverrideUntil?: string | null;
}
```

Rules:

- `brightness`: integer or decimal from 0 to 100.
- `targetLux`: desired total illuminance.
- `daylightLux`: contribution attributed to natural light.
- `currentLux`: simulated resulting total illuminance.
- `baselinePowerW`: power expected without adaptive optimization.
- `actualPowerW`: simulated current power.
- `withinTarget`: whether illumination is inside accepted limits.

## 8.5 Climate

```ts
export interface ClimateState {
  currentTemperature: number;
  targetTemperature: number;

  minComfortTemperature: number;
  maxComfortTemperature: number;

  mode: "auto" | "manual" | "off";

  withinTarget: boolean;

  timeWithinTargetPercent: number;

  manualOverrideUntil?: string | null;
}
```

## 8.6 Energy impact

```ts
export interface OptimizationImpact {
  energyBaselineKwh: number;
  energyActualKwh: number;
  energySavedKwh: number;

  savingsPercent: number;
  moneySaved: number;

  automatedActions: number;
}
```

## 8.7 Smart activity

```ts
export type ActivityCategory =
  | "energy"
  | "lighting"
  | "climate"
  | "occupancy"
  | "system";

export interface SmartActivity {
  id: string;
  timestamp: string;

  category: ActivityCategory;

  title: string;

  reason: string;

  action: string;

  impact?: {
    wattsSaved?: number;
    energySavedKwh?: number;
    moneySaved?: number;
    savingsPercent?: number;
  };

  source: "automation" | "recommendation" | "user";
}
```

---

# 9. Mock architecture

Mocks must behave like an interchangeable backend.

The UI must not read mock objects directly.

## 9.1 Required adapter contract

Define an interface similar to:

```ts
export interface WitmindDataAdapter {
  getBuilding(): Promise<Building>;

  getEnergyOverview(): Promise<OptimizationImpact>;

  getActivities(): Promise<SmartActivity[]>;

  getLightingZones(): Promise<Zone[]>;

  getClimateZones(): Promise<Zone[]>;

  applyScenario(id: string): Promise<void>;

  updateSimulationInput(
    zoneId: string,
    input: SimulationInput
  ): Promise<void>;
}
```

The mock implementation should satisfy this contract.

A future `HomeAssistantAdapter` can implement the same contract.

Do not implement actual Home Assistant communication now.

The future adapter may exist as a stub only.

---

# 10. Deterministic simulation

Random data is prohibited for primary demos.

Do NOT use uncontrolled:

```js
Math.random()
```

for values shown during demo flows.

The demo must be reproducible.

## 10.1 Required scenarios

Implement at least:

```text
normal-day
high-daylight
empty-office
meeting
after-hours
```

Each scenario must have:

- id;
- display name;
- description;
- initial state;
- deterministic timeline;
- expected decisions;
- expected impacts.

Example:

```ts
export interface DemoScenario {
  id: string;
  name: string;
  description: string;

  initialState: DemoState;

  timeline: DemoTimelineEvent[];
}
```

Timeline event:

```ts
export interface DemoTimelineEvent {
  atSecond: number;

  zoneId: string;

  changes: Partial<SimulationInput>;
}
```

---

# 11. Demo engine

Create a small `DemoEngine`.

Responsibilities:

1. load a scenario;
2. reset to known initial state;
3. advance deterministic events;
4. publish simulated inputs;
5. calculate automation decisions;
6. update stores;
7. generate activity records;
8. update energy impact;
9. expose start/pause/reset controls.

Do not place simulation rules inside UI components.

Required flow:

```text
Scenario
   ↓
Demo Engine
   ↓
Mock sensors
   ↓
Decision logic
   ↓
Store
   ↓
UI
```

---

# 12. Lighting simulation rules

Use simple deterministic logic.

The exact values are demonstration values, not real engineering guarantees.

## 12.1 Default behavior

When zone is occupied and control mode is `auto`:

Example decision table:

```text
daylight < 150 lux      → brightness 100%
150–299 lux             → brightness 75%
300–399 lux             → brightness 55%
400–449 lux             → brightness 35%
450–499 lux             → brightness 15%
>= 500 lux              → brightness 0–10%
```

The exact threshold implementation can be adjusted slightly, but must remain deterministic and documented.

## 12.2 Absence behavior

Example:

```text
occupied = false
absence < 5 min     → preserve current level
absence 5–9 min     → reduce to 20%
absence >= 10 min   → brightness 0%
```

## 12.3 Manual override

When the user manually changes brightness:

```text
mode = manual
```

The system must not immediately overwrite the value.

The UI should show something like:

```text
AUTO paused
Manual override until 16:30
```

A mock timeout or simulated expiry may return control to `auto`.

---

# 13. Lighting power model

For the MVP only:

```text
actualPowerW = nominalPowerW × brightness / 100
```

Example:

```text
nominal = 144 W
brightness = 50%
actual = 72 W
```

Use:

```text
savedPowerW = baselinePowerW - actualPowerW
```

This is a demo approximation.

Do not describe it as certified real electrical behavior.

---

# 14. Climate simulation rules

Use a simple deterministic thermal model.

The objective is not HVAC engineering accuracy.

The objective is to demonstrate:

```text
current temperature
target temperature
comfort range
recommendation
preconditioning
time within target
```

## 14.1 Default comfort range

Example:

```text
target = 23 °C
accepted range = 22–24 °C
```

Then:

```text
22 <= currentTemperature <= 24
```

means:

```text
withinTarget = true
```

## 14.2 Time within target

Example:

Working period:

```text
08:00–16:00
```

Eight hours total.

If temperature stayed inside accepted range for 6 hours:

```text
timeWithinTargetPercent = 75
```

Display:

```text
Within target: 75% of occupied time
```

This KPI must not be confused with HVAC runtime.

---

# 15. Meeting preconditioning mock

Create a deterministic upcoming event.

Example:

```text
Meeting
15:00

Current time in demo
14:48

Current temperature
26.1 °C

Target
23 °C

Estimated conditioning time
10 min
```

UI recommendation:

```text
Upcoming meeting in 12 min

The room is currently at 26.1 °C.
Target is 23 °C.

Witmind recommends starting climate conditioning now.
```

Actions:

```text
PRECONDITION
SKIP
```

If precondition is accepted:

- generate activity;
- set climate to active/auto;
- start deterministic temperature movement;
- show resulting status.

---

# 16. Smart activity model

The Activity view is not a technical log.

Never expose internal implementation language such as:

```text
automation.witmind_xyz triggered
service climate.set_temperature called
```

Primary feed entries must be human-readable.

Every automation-generated activity should answer:

```text
WHAT happened?
WHY?
WHAT action was taken?
WHAT impact resulted?
```

Example:

```text
14:22
Lighting optimized

Reason:
Natural daylight increased to 680 lux.

Action:
Lighting reduced from 100% to 35%.

Impact:
Estimated reduction of 94 W.
```

---

# 17. View 1 — Overview

Route:

```text
/
```

or:

```text
/overview
```

Purpose:

Allow a user to understand the building state in under five seconds.

## 17.1 Required sections

1. global operational status;
2. KPI summary;
3. current optimization;
4. zone summary;
5. recent smart activity;
6. active recommendation if any.

## 17.2 KPI cards

Show at least:

```text
Energy reduction
Energy saved
Automated actions
Comfort / target compliance
```

Example mock values:

```text
24%
4.8 kWh
31
94%
```

These values must come from state/store data.

Do not hardcode display text independently from store values.

## 17.3 Desktop structure

Conceptual:

```text
┌─────────────────────────────────────────────────────┐
│ Header                                              │
├──────────┬──────────┬──────────┬───────────────────┤
│ KPI      │ KPI      │ KPI      │ KPI               │
├──────────────────────────────┬──────────────────────┤
│ Main energy / optimization   │ Recent activity      │
├───────────────┬──────────────┼──────────────────────┤
│ Zone          │ Zone         │ Recommendation       │
└───────────────┴──────────────┴──────────────────────┘
```

## 17.4 Mobile structure

Single column only.

No important information may depend on hover.

---

# 18. View 2 — Lighting

Route:

```text
/lighting
```

Purpose:

Demonstrate adaptive lighting and simulated dimming.

## 18.1 Required summary

Show:

```text
Current lighting power
Baseline power
Instant reduction %
Energy saved today
```

## 18.2 Required zone information

Each lighting zone must show:

- zone name;
- occupancy;
- daylight lux;
- target lux;
- current lux;
- brightness percentage;
- current power;
- baseline power;
- instant saved watts;
- control mode;
- target compliance;
- manual override state if active.

## 18.3 Required interaction

The simulator must be capable of changing:

- presence;
- daylight;
- brightness manually;
- control mode.

Changes must propagate to:

- lighting view;
- overview KPI;
- energy calculation;
- chart;
- activity feed.

---

# 19. View 3 — Climate

Route:

```text
/climate
```

Purpose:

Demonstrate target comfort and contextual preconditioning.

## 19.1 Required climate card

Show:

```text
Current temperature
Target temperature
Accepted range
Within target: yes/no
Time within target %
Mode
```

## 19.2 Required recommendation

At least one scenario must show:

```text
Upcoming meeting
time remaining
current temperature
target temperature
estimated conditioning time
```

Actions:

```text
PRECONDITION
SKIP
```

---

# 20. View 4 — Activity

Route:

```text
/activity
```

Purpose:

Show the building's explainable decision history.

## 20.1 Required filters

Keep filters minimal.

At least:

```text
All
Energy
Lighting
Climate
Occupancy
```

Do not build advanced search.

## 20.2 Required activity fields

Every item:

- timestamp;
- category;
- title;
- reason;
- action;
- optional impact;
- source.

---

# 21. View 5 — Simulator

Route:

```text
/simulator
```

This is a development/demo tool.

It is not intended as a production customer screen.

## 21.1 Required controls

At minimum:

```text
Zone selector
Presence toggle
Daylight slider
Temperature slider
Brightness override
Control mode
Upcoming event selector
Scenario buttons
Reset
Start
Pause
```

## 21.2 Required scenarios

Buttons:

```text
Normal day
High daylight
Empty office
Upcoming meeting
After hours
```

## 21.3 Simulator status

Always show:

```text
DEMO MODE
```

The user must never confuse simulation values with production telemetry.

---

# 22. Charts

Use Apache ECharts.

Do not create a chart abstraction more complex than necessary.

Only implement three chart families initially.

## 22.1 Energy

Show:

```text
Baseline vs optimized
```

Prefer line or area comparison.

## 22.2 Lighting

Show over time:

```text
daylight lux
brightness %
```

If different units make one axis unreadable, use dual axes.

## 22.3 Climate

Show:

```text
actual temperature
target temperature
accepted range
```

The accepted range can be represented as a simple band if practical.

Avoid:

- pie charts;
- donuts;
- gauges;
- radar charts;
- Sankey;
- heatmaps;
- 3D charts.

Unless explicitly requested later.

---

# 23. Responsive requirements

Responsive behavior is a primary acceptance requirement.

The application must be tested at minimum at:

```text
360 px
390 px
430 px
768 px
820 px
1024 px
1280 px
1440 px
1920 px
```

## 23.1 Smartphone

Definition:

```text
< 640 px
```

Rules:

- one-column layout;
- no horizontal page scrolling;
- navigation collapses;
- controls remain touch friendly;
- charts must fit width;
- no table dependency;
- activity items stack vertically;
- cards use full width;
- long text wraps;
- no hover-only information.

## 23.2 Tablet

Definition:

```text
640 px – 1023 px
```

Rules:

- mostly two-column layouts;
- sidebar may collapse;
- charts may span both columns;
- controls should not become compressed;
- KPI cards may be 2×2.

## 23.3 Desktop

Definition:

```text
>= 1024 px
```

Rules:

- use a 12-column conceptual grid;
- avoid extremely wide unreadable content;
- place activity beside analytics when useful;
- allow KPI cards in one row when enough width exists.

---

# 24. Same components across breakpoints

Do NOT create:

```text
overview-mobile.ts
overview-tablet.ts
overview-desktop.ts
```

Use the same component tree.

Responsive adaptation must happen through:

- CSS Grid;
- Flexbox;
- container behavior;
- media queries.

Example:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
}
```

---

# 25. Navigation

## 25.1 Desktop

Use a simple left sidebar or equivalent persistent navigation.

Items:

```text
Overview
Lighting
Climate
Activity
Simulator
```

## 25.2 Tablet

Navigation may collapse.

## 25.3 Smartphone

Use a compact top bar with menu trigger.

Do not implement a complicated mobile navigation system.

---

# 26. State management

Avoid a heavy state management dependency unless necessary.

The architecture must still clearly separate:

```text
state
actions
derived values
subscriptions
```

At minimum maintain:

```text
buildingStore
energyStore
climateStore
demoStore
```

The implementation may combine stores if it remains clean and testable.

## 26.1 State update rule

UI controls must never mutate arbitrary objects directly.

Required conceptual flow:

```text
UI event
 ↓
service/action
 ↓
store update
 ↓
derived values
 ↓
reactive UI update
```

---

# 27. Derived state

Do not store values that can be reliably derived unless needed for clarity.

Examples:

```text
savedPowerW = baselinePowerW - actualPowerW
```

```text
savingsPercent =
savedPowerW / baselinePowerW × 100
```

Protect division by zero.

Example:

```ts
const savingsPercent =
  baselinePowerW > 0
    ? ((baselinePowerW - actualPowerW) / baselinePowerW) * 100
    : 0;
```

---

# 28. Numeric consistency

Mocks must be mathematically coherent.

If:

```text
nominalPower = 144 W
brightness = 50%
```

then:

```text
actualPower = 72 W
```

If actual energy is lower than baseline energy:

```text
savedEnergy = baseline - actual
```

No UI should independently invent a conflicting value.

One source of truth only.

---

# 29. Mock time

The demo should use controllable simulated time.

Avoid dependence on the real wall clock for deterministic scenarios.

Recommended:

```ts
interface DemoClock {
  now(): Date;
  set(date: Date): void;
  advanceMinutes(minutes: number): void;
}
```

This allows:

- meeting countdown;
- absence timing;
- activity timestamps;
- after-hours scenarios;
- repeatable demos.

---

# 30. Scenario behavior

## 30.1 Normal day

Expected:

- occupied office;
- moderate daylight;
- lighting partially dimmed;
- climate within target;
- no urgent recommendations.

## 30.2 High daylight

Expected:

- occupied office;
- daylight increases;
- brightness decreases;
- power drops;
- activity item generated;
- savings KPI increases.

## 30.3 Empty office

Expected:

- occupancy becomes false;
- absence timer advances;
- after 5 min brightness reduces;
- after 10 min lighting turns off;
- activity entries explain both steps;
- savings increases.

## 30.4 Upcoming meeting

Expected:

- meeting in ~10–15 min;
- room outside target temperature;
- recommendation shown;
- user can precondition;
- accepting recommendation changes climate state;
- activity entry generated.

## 30.5 After hours

Expected:

- occupied = false;
- lighting still on initially;
- system detects after-hours waste;
- recommendation or auto-action is generated;
- activity explains avoided consumption.

---

# 31. Component responsibilities

## 31.1 `metric-card`

Inputs:

```text
label
value
unit
optional trend/context
```

No internal business logic.

## 31.2 `status-card`

Shows overall system/zone status.

No mock imports.

## 31.3 `zone-card`

Generic zone summary.

Does not own simulation logic.

## 31.4 `chart-card`

Generic container around ECharts.

Must handle resize.

## 31.5 `activity-item`

Receives a `SmartActivity`.

Renders:

```text
time
title
reason
action
impact
```

## 31.6 `recommendation-card`

Receives recommendation data.

Emits semantic actions:

```text
accept
skip
```

## 31.7 `lighting-zone`

Receives a lighting zone.

Displays:

- occupancy;
- lux;
- brightness;
- power;
- mode;
- compliance.

## 31.8 `climate-zone`

Displays:

- current temperature;
- target;
- range;
- within target;
- percentage in target;
- mode.

---

# 32. Error and empty states

Even though data is mocked, components must support:

```text
loading
empty
error
normal
```

Do not assume data is always present.

Example:

```text
No activity yet
```

Example:

```text
Unable to load climate data
```

The mock adapter should include at least one optional failure mode for testing.

---

# 33. Accessibility basics

Even though visual design is minimal, accessibility is mandatory.

Requirements:

- semantic buttons;
- labels for form controls;
- keyboard usable navigation;
- focus visible;
- no information communicated only by color;
- touch targets large enough to use;
- charts must have text summaries nearby;
- sliders must expose values;
- `aria-label` where necessary.

---

# 34. Performance constraints

This MVP is small.

Do not overengineer.

However:

- avoid rerendering the entire application on trivial changes if easily preventable;
- dispose ECharts instances correctly;
- unsubscribe timers/listeners on component disconnect;
- avoid leaking intervals;
- avoid duplicated event listeners.

---

# 35. Coding rules

Use TypeScript strictly enough to catch domain mistakes.

Avoid:

```ts
any
```

unless necessary and justified.

Prefer:

```ts
unknown
```

with validation.

Use small modules.

Avoid files larger than roughly 400–500 lines unless there is a clear reason.

Avoid monolithic custom elements.

Do not place:

```text
data access
business logic
rendering
simulation
```

inside one component.

---

# 36. Naming rules

Use domain-oriented names.

Good:

```text
LightingState
SmartActivity
OptimizationImpact
DemoScenario
ClimateState
```

Bad:

```text
DataThing
Obj1
CardData
MiscState
```

---

# 37. Business language rules

The frontend must use human-readable building language.

Prefer:

```text
Lighting optimized
Room unoccupied
Energy reduction
Target temperature
Within target
Manual override
```

Avoid exposing internal technical identifiers.

Do not display:

```text
input_number.xyz
automation.xyz
switch.xyz
```

in primary customer-facing views.

---

# 38. Demo labeling

Simulation must be explicit.

Use a visible indicator:

```text
DEMO MODE
```

or:

```text
Simulation
```

The user must not interpret simulated savings as real measured savings.

---

# 39. Savings wording

Be precise.

Allowed in demo:

```text
Estimated savings
Simulated savings
Scenario baseline
Modeled reduction
```

Do not claim:

```text
Certified savings
Guaranteed savings
Measured savings
```

unless real telemetry exists.

---

# 40. Vertical slice first

Do not implement all pages in parallel.

The first complete vertical slice is:

```text
Simulator
    ↓
daylight changes
    ↓
lighting decision
    ↓
store update
    ↓
lighting card changes
    ↓
energy KPI changes
    ↓
chart changes
    ↓
activity item created
```

Example:

Initial:

```text
daylight = 120 lux
brightness = 100%
nominal power = 144 W
actual power = 144 W
```

Then:

```text
daylight = 680 lux
```

Expected:

```text
brightness = 35%
actual power ≈ 50.4 W
saved power ≈ 93.6 W
```

Activity:

```text
Lighting optimized

Natural daylight increased to 680 lux.

Lighting reduced from 100% to 35%.

Estimated reduction: 94 W.
```

This vertical slice must work on:

```text
360px
768px
1440px
```

before the next domain is considered complete.

---

# 41. Implementation phases

## Phase 0 — Bootstrap

Tasks:

- initialize Vite;
- configure TypeScript;
- configure Lit;
- install ECharts;
- run `npx impeccable install`;
- read Impeccable guidance;
- create base folders;
- create basic reset/layout/tokens CSS;
- create simple app shell.

Acceptance:

```text
npm run dev
npm run build
```

both succeed.

---

## Phase 1 — Routing and responsive shell

Create routes:

```text
/overview
/lighting
/climate
/activity
/simulator
```

Implement:

- desktop navigation;
- mobile navigation;
- shared page container;
- basic responsive breakpoints.

Acceptance:

All five empty views are navigable at:

```text
360
768
1440
```

without horizontal overflow.

---

## Phase 2 — Models and adapter contracts

Implement:

- domain interfaces;
- adapter interface;
- services;
- initial stores.

No UI business logic yet.

Acceptance:

Mock adapter satisfies contracts.

Views do not import mocks.

---

## Phase 3 — Mock state and demo engine

Implement:

- deterministic mock data;
- demo clock;
- scenarios;
- DemoEngine;
- reset/start/pause;
- state transitions.

Acceptance:

Running the same scenario twice produces the same sequence.

---

## Phase 4 — Overview

Implement:

- status summary;
- KPI cards;
- zone summaries;
- recent activity;
- current recommendation.

Acceptance:

Data comes from store/service layer only.

Responsive validated at required widths.

---

## Phase 5 — Lighting vertical slice

Implement:

- lighting zones;
- daylight input;
- brightness;
- baseline/current power;
- instant savings;
- lighting chart;
- activity generation;
- manual override.

Acceptance:

Changing daylight in simulator updates every dependent surface consistently.

---

## Phase 6 — Climate

Implement:

- climate zones;
- target range;
- within-target KPI;
- simulated meeting;
- recommendation;
- preconditioning;
- climate chart.

Acceptance:

Meeting scenario is deterministic and repeatable.

---

## Phase 7 — Activity

Implement:

- activity feed;
- category filter;
- readable explanations;
- impact fields.

Acceptance:

Activity generated by scenarios appears without page refresh.

---

## Phase 8 — Responsive hardening

Test:

```text
360
390
430
768
820
1024
1280
1440
1920
```

Verify:

- no horizontal overflow;
- usable navigation;
- charts resize;
- cards stack correctly;
- text wraps;
- touch controls remain usable;
- no clipped content;
- no critical hover dependency.

---

## Phase 9 — Structural cleanup

Review:

- component boundaries;
- duplicated logic;
- overly large components;
- state ownership;
- adapter separation;
- event cleanup;
- responsive CSS duplication;
- accessibility.

Run a final Impeccable-guided review focused on structural quality, not decoration.

---

# 42. Required acceptance tests

## Architecture

PASS if:

```text
No view imports mock files directly.
```

PASS if:

```text
All mock access goes through adapter/service/store layers.
```

PASS if:

```text
The future HomeAssistantAdapter can replace MockAdapter without rewriting views.
```

## Responsive

PASS if usable at:

```text
360px
768px
1440px
```

Minimum.

Full validation must cover all required widths.

## Simulation

PASS if:

```text
same scenario + same initial state = same result
```

## Energy consistency

PASS if:

```text
baseline >= actual
saved = baseline - actual
```

for optimization scenarios.

## Activity

PASS if each automation event explains:

```text
reason
action
impact
```

## State coherence

PASS if one simulated change updates:

```text
zone state
KPI
chart
activity
```

without contradictory values.

---

# 43. Prohibited implementation shortcuts

Do not:

- hardcode KPIs independently from store state;
- put mock imports into views;
- calculate the same metric differently in multiple components;
- create three versions of the same page for mobile/tablet/desktop;
- use random values in core demos;
- connect Home Assistant prematurely;
- build production authentication;
- create a complex design system;
- hide important information in tooltips only;
- use giant monolithic components;
- mix simulation engine logic with rendering;
- use real system time when demo time must be deterministic;
- silently fake "measured" values;
- claim simulated energy savings are real measurements.

---

# 44. Definition of done

The MVP is complete when a person can run:

```bash
npm install
npm run dev
```

open the application on smartphone, tablet, or desktop, and demonstrate:

## Demo flow A — High daylight

```text
High daylight scenario
        ↓
Daylight increases
        ↓
Lighting is reduced
        ↓
Power decreases
        ↓
Savings KPI changes
        ↓
Chart changes
        ↓
Activity explains the decision
```

## Demo flow B — Empty office

```text
Occupancy lost
        ↓
5 min simulated absence
        ↓
Lighting reduced
        ↓
10 min simulated absence
        ↓
Lighting off
        ↓
Energy saving changes
        ↓
Activity explains why
```

## Demo flow C — Meeting

```text
Meeting approaching
        ↓
Temperature outside target
        ↓
Recommendation shown
        ↓
User accepts preconditioning
        ↓
Climate state changes
        ↓
Temperature moves toward target
        ↓
Activity explains action
```

All three flows must be deterministic.

---

# 45. AI execution rules

An AI implementing this plan must follow these rules.

## Rule 1 — Do not reinterpret the scope

Do not add unrelated features.

## Rule 2 — Structure before style

If time is limited, prioritize:

```text
data flow
component boundaries
responsive layout
simulation
acceptance
```

over appearance.

## Rule 3 — Complete vertical slices

Do not create dozens of empty components.

Finish one complete flow before broadening.

## Rule 4 — Keep the app backend-independent

The mock adapter is temporary.

The frontend architecture must not be temporary.

## Rule 5 — Make decisions explicit

When a technical decision is not specified here:

1. choose the simplest option consistent with this architecture;
2. document the decision briefly;
3. avoid adding dependencies unless necessary.

## Rule 6 — Do not ask for visual design decisions

Visual design is intentionally basic.

Use neutral, functional defaults.

## Rule 7 — Use Impeccable as a structural quality guide

Always install and consult it.

Do not let it override the explicit product architecture in this document.

## Rule 8 — Validate after each phase

Do not assume responsive behavior works.

Actually inspect/test each required breakpoint.

## Rule 9 — Fix contradictions at the source

If two components disagree, fix the shared state/calculation.

Do not patch each view separately.

## Rule 10 — Avoid premature Home Assistant coupling

Do not use `hass.states[...]` directly in components in this MVP.

Future HA integration belongs inside an adapter/service layer.

---

# 46. Suggested implementation checklist

Before coding:

- [ ] Read this entire PLAN.md.
- [ ] Run `npx impeccable install`.
- [ ] Read installed Impeccable guidance.
- [ ] Confirm Vite + TypeScript + Lit baseline.
- [ ] Confirm ECharts dependency.
- [ ] Create folder structure.
- [ ] Define domain interfaces.
- [ ] Define adapter contract.

Foundation:

- [ ] App shell exists.
- [ ] Routing works.
- [ ] All five routes exist.
- [ ] Responsive navigation works.
- [ ] No horizontal overflow at 360px.

Mocks:

- [ ] Mock adapter exists.
- [ ] Demo clock exists.
- [ ] Demo engine exists.
- [ ] Five deterministic scenarios exist.
- [ ] Scenario reset works.
- [ ] Scenario replay is deterministic.

Overview:

- [ ] Operational state.
- [ ] KPI cards.
- [ ] Zone summary.
- [ ] Recent activity.
- [ ] Recommendation area.

Lighting:

- [ ] Occupancy.
- [ ] Daylight.
- [ ] Target lux.
- [ ] Brightness.
- [ ] Actual power.
- [ ] Baseline power.
- [ ] Saved power.
- [ ] Mode.
- [ ] Manual override.
- [ ] Lighting chart.

Climate:

- [ ] Current temperature.
- [ ] Target.
- [ ] Accepted range.
- [ ] Within target.
- [ ] Time within target.
- [ ] Meeting recommendation.
- [ ] Precondition action.
- [ ] Climate chart.

Activity:

- [ ] Human-readable entries.
- [ ] Reason.
- [ ] Action.
- [ ] Impact.
- [ ] Category filters.

Simulator:

- [ ] Zone selection.
- [ ] Presence.
- [ ] Daylight.
- [ ] Temperature.
- [ ] Brightness override.
- [ ] Mode.
- [ ] Scenario selection.
- [ ] Reset.
- [ ] Start.
- [ ] Pause.
- [ ] DEMO MODE indicator.

Responsive:

- [ ] 360px.
- [ ] 390px.
- [ ] 430px.
- [ ] 768px.
- [ ] 820px.
- [ ] 1024px.
- [ ] 1280px.
- [ ] 1440px.
- [ ] 1920px.

Quality:

- [ ] No direct mock imports from views.
- [ ] No uncontrolled random demo values.
- [ ] No conflicting derived calculations.
- [ ] No duplicated responsive pages.
- [ ] No giant monolithic component.
- [ ] Timers/listeners cleaned up.
- [ ] Charts resize correctly.
- [ ] Keyboard navigation works.
- [ ] Critical content is not hover-only.
- [ ] Build succeeds.

---

# 47. Future integration boundary

Do not implement this now, but preserve this future path:

```text
MockAdapter
     ↓
Witmind service contracts
     ↓
Stores
     ↓
Views/components
```

Future:

```text
HomeAssistantAdapter
     ↓
REST / WebSocket
     ↓
Witmind service contracts
     ↓
Stores
     ↓
Views/components
```

The goal is that the frontend views remain unchanged.

---

# 48. Future Home Assistant mapping concept

When Home Assistant is connected later, mapping should happen in the adapter.

Example:

```text
sensor.t_h_sensor_2_temperature
```

should become a domain value such as:

```ts
ClimateState.currentTemperature
```

The UI must never need to know the Home Assistant entity ID.

Likewise:

```text
switch.some_light
```

may later map into:

```ts
LightingState
```

or a zone/device model.

This preserves architectural independence.

---

# 49. Core product validation question

At the end of every implementation phase, ask:

> Does this help demonstrate that Witmind understands context, takes a useful action, explains that action, and quantifies the result?

If the answer is no, the feature is probably outside the current MVP.

---

# 50. Final target state for v0.1

The final structural MVP should allow a demo operator to show, without any real building hardware:

```text
Context change
    ↓
Witmind decision
    ↓
State change
    ↓
Energy/comfort impact
    ↓
Human-readable explanation
```

This must work consistently on:

```text
Smartphone
Tablet
Desktop
```

The success metric for this version is not visual sophistication.

The success metric is:

> The frontend architecture is understandable, reusable, deterministic, responsive, and ready to replace mocks with real adapters later without rewriting the product UI.
