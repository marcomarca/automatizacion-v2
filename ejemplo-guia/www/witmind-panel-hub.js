/**
 * Witmind Resilient Panel Hub - Trampoline Bootstrap Loader
 * Dynamic cache-buster loader for Home Assistant custom panels.
 * Ensures zero-restart hot iterations and always fetches the newest core.
 */
console.info("[Witmind Hub Loader] Iniciando carga de Witmind Panel Hub Core...");

import(`/local/witmind-panel-hub-core.js?t=${Date.now()}`)
  .then(() => {
    console.info("[Witmind Hub Loader] witmind-panel-hub-core.js cargado dinámicamente sin caché.");
  })
  .catch((err) => {
    console.error("[Witmind Hub Loader] Error al cargar dinámicamente witmind-panel-hub-core.js:", err);
  });
