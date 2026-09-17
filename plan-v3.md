Sí. La implementación debería hacerse como una **migración funcional**, no como una conversión literal de los Custom Panels de Home Assistant.

El objetivo sería este:

```text
ejemplo-guia/
    Home Assistant + Custom Panels + hass.callService + entities
                         ↓
automatizacion-v2/
    Lit + TypeScript + DemoEngine + Stores + Mock State
```

Y con una regla central:

> Ninguna vista nueva habla con Home Assistant, MQTT, dispositivos, APIs externas ni hardware. Toda acción modifica únicamente estado simulado local.

Además, en esta etapa la interfaz debe ser deliberadamente estructural: HTML funcional, componentes Lit, formularios, botones, tablas/listas y navegación. Sin trabajo visual.

---

# 1. Objetivo técnico final

Al terminar esta migración, el proyecto debería permitir hacer cosas como:

```text
Entrar a:
Espacios → Showroom → Iluminación

Pulsar:
"Spots ventana: OFF → ON"

Resultado:
1. cambia el estado mock de ese dispositivo;
2. el store notifica el cambio;
3. Showroom refleja ON;
4. Sistemas → Iluminación también refleja ON;
5. Inicio recalcula el resumen;
6. Energía recalcula consumo ficticio;
7. Actividad registra el evento;
8. al cambiar de página y volver, el estado sigue siendo ON;
9. opcionalmente, al recargar navegador, el estado puede recuperarse desde persistencia local.
```

Todo sin ningún dispositivo real.

---

# 2. Principio arquitectónico

Actualmente ya tienes una cadena útil:

```text
Vista
  ↓
DemoStore
  ↓
MockAdapter
  ↓
DemoEngine
  ↓
Services
  ↓
Models
```

No debemos romperla.

La arquitectura extendida debería quedar:

```text
                    ┌──────────────────────┐
                    │      Lit Views       │
                    │                      │
                    │ Inicio               │
                    │ Espacios             │
                    │ Sistemas             │
                    │ Actividad            │
                    │ Mock Lab             │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Domain Stores     │
                    │ building             │
                    │ devices              │
                    │ scenes               │
                    │ automation           │
                    │ activity             │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     MockAdapter      │
                    │ ÚNICO adapter activo │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     DemoEngine       │
                    │ estado simulado      │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    ▼                      ▼
              Domain Services       Mock Persistence
                                    SQLite / memoria
```

`home-assistant.adapter.ts` puede permanecer en el repositorio como implementación futura, pero **no debe utilizarse en esta fase**.

---

# 3. Qué NO hacer

No haría ninguna de estas cosas:

```text
✗ iframe del Custom Panel antiguo

✗ copiar showroom-panel.js y parchearlo

✗ simular un objeto "hass" falso para engañar al código viejo

✗ mantener entity_id de Home Assistant como identificador principal

✗ crear un store independiente para Showroom

✗ hacer que cada vista mantenga su propio estado

✗ guardar ON/OFF dentro del Web Component

✗ duplicar dispositivos entre Showroom y Lighting

✗ implementar estilos durante esta fase

✗ conectar Home Assistant "temporalmente"

✗ llamar servicios reales aunque los dispositivos no existan
```

Especialmente evitaría crear un falso `hass.callService()`. Eso trasladaría la arquitectura vieja al proyecto nuevo en vez de migrarla.

---

# 4. Qué vamos a migrar realmente

El directorio `ejemplo-guia/www` contiene bastante más que Showroom/Lobby/Oficinas.

El inventario relevante es aproximadamente:

```text
automatizaciones-panel.js
calendario-laboral-panel.js
climatizacion-panel.js
control-general-panel.js
grabacion-panel.js
impresiones-panel.js
lobby-panel.js
lobby-3d-panel.js
notifications-panel.js
oficinas-panel.js

showroom-panel.js
showroom-energy-panel.js
showroom-productos-panel.js
showroom-experimentos-panel.js
showroom-v2-panel.js
showroom-3d-panel.js

panel-3k6k-showroom.js
panel-backlit-showroom.js
spot-20w-showroom.js
downlight-showroom.js
colgante-showroom.js
slim-showroom.js
```

No todos deben transformarse en una página independiente.

Ese es precisamente uno de los cambios estructurales.

---

# 5. Clasificar antes de migrar

Primero dividiría esos Custom Panels en dominios.

## A. Espacios

```text
Showroom
Lobby
Oficinas
```

## B. Sistemas

```text
Iluminación
Climatización
Energía
Automatizaciones
```

## C. Operación

```text
Actividad
Notificaciones
Calendario laboral
Grabación
Impresiones
```

## D. Experimentación

```text
Mock Lab
Experimentos
Simulación
```

## E. Visualización

```text
Showroom 3D
Lobby 3D
```

Por ahora el 3D debería tratarse también como Mock y como capacidad opcional.

---

# 6. Nueva navegación

Modificar:

```text
src/app/router.ts
src/app/app-shell.ts
src/components/app-nav/app-nav.ts
```

El resultado conceptual:

```text
Inicio

Espacios
├── Showroom
├── Lobby
└── Oficinas

Sistemas
├── Iluminación
├── Climatización
├── Energía
└── Automatizaciones

Operación
├── Actividad
├── Notificaciones
├── Calendario
├── Grabación
└── Impresiones

Mock Lab
```

No significa necesariamente que todos deban mostrarse desplegados permanentemente. Eso será problema de UX posterior.

En esta fase basta con una navegación HTML elemental.

---

# 7. Rehacer el router antes de migrar vistas

Ahora tienes:

```ts
type AppRoute =
  | "overview"
  | "lighting"
  | "climate"
  | "activity"
  | "simulator";
```

Eso debe desaparecer porque ya no escala.

Propongo:

```ts
export type AppRoute =
  | { kind: "overview" }
  | { kind: "spaces" }
  | {
      kind: "space";
      spaceId: string;
      section?: string;
    }
  | {
      kind: "system";
      systemId: string;
      section?: string;
    }
  | {
      kind: "operation";
      operationId: string;
    }
  | { kind: "mock-lab" }
  | { kind: "not-found" };
```

Ejemplos:

```text
#/overview

#/spaces
#/spaces/showroom
#/spaces/showroom/lighting
#/spaces/showroom/scenes
#/spaces/showroom/energy
#/spaces/showroom/products
#/spaces/showroom/visualization

#/spaces/lobby
#/spaces/lobby/lighting
#/spaces/lobby/scenes
#/spaces/lobby/visualization

#/spaces/offices
#/spaces/offices/lighting
#/spaces/offices/climate

#/systems/lighting
#/systems/climate
#/systems/energy
#/systems/automations

#/operations/activity
#/operations/notifications
#/operations/calendar
#/operations/recording
#/operations/printing

#/mock-lab
```

---

# 8. El router debería parsear y serializar

No conviene que los componentes construyan hashes manualmente.

Crear:

```text
src/app/routes.ts
```

Responsabilidades:

```ts
parseRoute(hash: string): AppRoute

routeToHash(route: AppRoute): string

isRouteActive(
  current: AppRoute,
  target: Partial<AppRoute>
): boolean
```

Entonces:

```ts
router.navigate({
  kind: "space",
  spaceId: "showroom",
  section: "lighting",
});
```

en lugar de:

```ts
window.location.hash = "#/spaces/showroom/lighting";
```

---

# 9. Introducir formalmente `Space`

Ahora existe `Zone`.

No reemplazaría `Zone`.

Son conceptos distintos:

```text
Space
= ubicación lógica/física visible para el usuario.

Zone
= unidad de simulación/control.
```

Ejemplo:

```text
Space: Oficinas

Zones:
- oficina-general
- gerencia
- reunion
- pasillo
```

Crear:

```text
src/models/space.ts
```

Por ejemplo:

```ts
export type SpaceCapability =
  | "lighting"
  | "climate"
  | "energy"
  | "scenes"
  | "products"
  | "visualization";

export interface Space {
  id: string;
  name: string;
  zoneIds: string[];
  capabilities: SpaceCapability[];
}
```

Y exportarlo desde:

```text
src/models/index.ts
```

---

# 10. Definir la topología del edificio

No debe vivir dentro de los componentes.

Crear:

```text
src/mocks/building/spaces.ts
```

Inicialmente:

```ts
export const mockSpaces: Space[] = [
  {
    id: "showroom",
    name: "Showroom",
    zoneIds: [
      "showroom-spots-window",
      "showroom-spots-2x3",
      "showroom-spots-3x3",
      "showroom-spots-tv",
      "showroom-panels-3k6k",
      "showroom-pendants",
      "showroom-slims",
      "showroom-downlights",
      "showroom-panels",
    ],
    capabilities: [
      "lighting",
      "energy",
      "scenes",
      "products",
      "visualization",
    ],
  },

  {
    id: "lobby",
    name: "Lobby",
    zoneIds: [
      // ...
    ],
    capabilities: [
      "lighting",
      "scenes",
      "visualization",
    ],
  },

  {
    id: "offices",
    name: "Oficinas",
    zoneIds: [
      // ...
    ],
    capabilities: [
      "lighting",
      "climate",
    ],
  },
];
```

---

# 11. Pero no todo debería ser `Zone`

Aquí hay que hacer una mejora importante.

El proyecto actual utiliza `Zone` como unidad de iluminación.

Pero Showroom tiene cosas como:

```text
Spots ventana
Spots 2×3
Spots 3×3
Spots TV
Paneles
Colgantes
Slims
Downlights
```

Conceptualmente son **dispositivos o grupos de dispositivos**, no necesariamente zonas completas.

Por eso introduciría un modelo de Device.

---

# 12. Crear modelo `MockDevice`

Archivo:

```text
src/models/device.ts
```

Propuesta:

```ts
export type DeviceKind =
  | "light"
  | "switch"
  | "climate"
  | "sensor"
  | "relay"
  | "virtual";

export type DevicePowerState = "on" | "off";

export interface MockDevice {
  id: string;
  name: string;

  kind: DeviceKind;

  spaceId: string;
  zoneId?: string;

  powerState?: DevicePowerState;

  brightnessPct?: number;

  nominalPowerW?: number;
  actualPowerW?: number;

  available: boolean;

  metadata?: Record<string, unknown>;
}
```

Así:

```text
Space
  ↓
Zone
  ↓
Device
```

pero un Device puede existir directamente dentro de un Space si no necesita Zone.

---

# 13. Identificadores nuevos

No utilizar esto como ID interno:

```text
switch.interruptor_inteligente_switch_1
```

Eso pertenece a Home Assistant.

Cambiar a:

```text
showroom.spots-window
showroom.spots-2x3
showroom.spots-3x3
showroom.spots-tv
showroom.panels-3k6k
showroom.pendants
showroom.slims
showroom.downlights
showroom.panels
```

Si quieres conservar trazabilidad histórica:

```ts
metadata: {
  legacyHomeAssistantEntityId:
    "switch.interruptor_inteligente_switch_1"
}
```

Pero solo como metadata.

Nunca como dependencia funcional.

---

# 14. Crear catálogo Mock de dispositivos

Archivo:

```text
src/mocks/devices/showroom.devices.ts
```

Ejemplo:

```ts
export const showroomDevices: MockDevice[] = [
  {
    id: "showroom.spots-window",
    name: "Spots ventana",
    kind: "light",
    spaceId: "showroom",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 80,
    actualPowerW: 0,
    available: true,
  },

  {
    id: "showroom.spots-2x3",
    name: "Spots 2×3",
    kind: "light",
    spaceId: "showroom",
    powerState: "off",
    brightnessPct: 0,
    nominalPowerW: 120,
    actualPowerW: 0,
    available: true,
  },

  // ...
];
```

Después:

```text
src/mocks/devices/lobby.devices.ts
src/mocks/devices/offices.devices.ts
src/mocks/devices/index.ts
```

---

# 15. Separar definición y estado

No mezclaría configuración estática con estado runtime.

Mejor:

```ts
interface DeviceDefinition {
  id: string;
  name: string;
  kind: DeviceKind;
  spaceId: string;
  nominalPowerW?: number;
}

interface DeviceRuntimeState {
  deviceId: string;
  powerState?: "on" | "off";
  brightnessPct?: number;
  available: boolean;
}
```

Entonces:

```text
DeviceDefinition
= qué es

DeviceRuntimeState
= cómo está ahora
```

Esto será mucho más limpio cuando incorpores simulaciones.

---

# 16. Crear `DeviceStore`

Archivo:

```text
src/stores/device.store.ts
```

Responsabilidades:

```ts
getAll(): MockDevice[]

getById(id: string): MockDevice | undefined

getBySpace(spaceId: string): MockDevice[]

getByZone(zoneId: string): MockDevice[]

getByKind(kind: DeviceKind): MockDevice[]

subscribe(listener): unsubscribe
```

Y acciones:

```ts
toggle(deviceId: string): void

turnOn(deviceId: string): void

turnOff(deviceId: string): void

setBrightness(
  deviceId: string,
  brightnessPct: number
): void
```

Pero preferiblemente estas acciones deberían delegar al engine.

---

# 17. No hacer mutable el store directamente

Flujo correcto:

```text
Vista
 ↓
deviceStore.toggle(id)
 ↓
MockAdapter.toggleDevice(id)
 ↓
DemoEngine.toggleDevice(id)
 ↓
DeviceService
 ↓
estado
 ↓
notify()
```

No:

```text
vista
 ↓
device.powerState = "on"
```

---

# 18. Ampliar `WitmindDataAdapter`

Actualmente:

```ts
getBuilding()
getEnergyOverview()
getActivities()
getLightingZones()
getClimateZones()
applyScenario()
updateSimulationInput()
```

Añadir:

```ts
getSpaces(): Promise<Space[]>;

getSpace(id: string): Promise<Space | undefined>;

getDevices(): Promise<MockDevice[]>;

getDevicesBySpace(
  spaceId: string
): Promise<MockDevice[]>;

setDevicePower(
  deviceId: string,
  state: DevicePowerState
): Promise<void>;

toggleDevice(
  deviceId: string
): Promise<void>;

setDeviceBrightness(
  deviceId: string,
  brightnessPct: number
): Promise<void>;
```

Más adelante:

```ts
getScenes()
runScene()
getAutomations()
setAutomationEnabled()
```

---

# 19. Ampliar `DemoEngine`

Añadir estado:

```ts
private spaces: Space[];
private devices: Map<string, MockDevice>;
private scenes: Map<string, MockScene>;
private automations: Map<string, MockAutomation>;
```

Métodos:

```ts
getSpaces()

getSpace(id)

getDevices()

getDevice(id)

getDevicesBySpace(spaceId)

turnDeviceOn(id)

turnDeviceOff(id)

toggleDevice(id)

setDeviceBrightness(id, pct)
```

---

# 20. Cada mutación debe emitir evento

Por ejemplo:

```ts
toggleDevice("showroom.spots-window");
```

debe generar internamente:

```text
antes:
off

después:
on
```

Y posteriormente crear:

```ts
SmartActivity {
  category: "lighting",
  source: "manual",
  title: "Spots ventana encendidos",
  reason: "Acción mock del usuario",
  action: "power_on"
}
```

Todo reutilizando `activity.service.ts`.

---

# 21. Introducir `DeviceService`

Archivo:

```text
src/services/device.service.ts
```

Debe contener lógica pura.

Ejemplo:

```ts
DeviceService.setPowerState(
  definition,
  runtime,
  "on"
)
```

Resultado:

```ts
{
  powerState: "on",
  brightnessPct: 100,
  actualPowerW: 80
}
```

Para OFF:

```ts
{
  powerState: "off",
  brightnessPct: 0,
  actualPowerW: 0
}
```

---

# 22. Integrar Device con energía

Actualmente energía deriva en gran medida de `Zone.lighting`.

Al introducir dispositivos debes evitar dos modelos de consumo desconectados.

Extender:

```text
src/services/energy.service.ts
```

Para poder calcular:

```ts
calculateDevicePower(device)
calculateSpacePower(devices)
calculateBuildingDevicePower(devices)
```

Ejemplo:

```text
Spots ventana ON       80 W
Spots 2×3 ON          120 W
Spots 3×3 OFF           0 W
Paneles OFF             0 W
----------------------------
Showroom              200 W
```

---

# 23. El estado debe ser global y compartido

Este es probablemente el requisito más importante.

Si:

```text
#/spaces/showroom/lighting
```

enciende:

```text
showroom.spots-window
```

entonces:

```text
#/systems/lighting
```

debe obtener exactamente el mismo objeto lógico.

No dos copias.

Debe existir una única fuente:

```text
DemoEngine.devices
```

---

# 24. Escenas

El Showroom antiguo tiene escenas como:

```text
Presentación
Reunión
Muestra spots
Slims
Paneles
Downlights
etc.
```

No migrarlas como scripts Home Assistant.

Crear:

```text
src/models/scene.ts
```

```ts
export interface MockSceneAction {
  deviceId: string;
  powerState?: "on" | "off";
  brightnessPct?: number;
}

export interface MockScene {
  id: string;
  name: string;
  spaceId: string;
  actions: MockSceneAction[];
}
```

---

# 25. Convertir escena Home Assistant → escena Mock

Por ejemplo, la antigua escena:

```text
scene.presentacion

ON:
Spots ventana
Spots TV
```

debe convertirse en algo equivalente a:

```ts
{
  id: "showroom.presentation",
  name: "Presentación",
  spaceId: "showroom",
  actions: [
    {
      deviceId: "showroom.spots-window",
      powerState: "on",
    },
    {
      deviceId: "showroom.spots-tv",
      powerState: "on",
    },

    {
      deviceId: "showroom.spots-2x3",
      powerState: "off",
    },
    {
      deviceId: "showroom.spots-3x3",
      powerState: "off",
    },
  ],
}
```

---

# 26. Crear `SceneService`

```text
src/services/scene.service.ts
```

Lógica:

```ts
applyScene(
  scene: MockScene,
  devices: Map<string, MockDevice>
)
```

Debe aplicar todas las acciones como una transacción lógica.

---

# 27. Crear `SceneStore`

```text
src/stores/scene.store.ts
```

API:

```ts
getAll()

getBySpace(spaceId)

getById(id)

run(sceneId)
```

---

# 28. Registrar escena en Activity

Al pulsar:

```text
Presentación
```

no generaría necesariamente 9 actividades individuales.

Generaría una actividad de alto nivel:

```text
Escena "Presentación" aplicada
Showroom
2 dispositivos encendidos
7 dispositivos apagados
```

Opcionalmente el motor puede guardar internamente el diff completo.

---

# 29. Encendido/apagado general

El antiguo:

```text
script.showroom_encendido_general
script.showroom_apagado_general
```

ya no debería ser un script externo.

Podría modelarse como comandos:

```ts
turnSpaceOn("showroom")
turnSpaceOff("showroom")
```

o escenas internas:

```text
showroom.all-on
showroom.all-off
```

Preferiría comandos semánticos en `DeviceService`.

---

# 30. Automatizaciones Mock

Migrar:

```text
automatizaciones-panel.js
```

a:

```text
src/models/automation.ts
src/stores/automation.store.ts
src/services/automation.service.ts
src/mocks/automations/
src/views/systems/automations/
```

Modelo:

```ts
export interface MockAutomation {
  id: string;
  name: string;
  enabled: boolean;

  trigger: MockTrigger;
  conditions: MockCondition[];
  actions: MockAutomationAction[];

  lastTriggeredAt?: string;
}
```

---

# 31. No crear un motor de automatización completo todavía

Primera fase:

```text
listar
activar/desactivar
ejecutar manualmente
registrar última ejecución
```

Después:

```text
evaluar triggers durante tick()
```

Eso evita introducir complejidad prematuramente.

---

# 32. Motor de automatizaciones futuro

Dentro de:

```ts
DemoEngine.tick()
```

después de actualizar variables ambientales:

```text
1 avanzar reloj
2 samplear perfiles
3 eventos del escenario
4 evaluar automatizaciones
5 aplicar acciones
6 recalcular energía
7 registrar telemetría
```

---

# 33. Climatización

Ya tienes:

```text
models/climate.ts
services/climate.service.ts
stores/climate.store.ts
views/climate/climate-view.ts
```

No duplicarla.

El viejo:

```text
climatizacion-panel.js
```

debe convertirse principalmente en:

```text
datos
controles
agrupaciones
```

sobre el modelo actual.

---

# 34. Climatización por espacio

La página:

```text
#/systems/climate
```

muestra todo.

Mientras:

```text
#/spaces/offices/climate
```

hace:

```ts
climateStore
  .getZones()
  .filter(zone => belongsToSpace(zone, "offices"));
```

Misma fuente.

---

# 35. Iluminación

Exactamente lo mismo.

```text
#/systems/lighting
```

= todas las luminarias.

```text
#/spaces/showroom/lighting
```

= filtro por `spaceId`.

```text
#/spaces/lobby/lighting
```

= filtro Lobby.

---

# 36. Replantear `lighting-zone`

Actualmente el componente está orientado a `Zone`.

Mantenerlo si resulta útil para iluminación ambiental controlada.

Pero añadir:

```text
src/components/device-control/device-control.ts
```

sin estilos:

```html
<article>
  <h3>Spots ventana</h3>
  <p>Estado: ON</p>

  <button>Apagar</button>

  <label>
    Intensidad
    <input type="range">
  </label>
</article>
```

Nada más.

---

# 37. Componentes sin estilos

Para esta fase:

```ts
import { LitElement, html } from "lit";
```

No:

```ts
import { LitElement, css, html } from "lit";
```

No:

```ts
static styles = css`...`;
```

No clases puramente visuales si no aportan semántica.

---

# 38. Eliminar CSS global

Actualmente tienes:

```text
src/styles/reset.css
src/styles/tokens.css
src/styles/layout.css
```

En esta fase:

```text
eliminar importaciones
```

y eventualmente borrar esos archivos.

Pero antes comprobar que `index.html` o `main.ts` no dependen de ellos.

---

# 39. Eliminar estilos de los Web Components

Tienes aproximadamente 22 archivos en `src` con estilos inline/static.

La tarea debe hacerse sistemáticamente:

```text
src/app/app-shell.ts
src/components/*
src/views/*
src/components/mock-lab/*
```

Convertir:

```ts
import { LitElement, css, html } from "lit";
```

a:

```ts
import { LitElement, html } from "lit";
```

Y borrar:

```ts
static styles = css`...`;
```

---

# 40. No eliminar estructura HTML

Ejemplo actual:

```html
<div class="kpi-grid">
   ...
</div>
```

Podría pasar a:

```html
<section>
  <h2>Lighting metrics</h2>
  ...
</section>
```

Mejorar la semántica mientras se elimina presentación.

---

# 41. ECharts

Actualmente existe:

```text
echarts
chart-card
```

En una fase estrictamente estructural, yo lo sacaría de las vistas principales.

Porque un gráfico es principalmente una representación visual.

Conservar los datos.

Por ejemplo, sustituir:

```text
Daylight Harvesting chart
```

por:

```html
<table>
  <thead>
    <tr>
      <th>Hora</th>
      <th>Daylight lux</th>
      <th>Brightness</th>
    </tr>
  </thead>
</table>
```

Esto permite comprobar la telemetría sin trabajo gráfico.

---

# 42. No es necesario desinstalar ECharts inmediatamente

Primera fase:

```text
dejar dependencia
dejar chart-card sin utilizar
```

Segunda limpieza:

```text
eliminar chart-card
eliminar ECharts si ningún componente lo utiliza
```

De esa manera el cambio es incremental.

---

# 43. Crear `spaces-view`

Archivo:

```text
src/views/spaces/spaces-view.ts
```

Responsabilidad:

```text
listar espacios disponibles
```

HTML:

```html
<h1>Espacios</h1>

<ul>
  <li>
    <a href="#/spaces/showroom">Showroom</a>
  </li>
  <li>
    <a href="#/spaces/lobby">Lobby</a>
  </li>
  <li>
    <a href="#/spaces/offices">Oficinas</a>
  </li>
</ul>
```

Eso es suficiente.

---

# 44. Crear vista genérica de espacio

No:

```text
showroom-view.ts
lobby-view.ts
offices-view.ts
```

como tres estructuras totalmente diferentes.

Crear:

```text
src/views/spaces/space-view.ts
```

Recibe:

```ts
spaceId
section
```

Y obtiene:

```ts
SpaceStore.getById(spaceId)
```

---

# 45. `space-view` resuelve capacidades

Pseudoestructura:

```ts
render() {
  const space = spacesStore.getById(this.spaceId);

  return html`
    <h1>${space.name}</h1>

    ${this.renderSections(space)}

    ${this.renderCurrentSection(space)}
  `;
}
```

---

# 46. Navegación interna de Space

Generar a partir de:

```ts
space.capabilities
```

Por ejemplo Showroom:

```html
<nav>
  <a>Resumen</a>
  <a>Iluminación</a>
  <a>Escenas</a>
  <a>Energía</a>
  <a>Productos</a>
  <a>Visualización</a>
</nav>
```

Oficinas:

```html
<nav>
  <a>Resumen</a>
  <a>Iluminación</a>
  <a>Climatización</a>
</nav>
```

No codificar esos tabs manualmente en cada vista.

---

# 47. Crear registry de secciones

Archivo:

```text
src/views/spaces/space-section.registry.ts
```

Por ejemplo:

```ts
export const SPACE_SECTION_LABELS = {
  overview: "Resumen",
  lighting: "Iluminación",
  climate: "Climatización",
  energy: "Energía",
  scenes: "Escenas",
  products: "Productos",
  visualization: "Visualización",
};
```

---

# 48. `Space Overview`

Crear:

```text
src/views/spaces/sections/space-overview.ts
```

Debe presentar:

```text
nombre
número de dispositivos
dispositivos ON
consumo
temperatura si existe
ocupación si existe
escena activa si existe
última actividad
```

Todo obtenido de stores.

Nada inventado dentro del componente.

---

# 49. Showroom Lighting

Crear:

```text
src/views/spaces/sections/space-lighting.ts
```

Debe funcionar para Showroom, Lobby u Oficinas.

Recibe:

```ts
spaceId
```

Consulta:

```ts
deviceStore.getLightingBySpace(spaceId)
```

Renderiza todos.

---

# 50. Showroom Scenes

Crear:

```text
src/views/spaces/sections/space-scenes.ts
```

Consulta:

```ts
sceneStore.getBySpace(spaceId)
```

Render:

```html
<h2>Escenas</h2>

<button>Presentación</button>
<button>Reunión</button>
<button>Muestra spots</button>
```

Cada botón:

```ts
sceneStore.run(scene.id);
```

---

# 51. Showroom Energy

No migrar lógica de Home Assistant del viejo `showroom-energy-panel.js`.

Crear:

```text
src/views/spaces/sections/space-energy.ts
```

Consulta:

```ts
energyStore.getForSpace(spaceId)
```

Mostrar:

```text
consumo actual
potencia nominal
ahorro simulado
dispositivos consumidores
histórico Mock
```

---

# 52. Productos Showroom

Aquí hay que separar catálogo y dispositivos.

Los productos:

```text
Panel Backlit
Panel 3K/6K
Spot 20W
Downlight
Colgante
Slim
```

no son necesariamente Device.

Crear:

```text
src/models/product.ts
```

```ts
interface Product {
  id: string;
  name: string;
  family: string;
  specifications: Record<string, string | number>;
  controlledDeviceIds: string[];
}
```

---

# 53. Catálogo mock de productos

Crear:

```text
src/mocks/products/showroom.products.ts
```

Ejemplo:

```ts
{
  id: "panel-backlit",
  name: "Panel Backlit",
  family: "panel",
  specifications: {
    size: "60x60",
    powerW: 48,
  },
  controlledDeviceIds: [
    "showroom.panels",
  ]
}
```

---

# 54. Product view

Crear:

```text
src/views/spaces/sections/space-products.ts
```

Sin imágenes si el objetivo actual es arquitectura.

Mostrar:

```text
Panel Backlit
Tipo: panel
Potencia nominal: 48 W
Dispositivo asociado: showroom.panels
Estado: ON
[Apagar]
```

---

# 55. Los archivos específicos de producto antiguos

Estos:

```text
panel-3k6k-showroom.js
panel-backlit-showroom.js
spot-20w-showroom.js
downlight-showroom.js
colgante-showroom.js
slim-showroom.js
```

no deberían producir seis mini-apps.

Su información útil debe migrarse hacia:

```text
ProductDefinition
DeviceDefinition
Mock state
```

Y luego `space-products.ts` la consume.

---

# 56. Showroom Experimentos

Actualmente tienes:

```text
showroom-experimentos-panel.js
```

No lo pondría como sección de producción del espacio.

Migrarlo hacia:

```text
Mock Lab
```

Por ejemplo:

```text
Mock Lab
├ Device overrides
├ Scenarios
├ Showroom experiments
├ Curves
└ Run history
```

Porque conceptualmente es laboratorio.

---

# 57. Showroom V2

No mantener:

```text
Showroom
Showroom V2
Showroom Experimentos
```

como tres vistas operativas.

La migración debe escoger una única representación:

```text
#/spaces/showroom
```

Y absorber las capacidades válidas de las variantes anteriores.

---

# 58. Lobby

`lobby-panel.js` debe convertirse en datos + capacidades.

Crear:

```text
src/mocks/devices/lobby.devices.ts
src/mocks/scenes/lobby.scenes.ts
```

Y usar los mismos:

```text
space-lighting
space-scenes
```

No construir `lobby-lighting-view` salvo que exista comportamiento verdaderamente exclusivo.

---

# 59. Oficinas

`oficinas-panel.js` deberá mapearse a:

```text
Space: offices

Sections:
overview
lighting
climate
```

Y a las correspondientes zones.

Ejemplo:

```text
offices.general
offices.management
offices.meeting-room
```

según lo que se extraiga del panel antiguo.

---

# 60. Control General

`control-general-panel.js` no debería sobrevivir como página idéntica.

Sus responsabilidades deben distribuirse.

Por ejemplo:

```text
estado global
→ Inicio

encendido general
→ comando de edificio

climatización global
→ Sistemas/Clima

resumen de consumo
→ Inicio/Energía

escenas globales
→ Automatizaciones o escenas
```

---

# 61. Implementar comandos globales mock

En el engine:

```ts
turnAllLightsOn()

turnAllLightsOff()

turnSpaceOn(spaceId)

turnSpaceOff(spaceId)
```

Todo sobre `MockDevice`.

---

# 62. Home / Overview

La actual `overview-view.ts` debería transformarse para consultar:

```text
spaces
devices
energy
activity
climate
```

En esta fase, simplemente:

```html
<h1>Inicio</h1>

<h2>Edificio</h2>
<p>Dispositivos: 32</p>
<p>Encendidos: 11</p>
<p>Consumo: 820W</p>

<h2>Espacios</h2>
<ul>
 ...
</ul>
```

---

# 63. Activity

Ya existe.

Extender categorías si hace falta:

```ts
type ActivityCategory =
  | "energy"
  | "lighting"
  | "climate"
  | "occupancy"
  | "automation"
  | "scene"
  | "device"
  | "system";
```

Toda interacción manual Mock debe dejar rastro.

---

# 64. Activity como auditoría de Mock

Ejemplos:

```text
10:23
Spots ventana → ON
Origen: manual
Espacio: Showroom

10:24
Escena Presentación aplicada
Origen: scene
Espacio: Showroom

10:31
Temperatura objetivo → 22°C
Origen: manual
Espacio: Oficinas
```

Esto resulta muy útil para validar la arquitectura.

---

# 65. Persistencia: decidir dos niveles de estado

Hay dos cosas diferentes:

```text
A. estado runtime
B. configuración persistida
```

Runtime:

```text
ON/OFF
brightness
temperature
occupancy
current scene
```

Configuración:

```text
devices
scenarios
curves
profiles
```

---

# 66. Persistencia inicial recomendada

Dado que ya tienes SQLite WASM y repositories, yo incorporaría persistencia del estado Mock, pero no como requisito del primer commit.

Secuencia:

```text
Fase 1
estado vive en DemoEngine

Fase 2
snapshot runtime persistible

Fase 3
rehidratación al arrancar
```

---

# 67. Modelo de snapshot

Crear:

```ts
export interface MockRuntimeSnapshot {
  version: number;
  savedAt: string;

  devices: DeviceRuntimeState[];

  climate: ClimateRuntimeState[];

  automations: AutomationRuntimeState[];
}
```

---

# 68. Repository

Crear:

```text
src/persistence/repositories/runtime-state.repository.ts
src/persistence/repositories/sqlite-runtime-state.repository.ts
```

Métodos:

```ts
save(snapshot)

load()

clear()
```

---

# 69. No guardar en cada clic directamente desde la vista

Flujo:

```text
click
 ↓
engine mutation
 ↓
notify
 ↓
runtime persistence coordinator
```

No:

```text
button → SQLite
```

---

# 70. Persistencia también debe ser Mock

Importante conceptualmente:

SQLite local no convierte el proyecto en "real".

Sigue siendo:

```text
mock runtime persistente
```

No existe comunicación con el mundo físico.

---

# 71. Calendario laboral

`calendario-laboral-panel.js` utiliza lógica propia de Home Assistant/custom component.

Para la migración Mock:

Crear:

```text
src/models/calendar.ts
src/stores/calendar.store.ts
src/mocks/calendar/default-calendar.ts
src/views/operations/calendar/
```

Datos:

```ts
interface MockCalendarDay {
  date: string;
  workingDay: boolean;
  openingTime?: string;
  closingTime?: string;
  note?: string;
}
```

---

# 72. Calendario primero CRUD Mock

Debe permitir:

```text
listar días
marcar laboral/no laboral
editar horario
guardar en memoria/SQLite
```

No debe ejecutar nada real inicialmente.

Posteriormente las automatizaciones podrán consultar:

```ts
calendarStore.isWorkingDay(date)
```

---

# 73. Notifications

`notifications-panel.js` se convierte en:

```text
src/models/notification.ts
src/stores/notification.store.ts
src/views/operations/notifications/
```

Mock:

```ts
interface MockNotification {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
}
```

---

# 74. Las notificaciones deben surgir del motor

Ejemplos:

```text
"Consumo elevado en Showroom"
"Temperatura fuera de rango"
"Automatización ejecutada"
"Dispositivo Mock marcado unavailable"
```

Pero sin push real, email, Telegram, etc.

---

# 75. Grabación

`grabacion-panel.js` no debe controlar hardware.

Interpretarlo como:

```text
registro de sesión mock
```

Aprovechar:

```text
DemoEngine.startRecording()
DemoEngine.stopRecording()
SimulationSample
RunRepository
```

Ya tienes buena parte del backend.

La nueva vista solo necesita exponer esa infraestructura.

---

# 76. Grabación Mock

Ruta:

```text
#/operations/recording
```

Acciones:

```text
Start mock recording
Stop
List runs
Inspect samples
Delete run
```

Todo dentro de SQLite.

---

# 77. Impresiones

`impresiones-panel.js` debe analizarse funcionalmente.

Si representa impresiones físicas, por ahora:

```text
MockPrintJob
```

Modelo:

```ts
interface MockPrintJob {
  id: string;
  documentName: string;
  status:
    | "queued"
    | "printing"
    | "completed"
    | "failed";

  createdAt: string;
}
```

Sin mandar nada a una impresora.

---

# 78. `PrintService`

Podría simplemente evolucionar estados:

```text
queued
→ processing
→ completed
```

mediante el reloj Mock.

Así puedes probar flujos operativos.

---

# 79. 3D

Tienes:

```text
showroom-3d-panel.js
lobby-3d-panel.js
witmind-3d-panel.js
models/*.glb
```

El 3D no es prioritario si el objetivo ahora es infraestructura.

No eliminaría la capacidad.

Definir:

```text
visualization
```

pero implementar inicialmente:

```html
<h2>Visualización</h2>
<p>Mock 3D visualization placeholder.</p>

<ul>
  <li>Spots ventana: ON</li>
  <li>Paneles: OFF</li>
</ul>
```

---

# 80. Dejar 3D real para otra fase

Cuando se implemente Three.js/WebGL:

```text
visualización
      ↓
lee DeviceStore
```

Nunca:

```text
visualización 3D
      ↓
mantiene su propio estado
```

Ese límite es fundamental.

---

# 81. App Shell sin estilos

Actualmente `app-shell.ts` contiene CSS responsive.

Durante esta fase reduciría a:

```ts
render() {
  return html`
    <app-nav .currentRoute=${this.currentRoute}></app-nav>

    <main>
      ${this.renderCurrentView()}
    </main>
  `;
}
```

Nada más.

---

# 82. Navigation sin estilos

`app-nav.ts` puede ser:

```html
<nav>
  <a>Inicio</a>

  <details>
    <summary>Espacios</summary>
    <a>Showroom</a>
    <a>Lobby</a>
    <a>Oficinas</a>
  </details>

  <details>
    <summary>Sistemas</summary>
    ...
  </details>
</nav>
```

HTML nativo.

No necesita JS para desplegar siquiera.

---

# 83. Eso reduce mucho código accidental

Ahora `app-nav.ts` tiene:

```text
sidebar desktop
topbar mobile
mobile-menu
media queries
menuOpen
toggleMenu()
closeMenu()
```

Todo eso se puede eliminar en esta fase.

La arquitectura de navegación permanece, la presentación no.

---

# 84. Sistema de vistas del AppShell

Evitar un `switch` gigantesco.

Ahora tienes:

```ts
switch (currentRoute) {
  case "overview":
  case "lighting":
  ...
}
```

Con rutas dinámicas se vuelve incómodo.

Crear métodos:

```ts
renderOverview()

renderSpaceRoute()

renderSystemRoute()

renderOperationRoute()

renderMockLab()
```

---

# 85. Ejemplo

```ts
private renderCurrentView() {
  const route = this.currentRoute;

  switch (route.kind) {
    case "overview":
      return html`<overview-view></overview-view>`;

    case "spaces":
      return html`<spaces-view></spaces-view>`;

    case "space":
      return html`
        <space-view
          .spaceId=${route.spaceId}
          .section=${route.section}
        ></space-view>
      `;

    case "system":
      return this.renderSystem(route);

    case "operation":
      return this.renderOperation(route);

    case "mock-lab":
      return html`<simulator-view></simulator-view>`;

    default:
      return html`<not-found-view></not-found-view>`;
  }
}
```

---

# 86. Sistemas

Mantener tus vistas actuales pero mover conceptualmente:

```text
src/views/lighting
→ src/views/systems/lighting

src/views/climate
→ src/views/systems/climate
```

Crear:

```text
src/views/systems/energy/
src/views/systems/automations/
```

---

# 87. Activity

Mover:

```text
src/views/activity/
```

a:

```text
src/views/operations/activity/
```

o dejar físicamente donde está al principio para reducir cambios.

La semántica de URL puede cambiar antes que carpetas.

---

# 88. Mock Lab

Lo que tienes está bastante avanzado:

```text
curve-editor
devices-manager
live-override
profile-editor
run-controls
run-history
scenario-manager
```

No reescribirlo.

Solo:

```text
quitar estilos
adaptar nuevos dispositivos
incorporar Space/Device
```

---

# 89. `devices-manager`

Este componente es particularmente importante.

Debe converger con el nuevo `MockDevice`.

Evitar terminar con:

```text
DeviceProfile
ScenarioDeviceBinding
MockDevice
```

como conceptos duplicados sin relación.

La relación correcta podría ser:

```text
DeviceProfile
= modelo/tipo físico simulado

DeviceDefinition
= instancia lógica en el edificio

ScenarioDeviceBinding
= cómo participa esa instancia en un escenario

DeviceRuntimeState
= estado actual
```

---

# 90. Ejemplo

```text
DeviceProfile
"Spot LED 20W"

        ↓ utilizado por

DeviceDefinition
"showroom.spots-window"

        ↓ scenario binding

Scenario
"normal-day"

        ↓ runtime

ON
brightness 80%
16 W
```

Eso preserva lo que ya tienes y lo amplía correctamente.

---

# 91. Ajustar `ScenarioDeviceBinding`

Ahora contiene:

```ts
zoneId
role
deviceProfileId
quantity
```

Añadir opcionalmente:

```ts
deviceId?: string;
```

o evolucionar a:

```ts
interface ScenarioDeviceBinding {
  id: string;
  deviceId: string;
  deviceProfileId: string;
  zoneId?: string;
  role: string;
  quantity: number;
}
```

---

# 92. No modificar todos los escenarios inmediatamente

Para compatibilidad:

```ts
deviceId?: string;
```

y fallback al modelo anterior.

Después migrar scenarios uno por uno.

---

# 93. Fases concretas de implementación

Lo organizaría en 12 fases.

---

# FASE 0 — Congelar el alcance

## Objetivo

Declarar oficialmente:

```text
runtime = MOCK
hardware = fuera de alcance
Home Assistant = referencia histórica
CSS/UI visual = fuera de alcance
```

## Acciones

Crear por ejemplo:

```text
docs/mock-runtime-principles.md
```

Con reglas:

```text
1. ningún código runtime puede llamar hass
2. ningún código runtime puede hacer fetch a dispositivos
3. ninguna vista mantiene estado de dominio
4. DemoEngine es autoridad runtime
5. los adapters representan límites de infraestructura
6. HomeAssistantAdapter no se instancia
```

## Done cuando

Estas reglas están documentadas.

---

# FASE 1 — Eliminar presentación

## Archivos

```text
src/styles/*
src/app/app-shell.ts
src/components/*
src/views/*
src/components/mock-lab/*
```

## Acciones

Eliminar:

```text
static styles
css imports
style=""
clases exclusivamente decorativas
layout responsive
tokens visuales
```

Mantener:

```text
HTML
event handlers
state
properties
formularios
tablas
botones
labels
aria
```

## No hacer

No refactorizar lógica a la vez excepto cuando sea necesario para compilar.

## Done cuando

```bash
bun run typecheck
bun test
bun run build
```

pasan sin CSS necesario para funcionar.

---

# FASE 2 — Router jerárquico

## Crear

```text
src/app/routes.ts
```

## Modificar

```text
src/app/router.ts
src/app/app-shell.ts
src/components/app-nav/app-nav.ts
```

## Tests

Crear:

```text
tests/unit/router.test.ts
```

Casos:

```text
#/overview
#/spaces
#/spaces/showroom
#/spaces/showroom/lighting
#/systems/climate
#/operations/activity
#/mock-lab
ruta inválida
section inválida
```

## Done cuando

Todas las rutas parsean correctamente.

---

# FASE 3 — Modelo Space

## Crear

```text
src/models/space.ts
src/mocks/building/spaces.ts
src/stores/space.store.ts
```

## Crear vistas

```text
src/views/spaces/spaces-view.ts
src/views/spaces/space-view.ts
src/views/spaces/sections/space-overview.ts
```

## Inicialmente

Showroom, Lobby, Oficinas.

## Done cuando

Puedes navegar entre los tres y consultar su definición.

---

# FASE 4 — Device Domain

## Crear

```text
src/models/device.ts
src/services/device.service.ts
src/stores/device.store.ts

src/mocks/devices/showroom.devices.ts
src/mocks/devices/lobby.devices.ts
src/mocks/devices/offices.devices.ts
```

## Modificar

```text
src/api/contracts/data-adapter.ts
src/api/adapters/mock.adapter.ts
src/engine/demo-engine.ts
```

## Tests

```text
tests/unit/services/device.service.test.ts
tests/integration/stores/device.store.test.ts
tests/integration/adapters/mock-device-adapter.test.ts
```

## Casos

```text
ON → OFF
OFF → ON
set brightness
brightness clamp 0..100
power recalculation
unknown device
unavailable device
subscriber notification
```

---

# FASE 5 — Showroom funcional

Este debería ser el primer espacio migrado completamente.

## Migrar desde

```text
showroom-panel.js
showroom-productos-panel.js
showroom-energy-panel.js
showroom-v2-panel.js
showroom-experimentos-panel.js

spot-20w-showroom.js
panel-3k6k-showroom.js
panel-backlit-showroom.js
downlight-showroom.js
colgante-showroom.js
slim-showroom.js
```

## Crear

```text
src/mocks/devices/showroom.devices.ts
src/mocks/scenes/showroom.scenes.ts
src/mocks/products/showroom.products.ts

src/views/spaces/sections/space-lighting.ts
src/views/spaces/sections/space-scenes.ts
src/views/spaces/sections/space-energy.ts
src/views/spaces/sections/space-products.ts
```

## Resultado

```text
#/spaces/showroom
#/spaces/showroom/lighting
#/spaces/showroom/scenes
#/spaces/showroom/energy
#/spaces/showroom/products
```

Todas funcionales.

---

# FASE 6 — Scene Domain

## Crear

```text
src/models/scene.ts
src/services/scene.service.ts
src/stores/scene.store.ts
src/mocks/scenes/
```

## Integrar

```text
Showroom
Lobby
```

## Tests

Una escena debe:

```text
aplicar estado exacto
notificar una vez
registrar Activity
recalcular consumo
ser determinista
```

---

# FASE 7 — Lobby + Oficinas

## Lobby

Migrar:

```text
lobby-panel.js
```

a modelos existentes.

## Oficinas

Migrar:

```text
oficinas-panel.js
```

y conectar con:

```text
climate.store
device.store
space.store
```

## Resultado

No deberían introducirse stores específicos:

```text
✗ showroomStore
✗ lobbyStore
✗ officesStore
```

Usar stores de dominio.

---

# FASE 8 — Sistemas globales

## Lighting

Actualizar `lighting-view.ts` para leer:

```text
DeviceStore
```

además de Zone cuando corresponda.

## Climate

Reutilizar infraestructura existente.

## Energy

Crear vista:

```text
src/views/systems/energy/energy-view.ts
```

## Automations

Crear dominio Mock inicial.

## Resultado importante

Cambiar dispositivo desde un espacio afecta automáticamente la vista global.

---

# FASE 9 — Operación

Migrar:

```text
notifications-panel.js
calendario-laboral-panel.js
grabacion-panel.js
impresiones-panel.js
```

Como dominios Mock.

Orden:

```text
Activity
Recording
Notifications
Calendar
Printing
```

Porque Activity/Recording ya tienen más infraestructura existente.

---

# FASE 10 — Persistencia runtime

## Crear migración

Por ejemplo:

```text
src/persistence/migrations/002-runtime-state.ts
```

## Tabla mínima

```text
mock_runtime_state

key
value_json
updated_at
```

No necesitas normalizarlo aún.

## Persistir

```text
devices
automation enable flags
calendar
notifications read state
```

## No persistir necesariamente

```text
estado efímero de navegación
formularios sin guardar
```

---

# FASE 11 — Mock Lab integrado

Actualizar:

```text
devices-manager
live-override
scenario-manager
```

para soportar `MockDevice`.

Desde Mock Lab debe poderse:

```text
cambiar ON/OFF
cambiar brightness
marcar unavailable
cambiar ocupación
cambiar daylight
cambiar temperatura
```

Y las demás vistas deben reaccionar inmediatamente.

---

# FASE 12 — Visualización 3D

Solo después de que todo lo anterior esté estable.

Primero:

```text
space-visualization.ts
```

como representación textual.

Luego migrar:

```text
showroom.glb
lobby.glb
```

si sigue teniendo sentido.

---

# 94. Orden exacto que usaría en Git

No haría un commit masivo.

Usaría aproximadamente:

```text
01 chore/remove-visual-styles

02 refactor/hierarchical-router

03 feat/space-domain

04 feat/mock-device-domain

05 feat/showroom-device-catalog

06 feat/mock-scenes

07 feat/showroom-space-sections

08 feat/lobby-space

09 feat/offices-space

10 refactor/global-lighting-from-devices

11 feat/mock-energy-by-space

12 feat/mock-automations

13 feat/mock-notifications

14 feat/mock-calendar

15 feat/mock-recording-view

16 feat/mock-print-jobs

17 feat/runtime-persistence

18 refactor/mock-lab-device-integration

19 test/cross-view-state-consistency

20 feat/mock-3d-state-adapter
```

Cada paso debería compilar por separado.

---

# 95. Estructura objetivo aproximada

```text
src/
├── api/
│   ├── adapters/
│   │   ├── mock.adapter.ts
│   │   └── home-assistant.adapter.ts
│   └── contracts/
│       └── data-adapter.ts
│
├── app/
│   ├── app-shell.ts
│   ├── router.ts
│   └── routes.ts
│
├── components/
│   ├── app-nav/
│   ├── device-control/
│   ├── climate-zone/
│   └── mock-lab/
│
├── engine/
│   ├── demo-engine.ts
│   ├── clock.ts
│   └── scenario.ts
│
├── models/
│   ├── activity.ts
│   ├── automation.ts
│   ├── building.ts
│   ├── calendar.ts
│   ├── climate.ts
│   ├── device.ts
│   ├── energy.ts
│   ├── notification.ts
│   ├── print-job.ts
│   ├── product.ts
│   ├── scene.ts
│   ├── scenario.ts
│   ├── space.ts
│   └── zone.ts
│
├── mocks/
│   ├── building/
│   │   └── spaces.ts
│   │
│   ├── devices/
│   │   ├── showroom.devices.ts
│   │   ├── lobby.devices.ts
│   │   └── offices.devices.ts
│   │
│   ├── scenes/
│   │   ├── showroom.scenes.ts
│   │   └── lobby.scenes.ts
│   │
│   ├── products/
│   │   └── showroom.products.ts
│   │
│   ├── automations/
│   ├── calendar/
│   └── scenarios/
│
├── persistence/
│   ├── database.ts
│   ├── migrations/
│   └── repositories/
│
├── services/
│   ├── activity.service.ts
│   ├── automation.service.ts
│   ├── climate.service.ts
│   ├── device.service.ts
│   ├── energy.service.ts
│   ├── lighting.service.ts
│   └── scene.service.ts
│
├── stores/
│   ├── activity.store.ts
│   ├── automation.store.ts
│   ├── building.store.ts
│   ├── climate.store.ts
│   ├── demo.store.ts
│   ├── device.store.ts
│   ├── energy.store.ts
│   ├── scene.store.ts
│   ├── space.store.ts
│   └── simulation-config.store.ts
│
└── views/
    ├── overview/
    │
    ├── spaces/
    │   ├── spaces-view.ts
    │   ├── space-view.ts
    │   └── sections/
    │       ├── space-overview.ts
    │       ├── space-lighting.ts
    │       ├── space-climate.ts
    │       ├── space-energy.ts
    │       ├── space-scenes.ts
    │       ├── space-products.ts
    │       └── space-visualization.ts
    │
    ├── systems/
    │   ├── lighting/
    │   ├── climate/
    │   ├── energy/
    │   └── automations/
    │
    ├── operations/
    │   ├── activity/
    │   ├── notifications/
    │   ├── calendar/
    │   ├── recording/
    │   └── printing/
    │
    └── simulator/
```

---

# 96. Flujo definitivo de un clic

Este flujo debe ser explícitamente probado.

Usuario hace:

```text
Showroom
→ Iluminación
→ Spots ventana
→ Encender
```

Componente:

```ts
private handleTurnOn() {
  deviceStore.turnOn(this.device.id);
}
```

Store:

```ts
turnOn(id: string) {
  demoStore.setDevicePower(id, "on");
}
```

DemoStore:

```ts
setDevicePower(id, state) {
  this.adapter.setDevicePower(id, state);
}
```

MockAdapter:

```ts
async setDevicePower(id, state) {
  this.engine.setDevicePower(id, state);
}
```

Engine:

```text
buscar dispositivo
↓
validar
↓
DeviceService.calculateNewState()
↓
actualizar state
↓
recalcular energía
↓
crear actividad
↓
persistir snapshot si corresponde
↓
notify()
```

Store subscriber:

```text
Space Lighting actualiza
Lighting global actualiza
Overview actualiza
Energy actualiza
Activity actualiza
```

Ese es el comportamiento que deberíamos considerar correcto.

---

# 97. Estado fuera de la vista

Otro principio que debe convertirse en test:

```text
View A
    \
     \
      > Engine State
     /
View B
```

Nunca:

```text
View A state

View B state
```

para la misma luz.

---

# 98. Tests de consistencia cross-view

Crear:

```text
tests/integration/cross-view-state.test.ts
```

Ejemplo lógico:

```ts
expect(deviceStore.getById(id)?.powerState)
  .toBe("off");

deviceStore.turnOn(id);

expect(deviceStore.getById(id)?.powerState)
  .toBe("on");

expect(
  lightingStore
    .getDevices()
    .find(d => d.id === id)
    ?.powerState
).toBe("on");
```

---

# 99. Tests de escena

```text
estado inicial:
A off
B off
C on

run "Presentación"

esperado:
A on
B off
C on

activity:
"Presentación aplicada"

energy:
recalculada
```

---

# 100. Tests de reset

Muy importante por ser Mock.

```ts
demoStore.reset();
```

debe regresar exactamente al escenario inicial.

Así puedes experimentar sin corromper estado.

---

# 101. Tests de determinismo

Ya tienes pruebas de determinismo del engine.

Las nuevas entidades deben respetarlo.

Mismo:

```text
scenario
seed
acciones
ticks
```

debe producir:

```text
mismo estado final
```

---

# 102. Test específico de que no hay Home Assistant

Yo añadiría uno de arquitectura.

Por ejemplo en:

```text
tests/unit/architecture.test.ts
```

comprobar que `src/views`, `src/components`, `src/stores`, `src/services` no contengan:

```text
hass.callService
window.hass
customPanel
postMessage hacia Home Assistant
entity_id como contrato operacional
```

Y permitir referencias HA únicamente dentro de:

```text
src/api/adapters/home-assistant.adapter.ts
```

Eso impide regresiones.

---

# 103. El antiguo `entity_id`

Crear una tabla de migración explícita.

Por ejemplo:

| Home Assistant legado                       | Nuevo Mock ID           |
| ------------------------------------------- | ----------------------- |
| `switch.interruptor_inteligente_switch_1`   | `showroom.spots-window` |
| `switch.interruptor_inteligente_switch_2`   | `showroom.spots-2x3`    |
| `switch.interruptor_inteligente_switch_3`   | `showroom.spots-3x3`    |
| `switch.interruptor_inteligente_switch_4`   | `showroom.spots-tv`     |
| `switch.interruptor_inteligente_2_switch_1` | `showroom.panels-3k6k`  |
| `switch.interruptor_inteligente_2_switch_2` | `showroom.pendants`     |
| `switch.interruptor_inteligente_2_switch_3` | `showroom.slims`        |
| `switch.interruptor_inteligente_2_switch_4` | `showroom.downlights`   |
| `switch.smart_relay_switch_4_switch`        | `showroom.panels`       |

Esto debería quedar en un archivo de migración/documentación, no disperso por componentes.

---

# 104. No borrar todavía `ejemplo-guia`

Durante la migración:

```text
ejemplo-guia/
```

debe mantenerse como referencia.

Pero marcarlo como:

```text
LEGACY / REFERENCE ONLY
```

No importarlo nunca desde `src`.

Incluso añadiría un test:

```text
ningún src/**/*.ts importa ../ejemplo-guia
```

---

# 105. Migración funcional por panel

El mapa completo quedaría:

| Panel antiguo                    | Destino nuevo                              |
| -------------------------------- | ------------------------------------------ |
| `control-general-panel.js`       | `overview` + comandos globales             |
| `showroom-panel.js`              | `Space showroom`                           |
| `showroom-v2-panel.js`           | absorbido por `Space showroom`             |
| `showroom-experimentos-panel.js` | `Mock Lab`                                 |
| `showroom-energy-panel.js`       | `space-energy`                             |
| `showroom-productos-panel.js`    | `space-products`                           |
| `spot-20w-showroom.js`           | `Product + DeviceDefinition`               |
| `panel-3k6k-showroom.js`         | `Product + DeviceDefinition`               |
| `panel-backlit-showroom.js`      | `Product + DeviceDefinition`               |
| `downlight-showroom.js`          | `Product + DeviceDefinition`               |
| `colgante-showroom.js`           | `Product + DeviceDefinition`               |
| `slim-showroom.js`               | `Product + DeviceDefinition`               |
| `lobby-panel.js`                 | `Space lobby`                              |
| `oficinas-panel.js`              | `Space offices`                            |
| `climatizacion-panel.js`         | sistema `climate` + filtro por Space       |
| `automatizaciones-panel.js`      | sistema `automations`                      |
| `calendario-laboral-panel.js`    | operación `calendar`                       |
| `notifications-panel.js`         | operación `notifications`                  |
| `grabacion-panel.js`             | operación `recording`                      |
| `impresiones-panel.js`           | operación `printing`                       |
| `showroom-3d-panel.js`           | `space-visualization`                      |
| `lobby-3d-panel.js`              | `space-visualization`                      |
| `witmind-3d-panel.js`            | infraestructura futura de visualización    |
| `witmind-panel-hub*`             | eliminado; reemplazado por Router/AppShell |
| `panel-runner.html`              | eliminado; ya no hay iframe                |
| `witmind-default-panel.js`       | sin equivalente necesario                  |

---

# 106. Qué significa “migrado”

Un panel no está migrado porque “se ve parecido”.

Está migrado cuando:

```text
1. sus conceptos están representados en modelos TypeScript;

2. sus datos de prueba están en mocks declarativos;

3. sus acciones pasan por stores/engine;

4. no contiene dependencia HA;

5. el estado se comparte con las demás vistas;

6. puede resetearse;

7. genera Activity donde corresponde;

8. tiene tests;

9. funciona sin CSS;

10. compila dentro de la app principal.
```

---

# 107. Definición de terminado global

Yo pondría estos criterios de aceptación.

### Arquitectura

```text
[ ] No hay iframe.
[ ] No hay panel-runner.
[ ] Ninguna vista usa hass.
[ ] Ninguna vista usa entity_id para controlar estado.
[ ] MockAdapter es el adapter activo.
[ ] DemoEngine contiene el runtime simulado.
```

### Navegación

```text
[ ] Inicio.
[ ] Espacios.
[ ] Showroom.
[ ] Lobby.
[ ] Oficinas.
[ ] Iluminación global.
[ ] Climatización global.
[ ] Energía global.
[ ] Automatizaciones.
[ ] Actividad.
[ ] Notificaciones.
[ ] Calendario.
[ ] Grabación.
[ ] Impresiones.
[ ] Mock Lab.
```

### Mock state

```text
[ ] Luz ON/OFF.
[ ] Brightness.
[ ] Climatización.
[ ] Escenas.
[ ] Automatizaciones activadas/desactivadas.
[ ] Estados de dispositivos.
[ ] Eventos de Activity.
[ ] Reset.
```

### Consistencia

```text
[ ] Cambiar Showroom cambia Lighting global.
[ ] Cambiar Lighting global cambia Showroom.
[ ] Energía reacciona a los estados.
[ ] Activity registra las acciones.
[ ] Mock Lab modifica el mismo estado.
```

### Persistencia

```text
[ ] Estado puede persistirse.
[ ] Reset devuelve escenario inicial.
[ ] DB puede limpiarse.
```

### Presentación

```text
[ ] No static styles.
[ ] No tokens CSS.
[ ] No responsive CSS.
[ ] No trabajo visual.
[ ] HTML semántico mínimo.
```

### Calidad

```text
[ ] TypeScript pasa.
[ ] Biome pasa.
[ ] Tests pasan.
[ ] Build pasa.
[ ] No imports desde ejemplo-guia.
```

---

# 108. Prioridad real

No intentaría migrar todos los paneles simultáneamente.

La secuencia de mayor valor sería:

```text
1. quitar estilos
2. router nuevo
3. Space
4. Device
5. Showroom
6. Scenes
7. estado global compartido
8. Lobby
9. Oficinas
10. sistemas globales
11. operación
12. persistencia
13. Mock Lab integrado
14. 3D
```

El **Showroom debe ser el vertical slice**.

Es decir: antes de tocar Calendario, Impresiones o 3D, asegurarnos de que esto funcione completamente:

```text
Inicio
   ↓
Showroom
   ↓
Spots ventana
   ↓
ON
   ↓
DemoEngine
   ↓
Energy
   ↓
Activity
   ↓
Lighting global
   ↓
persistencia
```

Cuando ese circuito está cerrado, Lobby y Oficinas son principalmente datos y composición.

---

# 109. La decisión arquitectónica más importante

La migración no debe ser:

```text
22 Custom Panels
      ↓
22 páginas Lit
```

Debe ser:

```text
22 Custom Panels
      ↓
extraer conceptos
      ↓
────────────────────────
Space
Zone
Device
Scene
Product
Automation
Calendar
Notification
PrintJob
Simulation
Activity
────────────────────────
      ↓
vistas genéricas
```

Eso evita volver a construir el mismo problema con tecnología diferente.

El antiguo Home Assistant queda como **fuente de requisitos funcionales**.

`automatizacion-v2` se convierte en la **implementación limpia de esos requisitos dentro de un runtime 100% Mock**.

Y para esta etapa, la regla sería simple: **si una línea solo existe para que algo se vea mejor, se elimina; si existe para expresar estructura, estado, comportamiento, datos o contratos, se conserva**.
