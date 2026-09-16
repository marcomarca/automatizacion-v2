// Witmind shared circular theme transition v1.0.0
// Reusable by Home Assistant custom panels loaded as ES modules.

const DOCUMENT_CLASS = "witmind-theme-transition-active";
const LOCK_CLASS = "witmind-theme-transition-locked";
const SCOPE_CLASS = "witmind-theme-transition-scope";
const DOCUMENT_STYLE_ID = "witmind-theme-transition-shared-styles";
const DEFAULT_DURATION_MS = 1000;
const MIN_DURATION_MS = 300;
const MAX_DURATION_MS = 2000;
const MIN_USEFUL_REVEAL_MS = 120;

let activeRun = null;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeDuration(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_DURATION_MS;
  return Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, parsed));
}

function ensureDocumentStyles() {
  let style = document.getElementById(DOCUMENT_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = DOCUMENT_STYLE_ID;
    document.head.append(style);
  }

  style.textContent = `
    html.${DOCUMENT_CLASS}::view-transition-group(root),
    html.${DOCUMENT_CLASS}::view-transition-image-pair(root),
    html.${DOCUMENT_CLASS}::view-transition-old(root),
    html.${DOCUMENT_CLASS}::view-transition-new(root) {
      animation: none !important;
      mix-blend-mode: normal;
    }

    html.${DOCUMENT_CLASS}::view-transition-old(root) { z-index: 1; }
    html.${DOCUMENT_CLASS}::view-transition-new(root) { z-index: 2; }

    html.${LOCK_CLASS},
    html.${LOCK_CLASS} * {
      cursor: progress !important;
    }
  `;
}

function ensureScopeStyles(scope) {
  const rootNode = scope?.getRootNode?.();
  if (!rootNode?.querySelector || !rootNode?.append) return;

  const selector = 'style[data-witmind-theme-transition-scope="1"]';
  let style = rootNode.querySelector(selector);
  if (!style) {
    style = document.createElement("style");
    style.dataset.witmindThemeTransitionScope = "1";
    rootNode.append(style);
  }

  style.textContent = `
    .${SCOPE_CLASS}::view-transition-group(root),
    .${SCOPE_CLASS}::view-transition-image-pair(root),
    .${SCOPE_CLASS}::view-transition-old(root),
    .${SCOPE_CLASS}::view-transition-new(root) {
      animation: none !important;
      mix-blend-mode: normal;
    }

    .${SCOPE_CLASS}::view-transition-old(root) { z-index: 1; }
    .${SCOPE_CLASS}::view-transition-new(root) { z-index: 2; }
  `;
}

function lockInterface(host) {
  const root = document.documentElement;
  const blocker = document.createElement("div");
  const blockedEvents = [
    "pointerdown",
    "pointerup",
    "mousedown",
    "mouseup",
    "click",
    "dblclick",
    "contextmenu",
    "touchstart",
    "touchmove",
    "touchend",
    "wheel",
    "keydown",
  ];
  const stopInteraction = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  const previous = {
    inert: host.inert,
    hadInert: host.hasAttribute("inert"),
    ariaBusy: host.getAttribute("aria-busy"),
    hadAriaBusy: host.hasAttribute("aria-busy"),
  };

  blocker.setAttribute("aria-hidden", "true");
  blocker.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483647",
    "background:transparent",
    "pointer-events:auto",
    "touch-action:none",
    "cursor:progress",
    "user-select:none",
    "-webkit-user-select:none",
    "view-transition-name:none",
  ].join(";");

  root.classList.add(LOCK_CLASS);
  host.inert = true;
  host.setAttribute("aria-busy", "true");

  for (const type of blockedEvents) {
    document.addEventListener(type, stopInteraction, {
      capture: true,
      passive: false,
    });
  }
  document.body?.append(blocker);

  let released = false;
  return () => {
    if (released) return;
    released = true;

    blocker.remove();
    for (const type of blockedEvents) {
      document.removeEventListener(type, stopInteraction, { capture: true });
    }
    root.classList.remove(LOCK_CLASS);

    if (previous.hadInert) host.inert = previous.inert;
    else host.removeAttribute("inert");

    if (previous.hadAriaBusy) {
      host.setAttribute("aria-busy", previous.ariaBusy ?? "true");
    } else {
      host.removeAttribute("aria-busy");
    }
  };
}

function viewportSize() {
  return {
    width: Math.max(
      1,
      document.documentElement?.clientWidth || 0,
      window.innerWidth || 0,
    ),
    height: Math.max(
      1,
      document.documentElement?.clientHeight || 0,
      window.innerHeight || 0,
    ),
  };
}

function geometry(trigger, scope, scoped) {
  const triggerRect = trigger?.getBoundingClientRect?.();
  const viewport = viewportSize();
  const centerX = triggerRect && triggerRect.width > 0
    ? triggerRect.left + triggerRect.width / 2
    : viewport.width - 37;
  const centerY = triggerRect && triggerRect.height > 0
    ? triggerRect.top + triggerRect.height / 2
    : 32;

  if (scoped) {
    const scopeRect = scope.getBoundingClientRect();
    const x = Math.min(scopeRect.width, Math.max(0, centerX - scopeRect.left));
    const y = Math.min(scopeRect.height, Math.max(0, centerY - scopeRect.top));

    // Solo es necesario cubrir la porción visible del panel. Usar la altura
    // total de un dashboard desplazable produciría radios enormes e
    // inconsistentes entre paneles con distinta cantidad de contenido.
    const visibleLeft = Math.max(0, -scopeRect.left);
    const visibleTop = Math.max(0, -scopeRect.top);
    const visibleRight = Math.min(scopeRect.width, viewport.width - scopeRect.left);
    const visibleBottom = Math.min(scopeRect.height, viewport.height - scopeRect.top);
    const corners = [
      [visibleLeft, visibleTop],
      [visibleRight, visibleTop],
      [visibleLeft, visibleBottom],
      [visibleRight, visibleBottom],
    ];
    const radius = Math.max(
      ...corners.map(([cornerX, cornerY]) => Math.hypot(cornerX - x, cornerY - y)),
    );
    return { x, y, radius };
  }

  const x = Math.min(viewport.width, Math.max(0, centerX));
  const y = Math.min(viewport.height, Math.max(0, centerY));
  const radius = Math.hypot(
    Math.max(x, viewport.width - x),
    Math.max(y, viewport.height - y),
  );
  return { x, y, radius };
}

function animationKeyframes({ x, y, radius }) {
  return {
    clipPath: [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${radius}px at ${x}px ${y}px)`,
    ],
  };
}

function hasForeignDocumentTransition() {
  return Boolean(
    document.activeViewTransition &&
    document.activeViewTransition !== activeRun?.transition,
  );
}

export function cancelCircularThemeTransition(host) {
  if (!activeRun || (host && activeRun.host !== host)) return;
  activeRun.cancel();
}

export async function runCircularThemeTransition({
  host,
  scope = null,
  trigger = null,
  apply,
  durationMs = DEFAULT_DURATION_MS,
  easing = "cubic-bezier(0.22, 1, 0.36, 1)",
} = {}) {
  if (!host || typeof apply !== "function") {
    throw new TypeError("runCircularThemeTransition requiere host y apply().");
  }

  if (activeRun) return false;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const duration = normalizeDuration(durationMs);
  const scoped = Boolean(scope && typeof scope.startViewTransition === "function");
  const documentSupported = typeof document.startViewTransition === "function";

  // A document-scoped transition would cancel Home Assistant's active
  // navigation transition. In that case the theme change remains functional,
  // but the visual enhancement is intentionally skipped.
  if (
    reducedMotion ||
    document.visibilityState === "hidden" ||
    (!scoped && (!documentSupported || hasForeignDocumentTransition()))
  ) {
    apply();
    return false;
  }

  ensureDocumentStyles();
  if (scoped) ensureScopeStyles(scope);

  const target = scoped ? scope : document.documentElement;
  const startTransition = scoped
    ? (callback) => scope.startViewTransition(callback)
    : (callback) => document.startViewTransition(callback);
  const transitionGeometry = geometry(trigger, scope, scoped);
  const startedAt = performance.now();
  const unlock = lockInterface(host);
  let transition = null;
  let animation = null;
  let applied = false;
  let cancelled = false;

  const cleanup = () => {
    scope?.classList.remove(SCOPE_CLASS);
    document.documentElement.classList.remove(DOCUMENT_CLASS);
    unlock();
    if (activeRun?.host === host) activeRun = null;
  };

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    try {
      animation?.cancel?.();
    } catch (_error) {
      // The animation may already be detached from its pseudo-element.
    }
    try {
      transition?.skipTransition?.();
    } catch (_error) {
      // The transition may already be finished.
    }
    cleanup();
  };

  activeRun = { host, transition: null, cancel };

  try {
    if (scoped) scope.classList.add(SCOPE_CLASS);
    else document.documentElement.classList.add(DOCUMENT_CLASS);

    transition = startTransition(() => {
      if (cancelled) return;
      applied = true;
      apply();
    });
    activeRun.transition = transition;

    // The total user-visible budget starts at the click. Snapshot preparation
    // therefore consumes part of the configured duration instead of being
    // added on top of it.
    await Promise.race([
      Promise.resolve(transition.ready),
      wait(duration).then(() => {
        throw new Error("View Transition no quedó lista dentro del presupuesto.");
      }),
    ]);

    if (cancelled) return false;

    const elapsedBeforeAnimation = performance.now() - startedAt;
    const remaining = Math.max(0, duration - elapsedBeforeAnimation);

    // A very short reveal looks like a frozen partial frame followed by a snap.
    // Skip the visual enhancement instead; the theme update has already run.
    if (remaining < Math.min(MIN_USEFUL_REVEAL_MS, duration * 0.2)) {
      transition.skipTransition?.();
      await Promise.resolve(transition.finished).catch(() => undefined);
      return false;
    }

    animation = target.animate(
      animationKeyframes(transitionGeometry),
      {
        duration: remaining,
        easing,
        fill: "both",
        pseudoElement: "::view-transition-new(root)",
      },
    );

    await Promise.race([
      Promise.all([
        Promise.resolve(animation.finished),
        Promise.resolve(transition.finished),
      ]),
      wait(remaining + 300).then(() => {
        throw new Error("La animación excedió su presupuesto temporal.");
      }),
    ]);

    return true;
  } catch (error) {
    try {
      animation?.cancel?.();
    } catch (_error) {
      // Ignore cleanup races.
    }
    try {
      transition?.skipTransition?.();
    } catch (_error) {
      // Ignore cleanup races.
    }
    if (!applied) apply();
    console.warn("La transición de tema se omitió para evitar un bloqueo:", error);
    return false;
  } finally {
    cleanup();
  }
}
