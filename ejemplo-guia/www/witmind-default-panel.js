/**
 * Witmind Default Panel v1.4.0
 *
 * Política autorreparable para paneles custom que no aparecen en el selector
 * de Perfil > General.
 *
 * Para los usuarios objetivo:
 *   - /control-general es la fuente de verdad de default_panel.
 *   - Si el usuario selecciona Auto u otro dashboard, el cambio se detecta
 *     mediante frontend/subscribe_user_data y se corrige automáticamente.
 *   - No se usa localStorage como bloqueo.
 *   - No se recarga el documento y no se abre un navegador externo.
 */

const WITMIND_DEFAULT_PANEL = Object.freeze({
  panelUrlPath: "control-general",

  // Coincidencia sin distinguir mayúsculas y minúsculas.
  userNames: ["TABLET"],

  // true: aplica también a cualquier cuenta administradora.
  includeAdministrators: true,

  // true: cualquier selección distinta se corrige, incluso si fue realizada
  // desde Perfil > General después de la instalación inicial.
  enforceDefault: true,

  // Solo se navega automáticamente cuando la sesión entró por la URL raíz.
  // Una corrección realizada mientras el usuario está en Perfil no lo expulsa
  // de esa pantalla.
  navigateOnRootEntry: true,

  waitTimeoutMs: 120000,
  pollIntervalMs: 400,
  repairDebounceMs: 300,
  repairCooldownAfterErrorMs: 5000,
});

const INITIAL_PATHNAME = window.location.pathname;

const runtime = {
  hass: null,
  latestCoreData: null,
  repairTimer: null,
  repairPromise: null,
  unsubscribe: null,
  lastRepairErrorAt: 0,
};

const sleep = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const normalized = (value) =>
  String(value ?? "").trim().toLocaleLowerCase();

async function waitForHomeAssistant() {
  const deadline = Date.now() + WITMIND_DEFAULT_PANEL.waitTimeoutMs;

  while (Date.now() < deadline) {
    const app = document.querySelector("home-assistant");
    const hass = app?.hass;

    if (
      hass?.connection?.sendMessagePromise &&
      hass?.connection?.subscribeMessage &&
      hass?.user?.id &&
      hass?.user?.name &&
      hass?.panels &&
      hass.userData !== undefined
    ) {
      return { app, hass };
    }

    await sleep(WITMIND_DEFAULT_PANEL.pollIntervalMs);
  }

  throw new Error(
    "Home Assistant no expuso hass, usuario, paneles y userData dentro del tiempo esperado.",
  );
}

function isExplicitTargetUser(hass) {
  const currentName = normalized(hass.user?.name);

  return WITMIND_DEFAULT_PANEL.userNames.some(
    (configuredName) => normalized(configuredName) === currentName,
  );
}

function isTargetUser(hass) {
  const matchesConfiguredName = isExplicitTargetUser(hass);
  const matchesAdministrator =
    WITMIND_DEFAULT_PANEL.includeAdministrators === true &&
    hass.user?.is_admin === true;

  return matchesConfiguredName || matchesAdministrator;
}

function validateTargetPanel(hass) {
  const panelPath = WITMIND_DEFAULT_PANEL.panelUrlPath;

  if (!hass.panels?.[panelPath]) {
    throw new Error(
      `No existe hass.panels["${panelPath}"]. ` +
      `Verifica que panel_custom use url_path: ${panelPath}.`,
    );
  }
}

async function fetchCoreUserData(hass) {
  const result = await hass.connection.sendMessagePromise({
    type: "frontend/get_user_data",
    key: "core",
  });

  return result?.value || hass.userData || {};
}

async function saveCoreUserData(hass, coreData) {
  await hass.connection.sendMessagePromise({
    type: "frontend/set_user_data",
    key: "core",
    value: coreData,
  });
}

/**
 * Navegación interna equivalente a la usada por el frontend de Home Assistant.
 * No recarga el documento y conserva el WebView autenticado de Android/iOS.
 */
function navigateInsideHomeAssistant(path) {
  if (!path || window.location.pathname === path) {
    return;
  }

  const nextHistoryState = window.history.state?.root
    ? { root: true }
    : null;

  window.history.replaceState(nextHistoryState, "", path);

  const event = new CustomEvent("location-changed", {
    detail: { replace: true },
    bubbles: true,
    composed: true,
  });

  window.dispatchEvent(event);
}

async function repairDefaultPanel({ reason, coreData, navigate = false }) {
  const hass = runtime.hass;

  if (!hass || !isTargetUser(hass)) {
    return false;
  }

  if (!WITMIND_DEFAULT_PANEL.enforceDefault) {
    return false;
  }

  const panelPath = WITMIND_DEFAULT_PANEL.panelUrlPath;
  const data = coreData || runtime.latestCoreData || await fetchCoreUserData(hass);

  runtime.latestCoreData = data;

  // La navegación de entrada es independiente de la reparación persistente.
  // Si default_panel ya era correcto, una carga directa de / debe abrir igualmente
  // el panel objetivo en lugar de retornar antes de navegar.
  if (data.default_panel === panelPath) {
    if (navigate) {
      navigateInsideHomeAssistant(`/${panelPath}`);
    }
    return false;
  }

  if (runtime.repairPromise) {
    return runtime.repairPromise;
  }

  if (
    runtime.lastRepairErrorAt &&
    Date.now() - runtime.lastRepairErrorAt <
      WITMIND_DEFAULT_PANEL.repairCooldownAfterErrorMs
  ) {
    return false;
  }

  runtime.repairPromise = (async () => {
    const correctedCoreData = {
      ...data,
      default_panel: panelPath,
    };

    try {
      await saveCoreUserData(hass, correctedCoreData);
      runtime.latestCoreData = correctedCoreData;
      runtime.lastRepairErrorAt = 0;

      console.info(
        `[Witmind Default Panel] Reparado para ${hass.user.name}: ` +
        `${String(data.default_panel ?? "Auto")} -> ${panelPath} (${reason}).`,
      );

      if (navigate) {
        navigateInsideHomeAssistant(`/${panelPath}`);
      }

      return true;
    } catch (error) {
      runtime.lastRepairErrorAt = Date.now();
      throw error;
    } finally {
      runtime.repairPromise = null;
    }
  })();

  return runtime.repairPromise;
}

function scheduleRepair(coreData, reason) {
  runtime.latestCoreData = coreData || {};

  if (
    runtime.latestCoreData.default_panel ===
    WITMIND_DEFAULT_PANEL.panelUrlPath
  ) {
    return;
  }

  window.clearTimeout(runtime.repairTimer);
  runtime.repairTimer = window.setTimeout(() => {
    runtime.repairTimer = null;

    repairDefaultPanel({
      reason,
      coreData: runtime.latestCoreData,
      navigate: false,
    }).catch((error) => {
      console.error(
        "[Witmind Default Panel] No se pudo reparar el cambio del usuario:",
        error,
      );
    });
  }, WITMIND_DEFAULT_PANEL.repairDebounceMs);
}

async function subscribeToCoreUserData(hass) {
  runtime.unsubscribe = await hass.connection.subscribeMessage(
    (message) => {
      const coreData = message?.value || {};
      runtime.latestCoreData = coreData;

      if (
        WITMIND_DEFAULT_PANEL.enforceDefault &&
        coreData.default_panel !== WITMIND_DEFAULT_PANEL.panelUrlPath
      ) {
        scheduleRepair(coreData, "cambio detectado en Perfil > General");
      }
    },
    {
      type: "frontend/subscribe_user_data",
      key: "core",
    },
  );
}

function installCleanup() {
  window.addEventListener(
    "beforeunload",
    () => {
      window.clearTimeout(runtime.repairTimer);
      runtime.unsubscribe?.();
      runtime.unsubscribe = null;
    },
    { once: true },
  );
}

async function startDefaultPanelPolicy() {
  const { hass } = await waitForHomeAssistant();
  runtime.hass = hass;

  console.info(
    `[Witmind Default Panel v1.4.0] Política activa: /${WITMIND_DEFAULT_PANEL.panelUrlPath}.`,
  );

  if (!isTargetUser(hass)) {
    console.info(
      `[Witmind Default Panel] Usuario omitido: ${hass.user.name} ` +
      `(administrador=${Boolean(hass.user?.is_admin)}).`,
    );
    return;
  }

  validateTargetPanel(hass);
  installCleanup();

  // La suscripción se instala antes de la primera lectura para no perder un
  // cambio que ocurra durante la inicialización.
  await subscribeToCoreUserData(hass);

  const coreData = await fetchCoreUserData(hass);
  runtime.latestCoreData = coreData;

  const enteredThroughRoot = INITIAL_PATHNAME === "/";

  await repairDefaultPanel({
    reason: "inicio de sesión o carga del frontend",
    coreData,
    navigate:
      WITMIND_DEFAULT_PANEL.navigateOnRootEntry && enteredThroughRoot,
  });
}

startDefaultPanelPolicy().catch((error) => {
  console.error(
    "[Witmind Default Panel] No se pudo aplicar la política de Control general:",
    error,
  );
});
