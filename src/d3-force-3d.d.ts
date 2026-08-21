// Minimal surface of d3-force-3d (transitive dependency of force-graph, no
// bundled types); the graph canvas only pulls its collision force.
declare module 'd3-force-3d' {
  export function forceCollide(radius?: number | ((node: unknown) => number)): unknown;
}
