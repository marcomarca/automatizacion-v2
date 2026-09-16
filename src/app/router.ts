export type AppRoute = "overview" | "lighting" | "climate" | "activity" | "simulator";

export class Router {
  private static instance: Router;
  private currentRoute: AppRoute = "overview";
  private listeners: Set<(route: AppRoute) => void> = new Set();

  private constructor() {
    window.addEventListener("hashchange", () => this.handleHashChange());
    window.addEventListener("load", () => this.handleHashChange());
    this.handleHashChange();
  }

  public static getInstance(): Router {
    if (!Router.instance) {
      Router.instance = new Router();
    }
    return Router.instance;
  }

  public getRoute(): AppRoute {
    return this.currentRoute;
  }

  public navigate(route: AppRoute): void {
    window.location.hash = `#/${route}`;
  }

  public subscribe(listener: (route: AppRoute) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private handleHashChange(): void {
    const rawHash = window.location.hash.replace(/^#\/?/, "") || "overview";
    const validRoutes: AppRoute[] = ["overview", "lighting", "climate", "activity", "simulator"];

    if (validRoutes.includes(rawHash as AppRoute)) {
      this.currentRoute = rawHash as AppRoute;
    } else {
      this.currentRoute = "overview";
    }

    for (const listener of this.listeners) {
      listener(this.currentRoute);
    }
  }
}

export const router = Router.getInstance();
