// The Level(s) 2.4 circularity score of a set of arisings: the mass-weighted coefficient of the route each takes
// (round 3, BRIEF section 15.6). 1 means everything is reused directly; 0 means everything is hazardous disposal.
import { LEVELS_COEFFICIENTS, type CircularityRoute } from '../reference/levels'

export type RoutedMass = { massT: number; route: CircularityRoute }

export function circularityScore(rows: RoutedMass[]): number | null {
  const total = rows.reduce((s, r) => s + r.massT, 0)
  if (total <= 0) return null
  return rows.reduce((s, r) => s + r.massT * LEVELS_COEFFICIENTS[r.route].coefficient, 0) / total
}
