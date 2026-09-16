export function queryRequired(root, selector) {
    const element = root.querySelector(selector);
    if (!element)
        throw new Error(`No se encontró el elemento: ${selector}`);
    return element;
}
