# Witmind · Calendario de días festivos para Home Assistant

Este directorio contiene el componente personalizado de Home Assistant que mantiene el calendario de días festivos/no laborables de Witmind y expone el estado central:

`binary_sensor.dia_no_laborable`

El objetivo del sistema es sencillo:

- Si el día actual es laboral, `binary_sensor.dia_no_laborable` debe estar en `off`.
- Si el día actual es domingo o existe un día festivo activo para la fecha actual, debe estar en `on`.
- Las automatizaciones laborales deben consultar ese sensor antes de ejecutar acciones.
- El panel custom de días festivos permite administrar fechas y mostrar qué automatizaciones están asociadas a esta lógica.
- Los días festivos persistentes se administran mediante el componente y Home Assistant `Store`. No deben editarse manualmente en `.storage`.

---

## 1. Arquitectura

### Backend

Ruta:

`/config/custom_components/calendario_laboral/`

Archivos principales:

- `__init__.py`
  - carga y normaliza los días festivos;
  - persiste los registros con `homeassistant.helpers.storage.Store`;
  - calcula el estado del día;
  - actualiza `binary_sensor.dia_no_laborable`;
  - expone CRUD mediante WebSocket.

- `manifest.json`
  - manifiesto de la integración personalizada.

- `README.md`
  - este documento.

### Frontend

Ruta:

`/config/www/calendario-laboral-panel.js`

Responsabilidades:

- mostrar el estado laboral/no laboral;
- listar los días festivos;
- crear, editar, activar/desactivar y eliminar registros mediante WebSocket;
- mostrar las automatizaciones configuradas en `protected_automations`.

### Configuración

Ruta:

`/config/configuration.yaml`

El panel está registrado mediante `panel_custom` y recibe, entre otros, estos parámetros:

```yaml
config:
  title: Calendario de días festivos
  entity_id: binary_sensor.dia_no_laborable
  protected_automations:
    - label: Ejemplo
      entity: automation.ejemplo
```

IMPORTANTE:

`protected_automations` es una lista de configuración/visualización del panel.

Añadir una automatización a `protected_automations` NO hace que quede protegida automáticamente.

La protección real debe existir dentro de la lógica de la automatización.

---

## 2. Regla principal para automatizaciones laborales

Toda automatización que NO deba ejecutarse en domingos o días festivos debe comprobar:

```yaml
condition:
  - condition: state
    entity_id: binary_sensor.dia_no_laborable
    state: "off"
```

Interpretación:

- `off` = día laboral, la automatización puede continuar.
- `on` = domingo o día festivo activo, la automatización no debe ejecutar sus acciones.

La condición debe aplicarse en la automatización real, no únicamente en el panel custom.

---

## 3. Qué archivos debe recibir una AI para añadir una nueva automatización protegida

### Caso normal: nueva automatización laboral

Subir:

1. `/config/automations.yaml`
2. `/config/configuration.yaml`
3. el archivo JavaScript del panel custom que controle o represente esa automatización, si existe.

Ejemplo:

```text
automations.yaml
configuration.yaml
nuevo-panel.js
```

La AI debe:

1. localizar la automatización real;
2. añadir o verificar la condición:

```yaml
- condition: state
  entity_id: binary_sensor.dia_no_laborable
  state: "off"
```

3. añadir la automatización a `protected_automations` si debe aparecer en el panel de días festivos;
4. revisar el panel custom asociado para comprobar que no exista una ruta que ejecute directamente servicios o dispositivos saltándose la automatización protegida;
5. actualizar únicamente las versiones/cache-busters de los JS realmente modificados.

---

## 4. Si la automatización usa scripts

Si la automatización llama a uno o varios scripts y esos scripts contienen la lógica relevante, subir también:

`/config/scripts.yaml`

Conjunto habitual:

```text
automations.yaml
scripts.yaml
configuration.yaml
panel-custom.js
```

La AI debe revisar si el script puede ejecutarse desde otro sitio sin pasar por la automatización protegida.

Si el script también debe estar bloqueado en días festivos, hay que diseñar la protección en el punto correcto y no asumir que proteger una sola automatización cubre todas las rutas de ejecución.

---

## 5. Si la automatización se administra desde un panel custom

Muchos paneles Witmind ejecutan servicios de Home Assistant directamente.

Por eso, cuando una automatización se cree o modifique desde un panel custom, debe subirse también el JS de ese panel.

Ejemplo:

```text
configuration.yaml
automations.yaml
automatizaciones-panel.js
```

La AI debe comprobar:

- qué `automation.*` utiliza el panel;
- qué `script.*` utiliza;
- si llama directamente a `switch.*`, `light.*`, `climate.*`, etc.;
- si existe alguna acción manual que deba seguir funcionando incluso en un día festivo;
- si una acción automática podría saltarse `binary_sensor.dia_no_laborable`.

No asumir que porque el panel muestra una automatización, toda la lógica pasa por ella.

---

## 6. Cuándo subir los archivos de este custom component

Subir:

```text
custom_components/calendario_laboral/__init__.py
custom_components/calendario_laboral/manifest.json
www/calendario-laboral-panel.js
configuration.yaml
```

solo cuando se quiera modificar el propio sistema de días festivos, por ejemplo:

- cambiar el criterio para definir un día no laborable;
- cambiar la lógica de domingos;
- cambiar persistencia;
- modificar CRUD;
- añadir campos a los registros;
- cambiar el payload WebSocket;
- modificar el `binary_sensor`;
- cambiar el contrato entre backend y frontend;
- añadir nuevas funciones al panel de días festivos.

Para añadir una automatización laboral normal NO debería ser necesario modificar `__init__.py`.

---

## 7. `.storage` — NO editar manualmente

El componente utiliza Home Assistant `Store` y persiste sus datos en:

`/config/.storage/calendario_laboral`

Reglas:

- NO editar este archivo manualmente.
- NO pedir a una AI que lo reescriba como método normal de actualización.
- NO distribuir una copia de `.storage` dentro de paquetes de instalación.
- NO modificar registros allí para activar/desactivar días festivos.
- Usar siempre el CRUD del componente/panel.

El backend normaliza los registros cargados y Home Assistant se ocupa de escribir el almacenamiento.

Si existe un problema de datos, primero debe revisarse el componente y el contenido de `.storage` solo como diagnóstico, no como lugar de edición.

---

## 8. WebSocket de Home Assistant: regla crítica sobre `id`

Home Assistant reserva el campo:

`id`

para identificar cada petición WebSocket.

Por tanto, NO usar `id` como nombre del campo personalizado para identificar un registro del calendario dentro de un comando WebSocket.

Usar:

`record_id`

Ejemplo correcto:

```json
{
  "type": "calendario_laboral/update",
  "record_id": "uuid-del-registro",
  "active": false
}
```

Ejemplo incorrecto:

```json
{
  "type": "calendario_laboral/update",
  "id": "uuid-del-registro",
  "active": false
}
```

El frontend y el backend deben mantener el mismo contrato.

Para identificadores del registro:

- backend: `record_id`
- frontend: `record_id`

El `id` de Home Assistant debe quedar reservado al protocolo WebSocket.

---

## 9. Persistencia de IDs

Los IDs de los días festivos deben manejarse como cadenas.

El backend debe normalizarlos con una estrategia equivalente a:

```python
record_id = str(raw.get("id") or uuid4())
```

No depender de que el dato almacenado llegue ya con el tipo correcto.

Al enviar un identificador desde JavaScript conviene normalizar defensivamente:

```javascript
record_id: String(record.id)
```

---

## 10. Actualización del estado central

Después de cualquier cambio de calendario que afecte a los registros:

- agregar;
- editar;
- activar;
- desactivar;
- eliminar;

el componente debe:

1. guardar;
2. recalcular el día actual;
3. actualizar `binary_sensor.dia_no_laborable`;
4. devolver el calendario actualizado al frontend.

Esto es especialmente importante si se activa o desactiva un registro correspondiente al día actual.

No debería ser necesario esperar hasta medianoche ni reiniciar Home Assistant para reflejar ese cambio.

---

## 11. Automatizaciones ya ejecutándose

La condición:

```yaml
condition:
  - condition: state
    entity_id: binary_sensor.dia_no_laborable
    state: "off"
```

impide que una nueva ejecución continúe cuando el día está bloqueado.

Pero no debe asumirse que detendrá automáticamente una ejecución de larga duración que ya estaba en curso.

Para automatizaciones largas o críticas se debe definir explícitamente qué hacer si el estado cambia a `on` durante la ejecución.

Ejemplos:

- climatización prolongada;
- ciclos industriales;
- temporizadores extensos;
- iluminación que permanece activa varias horas;
- procesos secuenciales largos.

En esos casos, pedir explícitamente a la AI:

> Además de impedir nuevas ejecuciones, revisa si esta automatización necesita detener de forma segura una ejecución ya iniciada cuando `binary_sensor.dia_no_laborable` pase a `on`.

---

## 12. Qué NO debe hacerse

No:

- editar `.storage` manualmente;
- modificar archivos internos del Core oficial de Home Assistant;
- parchear componentes de Home Assistant fuera de `custom_components`;
- asumir que `protected_automations` implementa la protección;
- usar `id` como campo de registro en comandos WebSocket personalizados;
- deshabilitar permanentemente una automatización (`automation.turn_off`) solo porque hoy sea festivo, salvo que ese comportamiento sea expresamente requerido;
- duplicar la lógica del calendario dentro de cada panel;
- incrustar manualmente la lista de días festivos dentro de `automations.yaml`.

La fuente de verdad para saber si hoy es laborable debe seguir siendo:

`binary_sensor.dia_no_laborable`

---

## 13. Flujo recomendado para futuras AI

### Solicitud típica

> Añade `automation.nueva_automatizacion` al sistema de días festivos. No debe ejecutar acciones en días no laborables y debe mostrarse en el panel de Días festivos. Revisa también el panel custom asociado. No edites `.storage`. Devuélveme un ZIP completo con los archivos actualizados.

### Archivos a proporcionar

Como mínimo:

```text
configuration.yaml
automations.yaml
panel-custom-relacionado.js
```

Si usa scripts:

```text
configuration.yaml
automations.yaml
scripts.yaml
panel-custom-relacionado.js
```

Si además se quiere modificar el motor del calendario:

```text
configuration.yaml
automations.yaml
scripts.yaml                    # si aplica
www/calendario-laboral-panel.js
custom_components/calendario_laboral/__init__.py
custom_components/calendario_laboral/manifest.json
panel-custom-relacionado.js     # si aplica
```

---

## 14. Forma recomendada de entrega

Cuando una AI modifique este sistema, debe entregar un ZIP preservando rutas de Home Assistant.

Ejemplo:

```text
config/
├── configuration.yaml
├── automations.yaml
├── scripts.yaml
├── www/
│   ├── calendario-laboral-panel.js
│   └── panel-custom-relacionado.js
└── custom_components/
    └── calendario_laboral/
        ├── __init__.py
        ├── manifest.json
        └── README.md
```

El ZIP NO debe contener:

```text
.storage/
home-assistant_v2.db
home-assistant_v2.db-shm
home-assistant_v2.db-wal
secrets.yaml
```

salvo que el usuario lo solicite explícitamente por una razón concreta de diagnóstico.

---

## 15. Sustitución de archivos

La AI debe indicar exactamente qué archivos cambiaron.

Regla general:

### Si cambia solo una automatización

Normalmente reemplazar:

- `automations.yaml`
- `configuration.yaml` si cambió `protected_automations`
- el JS del panel relacionado si fue modificado

### Si cambia `calendario-laboral-panel.js`

Además:

- incrementar el cache-buster de `module_url` en `configuration.yaml`

Ejemplo:

```yaml
module_url: /local/calendario-laboral-panel.js?v=1.5.0
```

### Si cambia Python en `custom_components/calendario_laboral/`

Reemplazar:

- `__init__.py`
- `manifest.json` si la versión/información del componente también cambia

Después se requiere reiniciar Home Assistant Core para cargar el nuevo Python.

### Si cambia solo JavaScript

Normalmente no hace falta reiniciar Home Assistant Core.

Actualizar el `module_url`, recargar el frontend y, si es necesario, hacer una recarga forzada del navegador.

---

## 16. Validaciones mínimas antes de entregar cambios

Una AI debería verificar al menos:

### Python

- sintaxis válida;
- nombres de comandos WebSocket consistentes;
- no reutilizar el `id` reservado de Home Assistant;
- `record_id` normalizado a cadena;
- guardar antes de recalcular;
- recalcular el sensor después del CRUD.

### JavaScript

- sintaxis válida;
- mismo contrato WebSocket que el backend;
- `record_id` enviado como cadena;
- no romper CRUD;
- no introducir rutas que modifiquen `.storage`.

### YAML

- preservar `!include`;
- no reescribir bloques no relacionados;
- modificar solo los paneles/automatizaciones solicitados;
- incrementar versiones únicamente de recursos que realmente cambiaron.

### Funcionalidad

Probar conceptualmente estos casos:

1. Día laboral sin festivo:
   - sensor `off`.

2. Festivo activo para hoy:
   - sensor `on`.

3. Desactivar festivo de hoy:
   - sensor debe volver a `off` inmediatamente si no es domingo.

4. Reactivar festivo de hoy:
   - sensor debe volver a `on`.

5. Domingo:
   - sensor debe permanecer `on` aunque no exista registro manual.

6. Automatización laboral con sensor `on`:
   - no debe ejecutar acciones.

7. Automatización laboral con sensor `off`:
   - puede ejecutar normalmente.

---

## 17. Principio de diseño

El calendario no debe administrar el ciclo de vida de todas las automatizaciones de Home Assistant.

Su responsabilidad es exponer una señal central confiable:

`binary_sensor.dia_no_laborable`

Las automatizaciones y scripts consumidores son responsables de respetar esa señal.

Esto mantiene el sistema desacoplado, auditable y más seguro ante futuras ampliaciones.
