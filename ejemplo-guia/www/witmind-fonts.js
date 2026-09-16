// ============================================================================
//  Carga las tipografias de marca Witmind desde el propio Home Assistant.
//  Funciona SIN internet: los .woff2 se sirven desde /local/fonts/
// ----------------------------------------------------------------------------
//  DONDE VA:  /config/www/witmind-fonts.js
//  (la carpeta "www" se ve como "/local/" desde el navegador)
//
//  Y en configuration.yaml, dentro del bloque frontend que ya tienes:
//
//    frontend:
//      themes: !include_dir_merge_named themes
//      extra_module_url:
//        - /local/witmind-fonts.js
//
//  Despues: reiniciar Home Assistant (esto NO se recarga con "recargar YAML")
//  y refrescar el navegador con Ctrl+F5 / recarga forzada en la tablet.
// ============================================================================

const witmindFonts = `
@font-face {
  font-family: 'Outfit';
  src: url('/local/fonts/outfit.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/local/fonts/jakarta.woff2') format('woff2');
  font-weight: 200 800;
  font-style: normal;
  font-display: swap;
}
`;

const style = document.createElement("style");
style.setAttribute("id", "witmind-fonts");
style.textContent = witmindFonts;
document.head.appendChild(style);