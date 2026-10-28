// Every reference row added in round 3, in the order Methodology and the Assumptions sheets list them.
import type { Parameter } from './assumptions'
import { ricsRows } from './rics'
import { iceRows } from './ice'
import { levelsRows } from './levels'
import { recoveryRows } from './recovery'
import { stockMatchRows } from './stockMatch'
import { dealRows } from './deals'
import { procurementRows } from './procurement'
import { glaRows } from './gla'
import { cityRows } from './cityOfLondon'
import { schemeRows } from './schemes'
import { fcrbeRows } from './fcrbe'
import { auditRows } from './audit'
import { wasteCostRows } from './wasteCost'
import { steelRows } from './steelAssessment'
import { gradingRows } from './grading'

/** `city` adds the City of London rules; exports for projects elsewhere leave them out, so the City is never named. */
export function r3ParameterRows({ city = true }: { city?: boolean } = {}): Parameter[] {
  return [...ricsRows(), ...iceRows(), ...levelsRows(), ...glaRows(), ...(city ? cityRows() : []), ...schemeRows(), ...fcrbeRows(), ...auditRows(), ...wasteCostRows(), ...steelRows(), ...gradingRows(), ...recoveryRows(), ...stockMatchRows(), ...dealRows(), ...procurementRows()]
}
