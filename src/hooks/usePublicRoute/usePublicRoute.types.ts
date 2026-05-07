export interface UsePublicRouteResult {
  /**
   * Whether the current route uses public browse chrome (logged-out explorers).
   * True for dynamic public routes (e.g. /post/..., /profile/<pubky>) plus /hot and /search.
   */
  isPublicRoute: boolean;
}
