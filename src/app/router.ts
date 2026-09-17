import { type AppRoute, parseRoute, routeToHash } from "./routes";

export type { AppRoute };

export class Router {
  private static instance: Router;
  private currentRoute: AppRoute = { kind: "overview" };
  private listeners: Set<(route: AppRoute) => void> = new Set();

  private constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", () => this.handleHashChange());
      window.addEventListener("load", () => this.handleHashChange());
      this.handleHashChange();
    }
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
    if (typeof window !== "undefined") {
      window.location.hash = routeToHash(route);
    } else {
      this.currentRoute = route;
      this.notify();
    }
  }

  public subscribe(listener: (route: AppRoute) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentRoute);
    }
  }

  private handleHashChange(): void {
    const rawHash = typeof window !== "undefined" ? window.location.hash : "";
    this.currentRoute = parseRoute(rawHash);
    this.notify();
  }
}

export const router = Router.getInstance();
