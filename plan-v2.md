# PLAN-v2.md — Witmind Mock Lab / Simulation Architecture

> **Status:** authoritative implementation plan for the next iteration of the existing Witmind project.
>
> **Supersedes:** `PLAN.md` wherever this document conflicts with it.
>
> **Primary objective:** evolve the current deterministic frontend demo into a persistent, editable, reproducible simulation laboratory without rewriting the existing application architecture.

---

# 0. How this document must be used

This file is the source of truth for an AI or developer modifying the current project.

The implementer MUST work from the project that already exists. Do not scaffold a new application. Do not replace Lit, Vite, TypeScript, ECharts, the current stores, the existing domain models, the mock adapter boundary, or the current five primary views unless a section below explicitly requires an evolution of one of those pieces.

When this document says **MUST**, the requirement is mandatory. When it says **SHOULD**, deviation is allowed only with a concrete technical reason documented in the code or implementation report.

The priority order is:

1. deterministic simulation correctness;
2. persistent editable mock state;
3. traceability of physical data and assumptions;
4. ease of mutation and experimentation;
5. compatibility with the current views and adapter boundary;
6. testability and reproducibility;
7. functional UI;
8. visual appearance.

Visual polish is explicitly secondary.

---

# 1. Current project reality

The current repository already contains and MUST preserve the intent of:

```text
Vite
TypeScript
Lit / Web Components
Apache ECharts
Biome
Bun-based tests/check scripts
```

The current project also already contains:

```text
src/app/
src/views/
src/components/
src/engine/demo-engine.ts
src/engine/scenario.ts
src/services/
src/stores/
src/api/contracts/data-adapter.ts
src/api/adapters/mock.adapter.ts
src/api/adapters/home-assistant.adapter.ts
src/mocks/scenarios/
```

The five existing scenarios are:

```text
normal-day
high-daylight
empty-office
meeting
after-hours
```

The current implementation already has a useful architectural seam:

```text
UI
 ↓
Store
 ↓
MockAdapter / future HomeAssistantAdapter
 ↓
DemoEngine / real backend
```

That seam MUST be preserved.

The current project also has two architectural/physical problems that this plan explicitly fixes:

1. `SimulatorView` currently imports `allScenarios` directly from `src/mocks/scenarios`, which violates the existing architectural rule that views must not read mock data directly.
2. lighting physics are currently hard-coded as linear formulas:

```text
actualPowerW = nominalPowerW × brightness / 100
artificialLux = targetLux × brightness / 100
```

Those formulas MUST remain available only as a legacy compatibility model. They MUST NOT remain the only physical model.

---

# 2. Product concept for v2

The existing `Simulator` evolves into a **Mock Lab**.

It is not merely a collection of fake device controls.

It is a persistent editor and execution engine for a simulated world:

```text
environment
+
devices
+
physical curves
+
controller rules
+
time
=
reproducible simulation
```

The Mock Lab exists so that different hypotheses can be tested under exactly the same conditions.

The expected workflow is:

```text
1. Open a scenario.
2. Clone it.
3. Modify occupancy / temperature / daylight / device curves.
4. Run the simulated day.
5. Inspect lux, watts, comfort and actions.
6. Modify the hypothesis.
7. Run again.
8. Compare results.
```

The application is therefore a **laboratory for trial and error**, not a visual twin of a finished building.

---

# 3. Mandatory scope changes relative to PLAN v1

The following items were out of scope in the original `PLAN.md` but are NOW explicitly in scope:

```text
SQLite persistence
persistent scenarios
persistent physical curves
persistent hourly profiles
persistent simulation runs
editable mock definitions
scenario cloning
run comparison
full-day simulation
```

The old exclusions for `database` and `persistence` are superseded.

The following remain out of scope:

```text
real Home Assistant connection
real ESPHome devices
real DALI bus
real MQTT infrastructure
production authentication
RBAC
cloud backend
multi-user synchronization
machine learning
AI control decisions
BIM / IFC / 3D
visual floor-plan editor
production deployment
final branding
final visual design system
```

The architecture may preserve extension points for these, but do not implement them in this iteration.

---

# 4. Technology decisions

## 4.1 Existing stack

Do not change:

```text
Vite
TypeScript
Lit
Web Components
CSS
Apache ECharts
```

Do not migrate to React, Vue, Angular, Svelte or another frontend framework.

Do not add a large UI component library.

## 4.2 Package manager

The actual repository contains `bun.lock` and uses Bun in its test/check scripts.

For v2, Bun is the authoritative package workflow unless the user explicitly requests otherwise:

```bash
bun install
bun run dev
bun run build
bun run check
```

Do not create a second lockfile unless required by the environment.

## 4.3 SQLite implementation

Use SQLite as an infrastructure dependency behind repository interfaces.

Preferred browser implementation:

```text
@sqlite.org/sqlite-wasm
```

Preferred persistence mechanism:

```text
SQLite WASM + OPFS when supported
```

SQLite access MUST be encapsulated. No view, Lit component, domain service or `DemoEngine` method may execute SQL directly.

Required boundary:

```text
View / Store
    ↓
Repository interface
    ↓
SQLite repository implementation
    ↓
SQLite WASM / OPFS
```

The code MUST make it possible to substitute another repository implementation later without changing the engine.

## 4.4 Charts

Use the Apache ECharts dependency already present in the repository.

Do not introduce another charting library for occupancy, temperature, daylight, dimmer curves or run comparison unless ECharts is proven incapable of a required interaction.

---

# 5. High-level architecture

Target architecture:

```text
┌──────────────────────────────────────────────────────────┐
│                         UI                               │
│ Overview / Lighting / Climate / Activity / Mock Lab     │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                         Stores                           │
│ DemoStore + SimulationConfigStore                       │
└────────────────────────────┬─────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
          ▼                                     ▼
┌──────────────────────┐              ┌───────────────────────┐
│ Scenario Repository  │              │      DemoEngine       │
│ Curve Repository     │              │ deterministic runtime │
│ Run Repository       │              └───────────┬───────────┘
└──────────┬───────────┘                          │
           │                                      ▼
           ▼                            ┌───────────────────────┐
┌──────────────────────┐               │ Controller services   │
│       SQLite         │               │ Physical plant models │
│ WASM + persistent FS │               │ Energy integration    │
└──────────────────────┘               └───────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌───────────────────────┐
                                       │ MockAdapter boundary  │
                                       │ Future HA adapter     │
                                       └───────────────────────┘
```

SQLite is the **memory of the laboratory**.

`DemoEngine` is the **runtime**.

The domain services are the **rules and physical models**.

The UI is only an **editor and observer**.

---

# 6. Non-negotiable architectural rules

## 6.1 No direct mock imports from views

This is prohibited:

```ts
import { allScenarios } from "../../mocks/scenarios";
```

inside a view or visual component.

The current `SimulatorView` behavior MUST be refactored.

Correct direction:

```text
SimulatorView
  ↓
SimulationConfigStore
  ↓
ScenarioRepository
```

## 6.2 No SQL outside persistence layer

Prohibited:

```text
DemoEngine → SQL
View → SQL
Component → SQL
lighting.service → SQL
```

## 6.3 No important physical formula hidden in UI code

The following relationships MUST be data-driven whenever possible:

```text
dimmer voltage → driver current
driver current → electrical power
driver current → artificial illuminance
time → occupancy
time → room temperature
time → daylight lux
```

A legacy formula may exist as one selectable model, but it cannot be the only implementation.

## 6.4 No uncontrolled randomness

Do not use `Math.random()` for primary simulation state.

If stochastic behavior is added later, it MUST be seeded and reproducible.

## 6.5 Separate controller from physical plant

This distinction is mandatory:

```text
Controller decision:
"I want 62% lighting"

Physical plant response:
"62% command produces X volts, Y mA, Z watts and N lux"
```

The controller MUST NOT directly fabricate watts or lux.

---

# 7. Existing functionality that must remain working

During the migration, the following existing views and behaviors MUST continue to render and operate:

```text
Overview
Lighting
Climate
Activity
Simulator route
```

The route may remain:

```text
#/simulator
```

for compatibility, while its navigation label can become:

```text
Mocks
```

and its internal title can become:

```text
Mock Lab
```

The five legacy scenarios MUST remain available.

The `HomeAssistantAdapter` stub MUST remain as the future integration boundary.

---

# 8. Persistence model

SQLite stores four categories of information:

```text
CONFIGURATION
what the simulated world is

PHYSICAL DATA
how devices behave

STATE / RUNS
what happened in a simulation

PROVENANCE
where every important physical number came from
```

Do not use SQLite merely as a cache.

It is the persistent experiment memory.

---

# 9. SQLite schema

Use migrations. Never create schema implicitly from UI code.

A `schema_version` or migration table is mandatory.

## 9.1 `app_meta`

```sql
CREATE TABLE app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Required keys include:

```text
schema_version
seed_version
```

## 9.2 `scenarios`

```sql
CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  schema_version INTEGER NOT NULL,
  parent_id TEXT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  start_local_time TEXT NOT NULL DEFAULT '00:00',
  duration_seconds INTEGER NOT NULL DEFAULT 86400,
  default_step_seconds INTEGER NOT NULL DEFAULT 60,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(parent_id) REFERENCES scenarios(id)
);
```

`parent_id` preserves experiment genealogy.

## 9.3 `scenario_zones`

```sql
CREATE TABLE scenario_zones (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  zone_key TEXT NOT NULL,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL,
  config_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY(scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
  UNIQUE(scenario_id, zone_key)
);
```

## 9.4 `profiles`

A profile is a time-dependent input.

```sql
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  variable TEXT NOT NULL,
  unit TEXT NOT NULL,
  interpolation TEXT NOT NULL,
  FOREIGN KEY(scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY(zone_id) REFERENCES scenario_zones(id) ON DELETE CASCADE
);
```

Valid initial `variable` values:

```text
occupancy
temperature_c
daylight_lux
```

Valid initial interpolation modes:

```text
step
linear
```

Do not implement spline interpolation in v2.

## 9.5 `profile_points`

```sql
CREATE TABLE profile_points (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  time_offset_seconds INTEGER NOT NULL,
  value REAL NOT NULL,
  FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(profile_id, time_offset_seconds)
);
```

## 9.6 `source_references`

```sql
CREATE TABLE source_references (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NULL,
  url TEXT NULL,
  retrieved_at TEXT NULL,
  notes TEXT NOT NULL DEFAULT ''
);
```

Required `source_kind` enum:

```text
manufacturer_published
manufacturer_graph
third_party_datasheet
community_report
user_supplied
user_measured
interpolated
assumption
legacy_model
```

## 9.7 `device_profiles`

```sql
CREATE TABLE device_profiles (
  id TEXT PRIMARY KEY,
  device_type TEXT NOT NULL,
  manufacturer TEXT NULL,
  model TEXT NULL,
  name TEXT NOT NULL,
  config_json TEXT NOT NULL DEFAULT '{}',
  source_reference_id TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_reference_id) REFERENCES source_references(id)
);
```

Initial device types:

```text
led_panel
led_driver
lux_sensor
temperature_sensor
occupancy_sensor
```

## 9.8 `curves`

```sql
CREATE TABLE curves (
  id TEXT PRIMARY KEY,
  device_profile_id TEXT NULL,
  name TEXT NOT NULL,
  input_variable TEXT NOT NULL,
  input_unit TEXT NOT NULL,
  output_variable TEXT NOT NULL,
  output_unit TEXT NOT NULL,
  interpolation TEXT NOT NULL DEFAULT 'linear',
  extrapolation TEXT NOT NULL DEFAULT 'clamp',
  status TEXT NOT NULL,
  source_reference_id TEXT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(device_profile_id) REFERENCES device_profiles(id),
  FOREIGN KEY(source_reference_id) REFERENCES source_references(id)
);
```

Required `status` values:

```text
measured
published
derived
modelled
legacy
```

## 9.9 `curve_points`

```sql
CREATE TABLE curve_points (
  id TEXT PRIMARY KEY,
  curve_id TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  source_kind TEXT NOT NULL,
  source_reference_id TEXT NULL,
  notes TEXT NOT NULL DEFAULT '',
  FOREIGN KEY(curve_id) REFERENCES curves(id) ON DELETE CASCADE,
  FOREIGN KEY(source_reference_id) REFERENCES source_references(id),
  UNIQUE(curve_id, x)
);
```

A derived point MUST NOT be marked as measured.

## 9.10 `scenario_device_bindings`

```sql
CREATE TABLE scenario_device_bindings (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  zone_id TEXT NOT NULL,
  role TEXT NOT NULL,
  device_profile_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  config_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY(scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY(zone_id) REFERENCES scenario_zones(id) ON DELETE CASCADE,
  FOREIGN KEY(device_profile_id) REFERENCES device_profiles(id)
);
```

`quantity` SHOULD normally be an integer for physical luminaires. It remains `REAL` only to avoid blocking legacy aggregate loads during migration. New physical scenarios SHOULD use integer fixture counts.

## 9.11 `simulation_runs`

```sql
CREATE TABLE simulation_runs (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL,
  scenario_snapshot_json TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NULL,
  step_seconds INTEGER NOT NULL,
  status TEXT NOT NULL,
  result_summary_json TEXT NULL,
  FOREIGN KEY(scenario_id) REFERENCES scenarios(id)
);
```

The run MUST contain a scenario snapshot so a later scenario edit does not rewrite history.

## 9.12 `simulation_samples`

```sql
CREATE TABLE simulation_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id TEXT NOT NULL,
  sim_time_seconds INTEGER NOT NULL,
  zone_key TEXT NOT NULL,
  occupied REAL NOT NULL,
  occupancy_count REAL NULL,
  temperature_c REAL NULL,
  daylight_lux REAL NULL,
  requested_brightness_pct REAL NULL,
  dimmer_voltage_v REAL NULL,
  driver_current_ma REAL NULL,
  fixture_power_w REAL NULL,
  artificial_lux REAL NULL,
  total_lux REAL NULL,
  baseline_power_w REAL NULL,
  energy_actual_kwh REAL NULL,
  energy_baseline_kwh REAL NULL,
  FOREIGN KEY(run_id) REFERENCES simulation_runs(id) ON DELETE CASCADE
);
```

Create indexes on:

```text
simulation_samples(run_id, sim_time_seconds)
simulation_samples(run_id, zone_key, sim_time_seconds)
```

## 9.13 `run_activities`

```sql
CREATE TABLE run_activities (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  sim_time_seconds INTEGER NOT NULL,
  zone_key TEXT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  action TEXT NOT NULL,
  impact_json TEXT NULL,
  FOREIGN KEY(run_id) REFERENCES simulation_runs(id) ON DELETE CASCADE
);
```

---

# 10. Repository contracts

Create persistence contracts under a dedicated directory, for example:

```text
src/persistence/
  database.ts
  migrations/
  repositories/
    scenario.repository.ts
    curve.repository.ts
    device.repository.ts
    run.repository.ts
```

## 10.1 Scenario repository

```ts
export interface ScenarioRepository {
  list(): Promise<ScenarioDefinition[]>;
  get(id: string): Promise<ScenarioDefinition | null>;
  save(scenario: ScenarioDefinition): Promise<void>;
  clone(id: string, newName: string): Promise<ScenarioDefinition>;
  delete(id: string): Promise<void>;
}
```

## 10.2 Curve repository

```ts
export interface CurveRepository {
  list(): Promise<PhysicalCurve[]>;
  get(id: string): Promise<PhysicalCurve | null>;
  save(curve: PhysicalCurve): Promise<void>;
  delete(id: string): Promise<void>;
}
```

## 10.3 Run repository

```ts
export interface RunRepository {
  create(run: SimulationRun): Promise<void>;
  appendSamples(runId: string, samples: SimulationSample[]): Promise<void>;
  appendActivities(runId: string, activities: RunActivity[]): Promise<void>;
  complete(runId: string, summary: RunSummary): Promise<void>;
  list(): Promise<SimulationRun[]>;
  getSamples(runId: string): Promise<SimulationSample[]>;
  delete(runId: string): Promise<void>;
}
```

Write samples in transactions/batches rather than one transaction per chart frame.

---

# 11. Scenario model v2

`src/engine/scenario.ts` must evolve from a short demo timeline definition to a versioned scenario definition.

Target conceptual model:

```ts
export interface ScenarioDefinition {
  schemaVersion: 2;
  id: string;
  name: string;
  description: string;
  parentId?: string | null;

  time: {
    timezone: string;
    startLocalTime: string;
    durationSeconds: number;
    defaultStepSeconds: number;
  };

  zones: ScenarioZoneDefinition[];
  profiles: ScenarioProfileDefinition[];
  events: ScenarioEvent[];
  deviceBindings: ScenarioDeviceBinding[];
  controllerConfig: ControllerConfig;
}
```

The engine MUST still be able to load migrated legacy scenarios.

---

# 12. Legacy scenario migration

The existing TypeScript scenarios under:

```text
src/mocks/scenarios/
```

become seed/migration input, not the permanent runtime source.

On first database initialization:

1. create the v2 schema;
2. import the five existing scenarios;
3. mark them as legacy seeded scenarios;
4. preserve their names and behavior;
5. store their origin in `source_references` as `legacy_model`;
6. never re-seed over user-edited records unless the database is explicitly reset.

After migration, runtime scenario listing MUST come from `ScenarioRepository`.

`SimulatorView` MUST stop importing `allScenarios`.

---

# 13. DemoEngine refactor

The existing `DemoEngine` should be evolved, not replaced wholesale.

## 13.1 Load scenario object, not global ID lookup

Old behavior:

```ts
loadScenario(scenarioId: string)
```

with an internal dependency on `allScenarios`.

Target:

```ts
loadScenario(scenario: ScenarioDefinition): void
```

The engine must not know whether the scenario came from SQLite, a unit test fixture or a future network source.

## 13.2 Variable time step

Old:

```ts
tick(): void // always +1 second
```

Target:

```ts
tick(deltaSeconds: number): void
```

Default live simulation step:

```text
60 seconds
```

Legacy demo mode may continue using 1-second steps.

## 13.3 Playback speed is not simulation resolution

Separate:

```text
simulationStepSeconds
```

from:

```text
playbackSpeed
```

Example:

```text
step = 60 simulated seconds
playback = x360
```

The simulation still evaluates every simulated minute even if a day executes rapidly on screen.

Do not implement fast mode by skipping physical/controller evaluations.

## 13.4 Deterministic per-step execution order

Every simulation step MUST execute in this order:

```text
1. advance simulation clock
2. sample environmental profiles
3. apply scheduled discrete events
4. apply active live overrides
5. derive occupancy/absence state
6. execute controller logic
7. convert controller command to dimmer control
8. evaluate dimmer/driver current curve
9. evaluate power curve/model
10. evaluate artificial lux curve/model
11. combine daylight + artificial lux
12. evaluate climate state/model
13. integrate energy
14. generate activities if rules trigger
15. create telemetry sample
16. persist run data when recording
17. notify stores/UI
```

The order MUST have unit/integration tests.

---

# 14. Simulation clock

The clock is a first-class domain concept.

Required controls:

```text
Start
Pause
Step
Reset
Jump to time
Run 24h
```

Required playback choices:

```text
real-time
x10
x60
x360
fast/full-run
```

The exact visual presentation is unimportant.

A `Run 24h` operation MUST be able to execute without waiting for real time.

---

# 15. Environmental profiles

The Mock Lab must edit the simulated environment graphically and numerically.

## 15.1 Occupancy

Occupancy default interpolation:

```text
step
```

Example points:

```text
07:59 → 0
08:00 → 1
12:00 → 0
13:00 → 1
18:00 → 0
```

Version 2 may treat occupancy as numeric so it can later represent people count:

```text
0
1
4
12
```

For boolean controller rules:

```text
occupied = occupancy > 0
```

The UI should initially offer both:

```text
Occupied / Empty mode
People count mode
```

but the stored value remains numeric.

## 15.2 Temperature

Temperature default interpolation:

```text
linear
```

Example:

```text
00:00 → 24.0 °C
04:00 → 23.2 °C
08:00 → 24.5 °C
12:00 → 26.1 °C
16:00 → 27.8 °C
20:00 → 26.4 °C
24:00 → 24.7 °C
```

Do not use spline interpolation by default because it can invent overshoot between entered points.

## 15.3 Daylight

Daylight is mandatory because lighting control cannot be meaningfully evaluated without it.

Default interpolation:

```text
linear
```

Example shape:

```text
06:00 → 0 lux
08:00 → 120 lux
10:00 → 350 lux
12:00 → 680 lux
14:00 → 550 lux
16:00 → 260 lux
18:00 → 30 lux
20:00 → 0 lux
```

These example values are scenario input examples, NOT universal real-world daylight claims. The UI must identify them as scenario data.

---

# 16. Profile editor UI

Use ECharts.

Each profile editor MUST provide:

```text
graph
point table
add point
edit point
remove point
reset profile
interpolation selector where applicable
```

The graph is for rapid mutation.

The table is the precise source of numeric input and provides an accessible fallback.

Minimum graph interaction:

```text
click to add point
select point
edit x/y numerically
remove selected point
```

Drag-to-edit is desirable but not mandatory if it makes the first implementation fragile.

Do not spend significant time on appearance.

---

# 17. Controller vs physical plant

This separation is mandatory for lighting.

## 17.1 Controller service

Create or refactor into something equivalent to:

```text
src/services/lighting-controller.service.ts
```

Input:

```text
occupied
absence duration
daylight lux
target lux
mode
manual override
```

Output:

```ts
interface LightingCommand {
  requestedBrightnessPct: number;
  powerCommand: "on" | "off";
  reason: string;
}
```

The controller does NOT calculate actual watts or artificial lux.

## 17.2 Driver/dimmer model

Create:

```text
src/services/dimmer-model.service.ts
```

Input:

```text
requested brightness
selected control curve
power command
```

Output:

```ts
interface DimmerState {
  controlVoltageV: number;
  outputCurrentMa: number;
}
```

## 17.3 Lighting plant model

Create:

```text
src/services/lighting-plant.service.ts
```

Input:

```text
driver current
selected power curve
selected lux curve
number of fixtures
```

Output:

```ts
interface LightingPlantState {
  fixturePowerW: number;
  artificialLux: number;
}
```

Then:

```text
totalLux = daylightLux + artificialLux
```

---

# 18. Lighting model migration

The existing linear model MUST be preserved as a named compatibility model:

```text
legacy-linear-v1
```

It implements the old behavior:

```text
power = nominalPower × brightness%
artificialLux = targetLux × brightness%
```

It exists only so existing scenarios/tests can be migrated safely.

The new default for physical 48 W panel experiments MUST be a curve-based model described below.

---

# 19. Reference hardware profile for the 48 W panel experiment

The initial physical experiment is based on a 600×600 mm / 48 W LED panel and a 300 mA constant-current driver.

The system MUST distinguish the following sources.

## 19.1 User-supplied factory driver data

The project owner supplied these factory-driver label values:

```text
rated/max power: 48 W
output voltage range: 72–160 VDC
constant output current: 300 mA
```

Store this as:

```text
source_kind = user_supplied
```

Do not silently promote it to manufacturer-published unless a manufacturer datasheet for that exact original driver is later added.

## 19.2 Eaglerise dimmable reference driver

Reference model:

```text
Eaglerise FMS-60-350 0-10 LD-F
```

Manufacturer-published facts used by the simulator profile:

```text
0-10 V dimming
selectable constant-current outputs including 300 mA
at 300 mA: 70–200 VDC operating range
current accuracy: ±8%
dimming depth: 1%
dimming current range: 1–100%
typical efficiency: 88% at full load, 230 V
standby power: <= 0.5 W
```

These are hard reference fields from the manufacturer datasheet.

Source:

```text
https://lighting.eaglerise.com/data/upload/main/20250423/FMS-60-350%200-10%20LD-F%20spec%20REV%20B.pdf
```

Important: that datasheet does NOT publish a complete point-by-point transfer table of `0-10 V → mA` for the 300 mA setting. Therefore the simulator MUST NOT label the linear voltage/current table below as an Eaglerise measured curve.

## 19.3 48 W panel optical reference

Reference panel:

```text
G7-PN-6060-48W-CC
600 × 600 mm
48 W
5280 lm
```

Published center illuminance at full output:

```text
1 m → 1600 lx
2 m → 404 lx
3 m → 182 lx
```

Sources:

```text
https://g7lighting.vn/den-panel-600x600-48w-chieu-thang-pd178334.html
https://g7lighting.vn/download-file.html?id=f17169495526656923024be0
```

These lux figures are geometry-dependent. They are reference anchor values for the mock, not a claim that every 48 W 600×600 panel produces the same illuminance in every room.

## 19.4 Generic documented 0–10 V transfer reference

A separate documented driver datasheet publishes the typical mapping:

```text
0 V → 0%
1 V → 10%
2 V → 20%
...
10 V → 100%
```

Reference:

```text
RND 500-00072 / RND 500-00073 datasheet
https://media.distrelec.com/Web/Downloads/_t/ds/RND_500-00072-RND_500-00073_eng_tds.pdf
```

This transfer table is used ONLY as a generic linear 0–10 V seed profile.

It MUST NOT be presented as a measured Eaglerise transfer curve.

---

# 20. Mandatory dimming simulation guide table

This table MUST be seeded into SQLite as a versioned reference curve set.

Curve-set ID:

```text
linear-0-10v-reference-v1
```

Purpose:

```text
Provide deterministic initial values for simulation before user-specific measurements are available.
```

The table combines:

1. a documented generic linear 0–10 V control mapping;
2. the 300 mA nominal output-current anchor;
3. the 48 W full-output electrical anchor;
4. the G7 48 W panel full-output center-lux anchors;
5. explicit linear interpolation for intermediate power and lux points.

It is a **simulation guide**, not a laboratory measurement table for the user's exact fixture.

| Control V | Guide level | Driver current | Fixture power model | Center lx @ 1 m | Center lx @ 2 m | Center lx @ 3 m |
|---:|---:|---:|---:|---:|---:|---:|
| 0.0 V | 0% / OFF | 0 mA | 0.0 W | 0 lx | 0 lx | 0 lx |
| 1.0 V | 10% | 30 mA | 4.8 W | 160 lx | 40.4 lx | 18.2 lx |
| 2.0 V | 20% | 60 mA | 9.6 W | 320 lx | 80.8 lx | 36.4 lx |
| 3.0 V | 30% | 90 mA | 14.4 W | 480 lx | 121.2 lx | 54.6 lx |
| 4.0 V | 40% | 120 mA | 19.2 W | 640 lx | 161.6 lx | 72.8 lx |
| 5.0 V | 50% | 150 mA | 24.0 W | 800 lx | 202.0 lx | 91.0 lx |
| 6.0 V | 60% | 180 mA | 28.8 W | 960 lx | 242.4 lx | 109.2 lx |
| 7.0 V | 70% | 210 mA | 33.6 W | 1120 lx | 282.8 lx | 127.4 lx |
| 8.0 V | 80% | 240 mA | 38.4 W | 1280 lx | 323.2 lx | 145.6 lx |
| 9.0 V | 90% | 270 mA | 43.2 W | 1440 lx | 363.6 lx | 163.8 lx |
| 10.0 V | 100% | 300 mA | 48.0 W | 1600 lx | 404 lx | 182 lx |

## 20.1 Provenance of table columns

The implementation MUST preserve these distinctions:

### `Control V → Guide level`

```text
source_kind = third_party_datasheet
status = published reference
```

It is a common documented linear 0–10 V reference profile, not the exact Eaglerise transfer curve.

### `Guide level → Driver current`

Formula:

```text
currentMa = 300 × levelFraction
```

Status:

```text
derived
```

The 300 mA maximum is a hard anchor. Intermediate values are interpolation.

### `Guide level → Fixture power model`

Formula:

```text
fixturePowerW = 48 × levelFraction
```

Status:

```text
modelled / derived
```

This is an initial energy model, NOT a claim that mains input power is exactly linear with dimming.

The UI MUST not label these intermediate watt values as measured.

### `Guide level → lux`

Formulas:

```text
lux1m = 1600 × levelFraction
lux2m = 404 × levelFraction
lux3m = 182 × levelFraction
```

Status:

```text
modelled / derived
```

The 100% lux values are published reference anchors. Intermediate lux values are linear interpolation for simulation.

## 20.2 Why this table is acceptable for v2

The purpose of v2 is reproducible experimentation before exact fixture characterization exists.

The simulator must therefore have:

```text
a deterministic initial model
+
visible provenance
+
ability to replace the model with measured points
```

It MUST NOT fabricate false measurement precision.

## 20.3 OFF behavior

Do not assume every 0–10 V driver turns electrically off at exactly 0 V.

The simulator MUST model power state separately:

```ts
powerCommand: "on" | "off";
```

Default reference behavior for `linear-0-10v-reference-v1`:

```text
powerCommand = off → 0 mA / 0 W / 0 artificial lx
powerCommand = on  → evaluate selected dimming curve
```

A future device profile may define `dimToOff = true`, but that is a device-specific property.

## 20.4 Eaglerise-specific profile behavior

Create a profile:

```text
eaglerise-fms-60-350-300ma-v1
```

Hard fields:

```text
currentMaxMa = 300
voltageMinVdc = 70
voltageMaxVdc = 200
currentAccuracyPct = 8
dimmingMinPct = 1
dimmingMaxPct = 100
controlType = 0-10V
standbyPowerMaxW = 0.5
```

Until an exact Eaglerise voltage/current transfer curve is measured or published, the profile may reference:

```text
linear-0-10v-reference-v1
```

as its provisional transfer model.

The UI MUST display the transfer curve status as:

```text
MODELLED
```

not:

```text
MEASURED
```

---

# 21. Physical curve model

Do not hard-code the guide table as an `if/else` chain.

Store it as curve points.

Required initial curves:

```text
curve A: control_voltage_v → dim_level_pct
curve B: dim_level_pct → driver_current_ma
curve C: driver_current_ma or dim_level_pct → fixture_power_w
curve D1: driver_current_ma or dim_level_pct → lux_at_1m
curve D2: driver_current_ma or dim_level_pct → lux_at_2m
curve D3: driver_current_ma or dim_level_pct → lux_at_3m
```

For the initial reference profile, linear interpolation between seed points is acceptable.

Curve interpolation service MUST:

```text
sort points by x
clamp outside range by default
interpolate linearly between surrounding points
return exact y on exact x
never mutate stored points
```

Unit tests are mandatory.

---

# 22. Future measured calibration

The UI MUST make it possible to replace derived points with user measurements later.

Example future measured dataset:

```text
control V
measured current mA
measured mains W
measured lux
measurement distance
notes
```

When measured data exists, it takes precedence over the provisional model.

Do not delete the old curve. Create a new curve version, for example:

```text
panel-48w-calibration-v2
```

This allows comparison between model revisions.

---

# 23. Tolerance and noise

Do not confuse manufacturing tolerance with sensor noise.

## 23.1 Manufacturing tolerance

Eaglerise publishes current accuracy of ±8% for the reference driver.

A physical device instance may optionally have a fixed deterministic calibration factor:

```text
nominalCurrentFactor = 0.98
```

That factor remains constant during a run.

If variability is implemented, it MUST be explicitly seeded.

Example deterministic configuration:

```ts
{
  currentScaleFactor: 0.982
}
```

Do not generate a new random factor every sample.

## 23.2 Sensor noise

Sensor noise is a separate optional layer.

It MUST be:

```text
off by default
seeded if enabled
configured per sensor
```

A primary baseline simulation should remain noise-free and deterministic.

---

# 24. Lighting domain model v2

Evolve `src/models/lighting.ts`.

Target conceptual fields:

```ts
export interface LightingState {
  requestedBrightnessPct: number;
  powerCommand: "on" | "off";

  targetLux: number;
  daylightLux: number;
  artificialLux: number;
  currentLux: number;

  dimmerVoltageV: number;
  driverCurrentMa: number;

  fixturePowerW: number;
  baselinePowerW: number;

  mode: ControlMode;
  withinTarget: boolean;
  manualOverrideUntil?: string | null;

  modelInfo: {
    dimmerCurveId: string;
    powerCurveId: string;
    luxCurveId: string;
  };
}
```

During migration it is acceptable to retain the old `brightness` field as an alias, but new code SHOULD use `requestedBrightnessPct`.

---

# 25. Energy accounting

Energy displayed for a run must be integrated over simulated time.

For every step:

```text
actualEnergyIncrementKwh
  = actualPowerW × deltaSeconds / 3,600,000
```

and:

```text
baselineEnergyIncrementKwh
  = baselinePowerW × deltaSeconds / 3,600,000
```

Then:

```text
energySavedKwh = baselineKwh - actualKwh
```

Do not derive daily kWh by multiplying the final instantaneous watt value by a fixed number of hours.

## 25.1 Meaning of `fixturePowerW`

For the initial guide curve, `fixturePowerW` is a modeled electrical consumption value based on a 48 W full-output anchor.

It is not certified mains-meter data.

The UI MUST expose provenance/status when inspecting the curve.

When a future measured mains-power curve exists, use it instead.

---

# 26. Existing lighting controller rules

The current daylight harvesting rules can remain initially as controller policy:

```text
daylight < 150 lux   → 100%
150–299 lux          → 75%
300–399 lux          → 55%
400–449 lux          → 35%
450–499 lux          → 15%
>= 500 lux           → 0%
```

The absence behavior can also remain initially:

```text
absence < 5 min      → preserve/current policy
5–9 min              → 20%
>= 10 min            → OFF
```

But these are **controller policy**, not physical device behavior.

They MUST be evaluated before the physical dimmer/panel model.

---

# 27. Mock Lab UI structure

Do not create a visual-design project.

Use simple controls, ECharts, tables and basic cards.

The Mock Lab should expose the following sections/tabs inside the existing Simulator route:

```text
Scenario
Environment
Devices
Curves
Run
History
```

## 27.1 Scenario

Required controls:

```text
scenario selector
new
clone
rename
delete
reset to seed where applicable
scenario description
scenario parent/origin
```

Deletion of a scenario with saved runs MUST require an explicit confirmation.

## 27.2 Environment

For selected zone:

```text
Occupancy profile
Temperature profile
Daylight profile
```

Each contains:

```text
ECharts graph
editable point table
```

## 27.3 Devices

Show selected bindings:

```text
zone
role
device profile
quantity
```

For the reference lighting setup:

```text
panel: 48 W 600×600 optical reference
driver: 300 mA 0–10 V reference
```

## 27.4 Curves

Required curve editors:

```text
0–10 V → dim level/current
current/dim level → watts
current/dim level → lux
```

Every curve editor MUST display:

```text
curve name
status: measured / published / derived / modelled / legacy
source title
source URL if available
interpolation method
point table
chart
```

## 27.5 Run

Required controls:

```text
Start
Pause
Step
Reset
Jump to time
Run 24h
step size
playback speed
record run toggle
```

Current state readout should include at minimum:

```text
simulated time
occupancy
temperature
daylight lux
requested brightness %
dimmer voltage V
driver current mA
fixture power W
artificial lux
total lux
```

## 27.6 History

Required:

```text
list runs
open run
compare 2–3 runs
delete run
```

Run comparison MUST support at least:

```text
total actual energy kWh
baseline energy kWh
energy saved kWh
average occupied lux
minutes below target lux
peak power W
occupied comfort percentage
number of automated actions
```

No automatic "winner" is required.

---

# 28. Live Override mode

The current simulator's direct controls remain useful.

Preserve them as a distinct mode:

```text
Live Override
```

Possible controls:

```text
occupied
current temperature
daylight lux
manual brightness
control mode
```

Rules:

1. live override changes runtime state;
2. it does not silently rewrite the stored scenario profile;
3. provide an explicit `Apply to scenario` action if persistence is desired;
4. reset removes temporary override and returns to profile-derived state.

---

# 29. Scenario cloning and mutation

Cloning is a core workflow.

Example:

```text
Normal Office
   ├── Normal Office / aggressive dimming
   ├── Normal Office / low daylight
   └── Normal Office / late occupancy
```

Clone MUST duplicate:

```text
zones
profiles
events
device bindings
controller configuration
```

It MUST NOT duplicate historical runs.

Store original scenario in `parent_id`.

---

# 30. Run snapshots and reproducibility

Every recorded simulation run MUST preserve the exact scenario/configuration used at execution time.

At run start:

```text
serialize scenario
serialize device bindings
serialize relevant curve IDs and versions
serialize controller config
serialize step size
serialize engine version
```

Store the snapshot in `simulation_runs.scenario_snapshot_json`.

If the user edits the scenario later, the historical run must remain reproducible/explainable.

---

# 31. Data provenance UI

The Mock Lab MUST make provenance visible without requiring source-code inspection.

Recommended labels:

```text
PUBLISHED
MEASURED
DERIVED
MODELLED
LEGACY
```

Example:

```text
1600 lx @ 1m      PUBLISHED
800 lx @ 1m       DERIVED
24.0 W @ 50%      MODELLED
300 mA maximum    USER-SUPPLIED / PUBLISHED depending profile
```

Do not use wording that implies a derived point was directly measured.

---

# 32. Reference seed data

Database initialization MUST include at least these reference records.

## 32.1 Source: Eaglerise

```text
id: src-eaglerise-fms-60-350-010-revb
kind: manufacturer_published
```

## 32.2 Source: G7 panel

```text
id: src-g7-pn-6060-48w-cc
kind: manufacturer_published
```

## 32.3 Source: generic 0–10 V linear reference

```text
id: src-rnd-linear-010v-reference
kind: third_party_datasheet
```

## 32.4 Source: original factory driver label

```text
id: src-user-factory-driver-48w-300ma
kind: user_supplied
```

## 32.5 Device profile

```text
id: panel-g7-6060-48w-reference
```

## 32.6 Device profile

```text
id: driver-eaglerise-fms-60-350-300ma-reference
```

## 32.7 Curve set

```text
id: linear-0-10v-reference-v1
```

with the mandatory table from section 20.

---

# 33. Do not force the 48 W profile onto every existing zone

The existing legacy scenarios contain aggregate zone loads such as:

```text
144 W
96 W
240 W
72 W
```

Do not assume every number is an integer quantity of 48 W panels.

For legacy scenarios:

```text
use legacy-linear-v1 until explicitly migrated
```

For new physical lighting scenarios:

```text
bind actual device profiles + quantities
```

Example:

```text
Open Office
3 × 48 W panel
```

is valid.

Do not invent a fixture count to make a legacy aggregate wattage fit.

---

# 34. Climate simulation

The existing climate model may remain intentionally simple in v2.

The important new requirement is that environmental temperature can be defined as a profile and the resulting climate behavior can be run over a full simulated day.

Do not invest effort in high-fidelity thermodynamics before the lighting Mock Lab and persistence are complete.

Preserve:

```text
current temperature
target temperature
comfort band
within-target status
meeting preconditioning
```

Future thermal-model sophistication must fit behind a service/model boundary.

---

# 35. Activity generation

Activity remains human-readable.

Every generated activity should continue answering:

```text
WHAT happened?
WHY?
WHAT action was taken?
WHAT impact resulted?
```

New physical detail can be included where useful:

```text
Requested lighting reduced to 50%.
Dimmer control moved to 5.0 V.
Reference model estimates current at 150 mA.
Estimated fixture consumption: 24 W.
```

If the impact is based on a model, wording MUST use terms such as:

```text
estimated
modelled
reference
```

not:

```text
measured
```

unless it actually came from measured data.

---

# 36. Store responsibilities

## 36.1 `DemoStore`

Keep focused on active runtime state:

```text
engine state
current building
current energy
current activities
current recommendation
current clock
runtime actions
```

## 36.2 New `SimulationConfigStore`

Create a store responsible for persistent laboratory configuration:

```text
scenario list
selected scenario configuration
profile CRUD
curve CRUD
device profile CRUD
run list
run comparison selection
loading/error state
```

The Mock Lab view talks to `SimulationConfigStore`, not directly to repositories.

---

# 37. Adapter boundary

Keep `WitmindDataAdapter` and `HomeAssistantAdapter`.

Do not make SQLite the future Home Assistant API.

Conceptual separation:

```text
SIMULATION WORLD
SQLite → Scenario Engine → MockAdapter

REAL WORLD
Home Assistant / ESPHome → HomeAssistantAdapter
```

The higher UI/domain layers should remain as compatible as practical.

---

# 38. Proposed file structure additions

Add approximately:

```text
src/
├── persistence/
│   ├── database.ts
│   ├── migrations/
│   │   ├── 001-initial-mock-lab.ts
│   │   └── index.ts
│   ├── repositories/
│   │   ├── scenario.repository.ts
│   │   ├── sqlite-scenario.repository.ts
│   │   ├── curve.repository.ts
│   │   ├── sqlite-curve.repository.ts
│   │   ├── device.repository.ts
│   │   ├── sqlite-device.repository.ts
│   │   ├── run.repository.ts
│   │   └── sqlite-run.repository.ts
│   └── seed/
│       ├── legacy-scenarios.seed.ts
│       ├── physical-sources.seed.ts
│       └── dimming-reference.seed.ts
│
├── simulation/
│   ├── interpolation.ts
│   ├── profile-sampler.ts
│   ├── physical-curve.ts
│   ├── run-summary.ts
│   └── provenance.ts
│
├── services/
│   ├── lighting-controller.service.ts
│   ├── dimmer-model.service.ts
│   ├── lighting-plant.service.ts
│   └── ...existing services
│
├── stores/
│   ├── simulation-config.store.ts
│   └── ...existing stores
│
└── components/
    ├── profile-editor/
    ├── curve-editor/
    ├── run-controls/
    └── run-comparison/
```

Names can vary slightly, but responsibilities may not be collapsed back into a monolithic simulator view.

---

# 39. Interpolation service specification

Implement a pure function similar to:

```ts
interpolateCurve(
  points: readonly { x: number; y: number }[],
  x: number,
  mode: "linear" | "step",
  extrapolation: "clamp"
): number
```

Behavior:

```text
0 points → explicit error
1 point → that y value
exact x → exact point y
below min x → min y
above max x → max y
linear → linear interpolation
step → previous point value
```

No hidden smoothing.

No random noise in this function.

---

# 40. Full simulation step example

For a new physical lighting scenario at 12:00:

```text
occupancy profile     → 1 person / occupied
temperature profile   → 26.1 °C
daylight profile      → 300 lx
```

Controller evaluates:

```text
daylight 300 lx
→ requested brightness = 55%
```

If the selected dimmer profile uses the linear 0–10 V reference:

```text
requested 55%
→ control ≈ 5.5 V
→ current ≈ 165 mA
```

Then physical curves determine:

```text
fixture power estimate
artificial lux estimate
```

Then:

```text
totalLux = daylightLux + artificialLux
```

Then energy is integrated for `deltaSeconds`.

The controller NEVER directly sets final watts/lux.

---

# 41. Numeric precision rules

Internal calculations SHOULD retain floating-point precision.

Round only for display or persisted summary where appropriate.

Recommended display:

```text
voltage: 2 decimals V
current: 1 decimal mA
power: 1 decimal W
lux: integer lx
temperature: 1 decimal °C
energy: 3 decimal kWh for run details
percentages: 1 decimal % where needed
```

Do not repeatedly round during intermediate physics calculations.

---

# 42. Run summary calculations

At completion calculate per run:

```ts
interface RunSummary {
  actualEnergyKwh: number;
  baselineEnergyKwh: number;
  savedEnergyKwh: number;
  savingsPercent: number;
  averageOccupiedLux: number;
  minutesBelowLuxTarget: number;
  peakPowerW: number;
  occupiedComfortPercent: number;
  automatedActions: number;
}
```

`minutesBelowLuxTarget` must be calculated only during occupied periods unless another metric explicitly says otherwise.

---

# 43. History retention

The current engine limits in-memory history to a very small number of samples.

For v2:

```text
UI live buffer: may remain bounded
SQLite run history: complete recorded run
```

Do not delete historical run samples automatically.

Provide explicit run deletion.

A 24-hour run with 60-second resolution produces 1440 samples per zone, which is acceptable for this laboratory use case.

---

# 44. Import/export

To support experimentation and AI-assisted editing, implement simple scenario export/import after core persistence works.

Format:

```text
JSON
```

Export MUST include:

```text
scenario
profiles
device bindings
controller config
curve references
```

It does not need to export full simulation history by default.

Imported scenario IDs must avoid collision.

This feature is lower priority than SQLite, profiles, curves and run recording, but it is in scope for the end of v2 if core milestones are complete.

---

# 45. Error behavior

Required errors:

```text
SQLite initialization failure
scenario not found
invalid profile
curve has no points
invalid device binding
run persistence failure
unsupported schema version
```

Errors MUST be explicit and user-visible in the Mock Lab.

Do not silently fall back to fabricated data if a required physical curve is missing.

For missing physical data, either:

```text
use explicitly selected legacy/modelled fallback
```

or:

```text
stop the run with a clear configuration error
```

---

# 46. Reset behavior

Provide two distinct actions:

```text
Reset current run
Reset Mock Lab database
```

`Reset current run` does not delete scenarios or curves.

`Reset Mock Lab database` is destructive and MUST require confirmation.

Database reset reseeds:

```text
five legacy scenarios
reference physical sources
dimmer reference table
reference device profiles
```

---

# 47. Testing strategy

Tests must target deterministic behavior rather than screenshots.

## 47.1 Interpolation unit tests

Test:

```text
exact point
midpoint linear interpolation
step interpolation
clamp below
clamp above
unsorted input normalization or rejection
empty curve error
```

## 47.2 Dimming table tests

Mandatory assertions:

```text
0 V → 0% → 0 mA → 0 W → 0 lx in reference OFF row
1 V → 10% → 30 mA
5 V → 50% → 150 mA
10 V → 100% → 300 mA
10 V → 48.0 W fixture power model
10 V → 1600 lx @1m reference
10 V → 404 lx @2m reference
10 V → 182 lx @3m reference
```

Derived midpoint example:

```text
5 V → 24.0 W
5 V → 800 lx @1m
```

The test name MUST identify these as reference-model values, not measured Eaglerise values.

## 47.3 Engine determinism

Run the same scenario snapshot twice with the same:

```text
engine version
step size
curves
profiles
```

Assert identical samples and summary.

## 47.4 Persistence tests

Test:

```text
create scenario
reload repository
scenario still exists
edit temperature point
reload
point still exists
clone scenario
parent_id is correct
record run
reload
samples still exist
```

## 47.5 Migration tests

Verify the five current scenarios appear after first initialization.

Verify repeated application initialization does not duplicate seeds.

## 47.6 Architecture tests

Add a test or lint-style assertion preventing views from importing:

```text
src/mocks/
```

The previous architecture rule must become enforceable.

---

# 48. Acceptance criteria — persistence

All must pass:

- [ ] Editing an occupancy profile survives page reload.
- [ ] Editing a temperature profile survives page reload.
- [ ] Editing a daylight profile survives page reload.
- [ ] Editing a physical curve survives page reload.
- [ ] Cloned scenarios survive page reload.
- [ ] Recorded runs survive page reload.
- [ ] User changes are not overwritten by re-seeding.
- [ ] Database schema has explicit migration/version handling.

---

# 49. Acceptance criteria — physical simulation

All must pass:

- [ ] Controller logic is separate from physical panel/dimmer calculation.
- [ ] Dimmer voltage is visible in runtime state.
- [ ] Driver current is visible in runtime state.
- [ ] Fixture power is derived from a selected curve/model.
- [ ] Artificial lux is derived from a selected curve/model.
- [ ] Total lux combines artificial and daylight contributions.
- [ ] 48 W reference profile contains the mandatory section-20 table.
- [ ] Derived points are marked `derived` or `modelled`.
- [ ] Published anchors are distinguishable from interpolated values.
- [ ] The exact Eaglerise voltage/current curve is never falsely described as measured/published when it is not.

---

# 50. Acceptance criteria — simulation time

All must pass:

- [ ] `tick(deltaSeconds)` works.
- [ ] Simulation resolution is independent from playback speed.
- [ ] A complete 24-hour run can execute rapidly.
- [ ] A 60-second step produces 1440 time steps for 24 h.
- [ ] Events are not skipped at high playback speed.
- [ ] Reset reproduces the same initial state.

---

# 51. Acceptance criteria — Mock Lab UI

All must pass:

- [ ] Simulator route opens the Mock Lab.
- [ ] No direct `allScenarios` import remains in the view.
- [ ] Scenario CRUD is functional.
- [ ] Scenario clone is functional.
- [ ] Occupancy graph/table is editable.
- [ ] Temperature graph/table is editable.
- [ ] Daylight graph/table is editable.
- [ ] Dimming curve graph/table is editable.
- [ ] Current runtime voltage/mA/W/lx can be inspected.
- [ ] Run 24h is functional.
- [ ] Historical runs can be opened.
- [ ] At least two runs can be compared.
- [ ] Functional behavior does not depend on elaborate visual styling.

---

# 52. Acceptance criteria — backwards compatibility

All must pass:

- [ ] Overview still renders.
- [ ] Lighting still renders.
- [ ] Climate still renders.
- [ ] Activity still renders.
- [ ] Five legacy scenarios still work.
- [ ] Existing relevant tests are migrated, not simply deleted.
- [ ] `HomeAssistantAdapter` remains a stub boundary.
- [ ] `legacy-linear-v1` exists for old aggregate scenarios.

---

# 53. Implementation phases

Implement in this order.

Do not start later phases while earlier architectural foundations are broken.

## Phase 0 — Verify baseline

Tasks:

1. install dependencies using the repository's current Bun workflow;
2. run current build/typecheck/tests/lint;
3. record existing failures before changing code;
4. inspect current route/view/store behavior;
5. do not change UI yet.

Exit condition:

```text
baseline status documented
```

## Phase 1 — Update project contract

Tasks:

1. retain this `PLAN-v2.md` in repository root;
2. add a short notice to old `PLAN.md` that v2 supersedes conflicting scope;
3. explicitly document SQLite/persistence now in scope.

Exit condition:

```text
no ambiguity about which plan is authoritative
```

## Phase 2 — Persistence foundation

Tasks:

1. add SQLite WASM dependency;
2. create database initialization;
3. add migrations;
4. add repository contracts;
5. add SQLite repository implementations;
6. add repository tests/fakes where needed.

No simulator UI rewrite yet.

Exit condition:

```text
scenario/curve/run repositories operate independently of views
```

## Phase 3 — Seed and migrate current scenarios

Tasks:

1. seed five existing scenarios;
2. seed source references;
3. seed physical device profiles;
4. seed mandatory 0–10 V guide table;
5. make seeding idempotent.

Exit condition:

```text
fresh DB contains legacy scenarios + reference physical data exactly once
```

## Phase 4 — Remove global scenario dependency

Tasks:

1. change `DemoEngine` to accept scenario objects;
2. update `DemoStore` loading path;
3. create `SimulationConfigStore`;
4. remove `allScenarios` import from `SimulatorView`;
5. select scenarios through repository/store.

Exit condition:

```text
runtime no longer requires global mock scenario lookup
```

## Phase 5 — Variable simulation clock

Tasks:

1. implement `tick(deltaSeconds)`;
2. separate step size from playback speed;
3. preserve 1-second legacy behavior where necessary;
4. add full-day execution.

Exit condition:

```text
24h deterministic execution works at 60s resolution
```

## Phase 6 — Time profiles

Tasks:

1. implement generic profile sampler;
2. implement step interpolation;
3. implement linear interpolation;
4. integrate occupancy profile;
5. integrate temperature profile;
6. integrate daylight profile;
7. add tests.

Exit condition:

```text
engine state can be driven by stored time profiles
```

## Phase 7 — Physical lighting separation

Tasks:

1. split controller from plant;
2. implement curve interpolation service;
3. create legacy linear physical model;
4. create 0–10 V reference model;
5. add dimmer voltage/current to state;
6. add fixture power/lux to state;
7. add mandatory guide-table tests.

Exit condition:

```text
brightness command no longer directly fabricates watts/lux in the new physical profile
```

## Phase 8 — Mock Lab editor

Tasks:

1. rename/reframe Simulator internally as Mock Lab;
2. add Scenario section;
3. add Environment section;
4. add Devices section;
5. add Curves section;
6. add Run section;
7. retain Live Override mode.

Exit condition:

```text
user can mutate a scenario without editing source code
```

## Phase 9 — Run persistence

Tasks:

1. create run at execution start;
2. batch-save samples;
3. save activities;
4. save summary;
5. add History UI.

Exit condition:

```text
completed simulation remains inspectable after reload
```

## Phase 10 — Run comparison

Tasks:

1. select 2–3 runs;
2. calculate/display summary comparison;
3. display time-series overlays where useful;
4. do not automatically declare a winner.

Exit condition:

```text
same scenario under different hypotheses can be compared quantitatively
```

## Phase 11 — Hardening

Tasks:

1. architecture tests;
2. migration tests;
3. error states;
4. database reset flow;
5. responsive functional checks;
6. import/export if core system is stable;
7. remove obsolete dead code only after behavior parity.

Exit condition:

```text
bun run check passes and acceptance criteria are satisfied
```

---

# 54. Required implementation sequence inside a vertical slice

When implementing a feature, use this order:

```text
model/types
→ pure domain/service logic
→ tests
→ persistence/repository
→ store
→ component/view
→ integration test
```

Do not begin with UI and invent domain behavior inside click handlers.

---

# 55. Coding rules

1. Prefer pure functions for interpolation and physical calculations.
2. Keep SQL parameterized.
3. Keep TypeScript strict.
4. Avoid `any` unless wrapping a third-party boundary and documented.
5. Keep UI event handlers thin.
6. No silent catches that replace errors with fake data.
7. Do not duplicate curve calculations across components.
8. Do not store derived runtime values as configuration unless explicitly needed.
9. Persist source/provenance metadata alongside physical curves.
10. Do not delete old behavior before migration tests pass.

---

# 56. Performance constraints

This is a local simulation laboratory, not a high-frequency real-time physics engine.

Target resolution:

```text
1 minute for normal 24h simulations
```

A run with several zones should complete quickly in fast mode.

Do not redraw every chart for every internal step during fast full-day execution.

Recommended approach:

```text
engine computes full run
UI updates progress periodically
charts render sampled/completed results
```

Persist samples in batches.

---

# 57. Responsive behavior

Preserve the current project's responsive intent.

For Mock Lab:

Desktop:

```text
left/upper configuration controls
large graph/editor area
runtime/readout adjacent where useful
```

Mobile:

```text
single column
section selector
charts full width
numeric tables horizontally scroll only if unavoidable
```

Do not build separate desktop/mobile feature implementations.

---

# 58. Accessibility minimum

Functional controls need:

```text
labels
keyboard focus
button text/title
numeric field labels
chart values also available in table form
```

Do not make graph dragging the only way to edit a point.

---

# 59. Source-of-truth policy for physical values

Every important physical value must be one of:

```text
PUBLISHED
MEASURED
USER-SUPPLIED
DERIVED
MODELLED
LEGACY
```

The system MUST make this classification inspectable.

If a value is unknown, do not invent a hidden constant.

Use either:

```text
explicit null / missing configuration
```

or:

```text
an explicit model assumption with provenance = assumption/modelled
```

---

# 60. Important physical limitations of the initial guide

The implementer must understand and preserve these limitations.

## 60.1 300 mA does not imply every 48 W panel is compatible

The project reference is specifically based on the user's 300 mA / 72–160 V factory-driver information and the chosen reference driver/profile.

Do not generalize this to all 600×600 panels.

## 60.2 Lux depends on geometry

The G7 values:

```text
1600 lx @1m
404 lx @2m
182 lx @3m
```

are center illuminance values for that reference product/test geometry.

They are not room-average lux values.

The Mock Lab should therefore label the reference lux curve with measurement distance.

## 60.3 Intermediate lux is initially modelled

The initial dimmed lux table is linearly scaled.

Real LED luminous output and optical response may differ.

The purpose of the editor is to replace the curve when measured data becomes available.

## 60.4 Intermediate watts are initially modelled

Real AC input power depends on driver efficiency and load.

Do not describe the initial `48 W × level` curve as a power-meter measurement.

## 60.5 Exact Eaglerise 0–10 V transfer is not assumed to be published

The Eaglerise datasheet verifies dimming capability and range, but the initial voltage/current point table is the separate generic reference profile.

This distinction MUST survive into code comments, data provenance and UI.

---

# 61. Suggested domain names

Use clear physical names.

Prefer:

```text
requestedBrightnessPct
dimmerVoltageV
driverCurrentMa
fixturePowerW
artificialLux
daylightLux
totalLux
```

Avoid ambiguous names such as:

```text
level
value
power
light
```

without unit/context.

---

# 62. Reference curve seed example

The seed should be represented as data similar to:

```ts
export const linear010ReferenceV1 = {
  id: "linear-0-10v-reference-v1",
  points: [
    { voltageV: 0, levelPct: 0, currentMa: 0, powerW: 0, lux1m: 0, lux2m: 0, lux3m: 0 },
    { voltageV: 1, levelPct: 10, currentMa: 30, powerW: 4.8, lux1m: 160, lux2m: 40.4, lux3m: 18.2 },
    { voltageV: 2, levelPct: 20, currentMa: 60, powerW: 9.6, lux1m: 320, lux2m: 80.8, lux3m: 36.4 },
    { voltageV: 3, levelPct: 30, currentMa: 90, powerW: 14.4, lux1m: 480, lux2m: 121.2, lux3m: 54.6 },
    { voltageV: 4, levelPct: 40, currentMa: 120, powerW: 19.2, lux1m: 640, lux2m: 161.6, lux3m: 72.8 },
    { voltageV: 5, levelPct: 50, currentMa: 150, powerW: 24.0, lux1m: 800, lux2m: 202.0, lux3m: 91.0 },
    { voltageV: 6, levelPct: 60, currentMa: 180, powerW: 28.8, lux1m: 960, lux2m: 242.4, lux3m: 109.2 },
    { voltageV: 7, levelPct: 70, currentMa: 210, powerW: 33.6, lux1m: 1120, lux2m: 282.8, lux3m: 127.4 },
    { voltageV: 8, levelPct: 80, currentMa: 240, powerW: 38.4, lux1m: 1280, lux2m: 323.2, lux3m: 145.6 },
    { voltageV: 9, levelPct: 90, currentMa: 270, powerW: 43.2, lux1m: 1440, lux2m: 363.6, lux3m: 163.8 },
    { voltageV: 10, levelPct: 100, currentMa: 300, powerW: 48.0, lux1m: 1600, lux2m: 404, lux3m: 182 },
  ],
} as const;
```

Do not use this object directly from a view.

It is seed input for persistence and/or a tested fixture.

---

# 63. First reference scenario for the new engine

In addition to preserving legacy scenarios, create one full-day v2 scenario:

```text
reference-office-day-v2
```

It must demonstrate:

```text
24-hour timeline
occupancy profile
temperature profile
daylight profile
at least one zone using the 48W/300mA reference lighting stack
automatic daylight harvesting
absence shutdown
recorded energy/lux results
```

The exact environmental profile values can be intentionally synthetic scenario inputs, but MUST be labelled as scenario assumptions rather than measured building data.

---

# 64. Definition of done

v2 is done only when a user can perform this sequence without editing source code:

```text
1. Open Mock Lab.
2. Select reference-office-day-v2.
3. Clone it.
4. Change occupancy hours graphically or numerically.
5. Change room temperature curve.
6. Change daylight curve.
7. Inspect the 0–10 V dimmer reference curve.
8. Modify one dimmer/power/lux point.
9. Save changes.
10. Reload the browser and see changes persist.
11. Run a complete simulated day.
12. See voltage, mA, W and lux evolve with dimming.
13. Save the run.
14. Change the hypothesis.
15. Run again.
16. Compare both runs.
17. Inspect whether a physical value was published, derived, modelled or measured.
```

If this flow does not work, the Mock Lab objective has not been met.

---

# 65. Explicit prohibitions for the implementing AI

Do NOT:

- rewrite the app in another framework;
- replace SQLite with `localStorage` as the primary persistence mechanism;
- put SQL in Lit views;
- leave `SimulatorView` importing mock scenarios directly;
- hard-code the new dimming table only inside UI code;
- claim every 48 W panel uses 300 mA;
- claim the intermediate watt/lux table is measured;
- claim the generic 0–10 V transfer table is the exact Eaglerise curve;
- use uncontrolled random values in normal demos;
- delete the five existing scenarios because the new system exists;
- remove the Home Assistant adapter boundary;
- build DALI support in this phase;
- build ESPHome integration in this phase;
- prioritize styling over persistence/physics/tests;
- silently swallow invalid/missing curve configuration;
- automatically rank one experiment as universally "best";
- infer physical data that is not present without marking it as an assumption/model.

---

# 66. Final architecture target

At the end of this plan, the important flow is:

```text
SQLite scenario memory
        │
        ├── occupancy(t)
        ├── temperature(t)
        ├── daylight(t)
        ├── devices
        └── physical curves
                │
                ▼
           DemoEngine
                │
                ▼
     Lighting Controller
                │
        requested brightness
                │
                ▼
        Dimmer/Driver Model
                │
        Vdim → current mA
                │
                ▼
          Panel Model
          ├── watts
          └── lux
                │
                ▼
        Energy Integration
                │
                ▼
        Persistent Run History
                │
                ▼
        Compare Experiments
```

And the future real-world boundary remains:

```text
SIMULATED
SQLite → DemoEngine → MockAdapter

REAL
Home Assistant / ESPHome → HomeAssistantAdapter
```

The rest of the application should not need to know which world supplied the data.

---

# 67. External technical references used for the initial physical seed

These references are documentation inputs for the mock data. They are not runtime dependencies.

## Eaglerise FMS-60-350 0-10 LD-F

Manufacturer specification:

```text
https://lighting.eaglerise.com/data/upload/main/20250423/FMS-60-350%200-10%20LD-F%20spec%20REV%20B.pdf
```

Used for:

```text
0–10 V dimming capability
300 mA selectable output
70–200 VDC operating range at 300 mA
±8% current accuracy
1–100% dimming current range
1% dimming depth
88% typical full-load efficiency
standby <= 0.5 W
```

## G7-PN-6060-48W-CC panel

Product/reference specification:

```text
https://g7lighting.vn/den-panel-600x600-48w-chieu-thang-pd178334.html
https://g7lighting.vn/download-file.html?id=f17169495526656923024be0
```

Used for:

```text
600×600 mm
48 W
5280 lm
1600 lx center @ 1m
404 lx center @ 2m
182 lx center @ 3m
```

## Generic linear 0–10 V transfer reference

RND 500-00072 / 500-00073 datasheet:

```text
https://media.distrelec.com/Web/Downloads/_t/ds/RND_500-00072-RND_500-00073_eng_tds.pdf
```

Used for the generic reference transfer:

```text
0 V = 0%
1 V = 10%
...
10 V = 100%
```

This source is intentionally separate from the Eaglerise profile.

---

# 68. Implementation report required from the AI

After implementation, the AI/developer MUST report:

```text
1. files added
2. files changed
3. migrations added
4. dependencies added
5. tests added/updated
6. commands executed
7. build/test/lint results
8. any acceptance criterion not completed
9. any deviation from PLAN-v2 and why
10. which physical curve values remain modelled instead of measured
```

Do not report incomplete work as complete.

---

# 69. Core principle

The Mock Lab must make assumptions cheap to change and results easy to reproduce.

The key rule is:

> If a relationship is expected to change when real measurements arrive, prefer storing it as versioned data/curves with provenance rather than burying it as an irreversible formula in application code.

That rule applies especially to:

```text
dimmer voltage → current
current/level → watts
current/level → lux
time → occupancy
time → temperature
time → daylight
```

This is the structural basis for finding the eventual ideal version through controlled trial and error.
