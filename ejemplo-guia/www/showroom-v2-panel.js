// Witmind Resilient Wrapper para <showroom-v2-panel>
// Auto-generado para permitir Hot-Reload sin reinicio de Home Assistant OS.
import { registerResilientPanel } from "/local/witmind-panel-hub.js?v=2.0.0";

registerResilientPanel({
  tag: "showroom-v2-panel",
  id: "showroom-v2",
  title: "Showroom V2",
  localScript: "/local/panels/showroom-v2.core.js",
  devUrl: "http://192.168.20.44:5173/panels/showroom-v2/",
  version: `${Date.now()}`
});
