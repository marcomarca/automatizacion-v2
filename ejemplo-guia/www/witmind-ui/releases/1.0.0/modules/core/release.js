export function getReleaseInfo() {
    return (globalThis.__WITMIND_RELEASE__ ?? {
        version: "development",
        root: new URL("../../", import.meta.url).href,
    });
}
