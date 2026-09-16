import { firstViewId, hasView } from "./view-registry.js";
const PREFIX = "#wm/";
export function resolveView(defaultView) {
    const hashValue = location.hash.startsWith(PREFIX)
        ? decodeURIComponent(location.hash.slice(PREFIX.length))
        : null;
    if (hasView(hashValue))
        return hashValue;
    if (hasView(defaultView))
        return defaultView;
    return firstViewId();
}
export function writeView(viewId) {
    const desiredHash = `${PREFIX}${encodeURIComponent(viewId)}`;
    if (location.hash !== desiredHash) {
        history.pushState(null, "", desiredHash);
    }
}
