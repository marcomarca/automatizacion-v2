/**
 * Appearance & Theme Store — Gestiona versiones de apariencia de dashboard y densidad
 * sin acoplamiento a la lógica de negocio ni a los servicios de dominio.
 */

export type AppearanceMode = "bms-dark" | "ha-lovelace" | "cyber-matrix" | "clean-light";
export type LayoutDensity = "comfortable" | "compact";

export interface AppearanceState {
  mode: AppearanceMode;
  density: LayoutDensity;
}

const STORAGE_KEY_MODE = "witmind_ui_appearance_mode";
const STORAGE_KEY_DENSITY = "witmind_ui_layout_density";

class AppearanceStoreManager {
  private currentMode: AppearanceMode = "bms-dark";
  private currentDensity: LayoutDensity = "comfortable";
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage(): void {
    if (typeof window !== "undefined") {
      try {
        const savedMode = window.localStorage?.getItem(STORAGE_KEY_MODE) as AppearanceMode | null;
        if (
          savedMode &&
          ["bms-dark", "ha-lovelace", "cyber-matrix", "clean-light"].includes(savedMode)
        ) {
          this.currentMode = savedMode;
        }

        const savedDensity = window.localStorage?.getItem(
          STORAGE_KEY_DENSITY,
        ) as LayoutDensity | null;
        if (savedDensity && ["comfortable", "compact"].includes(savedDensity)) {
          this.currentDensity = savedDensity;
        }
      } catch (_e) {
        // Fallback to default
      }
      this.applyToDom();
    }
  }

  private applyToDom(): void {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("data-theme", this.currentMode);
      document.documentElement.setAttribute("data-density", this.currentDensity);
    }
  }

  public getMode(): AppearanceMode {
    return this.currentMode;
  }

  public setMode(mode: AppearanceMode): void {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    try {
      window.localStorage?.setItem(STORAGE_KEY_MODE, mode);
    } catch (_e) {}
    this.applyToDom();
    this.notify();
  }

  public getDensity(): LayoutDensity {
    return this.currentDensity;
  }

  public setDensity(density: LayoutDensity): void {
    if (this.currentDensity === density) return;
    this.currentDensity = density;
    try {
      window.localStorage?.setItem(STORAGE_KEY_DENSITY, density);
    } catch (_e) {}
    this.applyToDom();
    this.notify();
  }

  public toggleDensity(): void {
    this.setDensity(this.currentDensity === "comfortable" ? "compact" : "comfortable");
  }

  public cycleMode(): AppearanceMode {
    const modes: AppearanceMode[] = ["bms-dark", "ha-lovelace", "cyber-matrix", "clean-light"];
    const nextIdx = (modes.indexOf(this.currentMode) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    this.setMode(nextMode);
    return nextMode;
  }

  public getState(): AppearanceState {
    return {
      mode: this.currentMode,
      density: this.currentDensity,
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const AppearanceStore = new AppearanceStoreManager();
