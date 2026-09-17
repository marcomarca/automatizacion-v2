# Mock Runtime Principles

Este documento establece las reglas invariantes de diseño y ejecución para la arquitectura de Witmind en automatizacion-v2:

1. **Aislamiento de Infraestructura Real**:
   - Ningún código runtime puede invocar `hass`, llamar servicios de Home Assistant, interactuar con MQTT, realizar llamadas a hardware o hacer `fetch` a endpoints de dispositivos reales.
   - `MockAdapter` es el único adaptador activo en runtime.
   - `HomeAssistantAdapter` permanece exclusivamente como artefacto de desacoplamiento para integraciones futuras y nunca se instancia en la aplicación actual.

2. **Autoridad Central del Estado**:
   - `DemoEngine` es la única fuente de verdad y autoridad runtime de todo el edificio simulado.
   - Ninguna vista ni componente Lit mantiene estado de dominio local. Toda mutación se envía al engine vía stores y adaptadores.

3. **Consistencia Reactiva Global**:
   - Cambiar el estado de un dispositivo en cualquier pantalla (ej. Showroom) notifica inmediatamente a todos los suscriptores: vistas de Sistemas, Inicio (Overview), Energía, Actividad y Persistencia.

4. **Desacoplamiento de Identificadores**:
   - Los contratos operacionales utilizan IDs semánticos de dominio (`showroom.spots-window`, `lobby.main-lights`, etc.). Los `entity_id` legados de Home Assistant quedan relegados estrictamente a metadatos opcionales.

5. **Simulación Determinista y Transaccional**:
   - La aplicación de escenas, reglas de iluminación, climatización y mutaciones manuales producen resultados deterministas y generan registros estructurados de `Activity`.

6. **Interfaz Estructural sin Dependencia Visual**:
   - Durante la fase estructural, los componentes Lit exponen HTML semántico nativo sin CSS decorativo, priorizando solidez arquitectónica, accesibilidad y facilidad de prueba.
