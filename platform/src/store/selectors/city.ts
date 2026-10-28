// The City of London module (round 3, BRIEF section 15.7), worked out for the consultant on a project in the City:
// the carbon options with the retrofit test and the reviewer, the retention figures, the SPD's minimums, condition
// bands, and the statement updates at RIBA stages 4 and 6. Null for anyone else, and for projects outside the City.
import type { ConditionBand } from '../../domain/cesTypes'
import { CITY_ASPIRATIONAL_MINIMUM_FROM, CITY_CONDITION_BANDS, CITY_OFFICE_BENCHMARKS, CITY_OPTIONEERING, RETROFIT_MIN_SUPERSTRUCTURE_SHARE } from '../../domain/reference/cityOfLondon'
import { bandOf, cityMinimums, cityUpdates, reviewerReady, type UpdateStatus } from '../../domain/engines/city'
import { isCityOfLondon } from '../../domain/engines/audit'
import { formatDate } from '../../domain/dates'
import type { AppData, Viewer } from '../types'
import { projectSide } from '../access'
import { cesOf } from '../actions/ces'
import { carbonOptionsView, type CarbonOptionsView } from './audits'
import { projectMetrics } from './consultant'
import { todayOf } from './common'
import { pct } from './ces'

export type CityView = {
  options: CarbonOptionsView
  retention: { preferredLabel: string | null; superstructureText: string; facadeText: string; retrofit: boolean | null; verdictText: string; facadeOnly: boolean }
  reviewer: { name: string; organisation: string; years: string; ready: boolean; signedOff: boolean; signedOffText: string | null; ruleText: string }
  minimums: { id: string; label: string; countText: string; met: boolean }[]
  catalogue: { id: string; item: string; quantity: string; band: ConditionBand | null; bandText: string }[]
  schedule: { publicId: string; description: string; statusText: string; band: ConditionBand | null; bandText: string }[]
  passports: { id: string; material: string; reference: string }[]
  bandOptions: { value: string; label: string }[]
  updates: { stage: 4 | 6; label: string; status: UpdateStatus; statusText: string; doneOn: string }[]
  benchmarks: { id: string; label: string; limitText: string }[]
  benchmarkNote: string
}

const ROUTE_TEXT = { reuse: 'reuse', repurpose: 'repurpose', recycle: 'recycle' } as const

function bandText(band: ConditionBand | null): string {
  if (band === null) return 'No band yet'
  const b = bandOf(band)
  return `Band ${band}, ${b.label.toLowerCase()}: ${ROUTE_TEXT[b.route]}`
}

const STATUS_TEXT: Record<UpdateStatus, (from: string, to: string | null, done: string | null) => string> = {
  done: (_f, _t, done) => `Updated on ${formatDate(done!)}`,
  due: (_f, to) => (to ? `Due now, by ${formatDate(to)}` : 'Due now'),
  overdue: (_f, to) => `Overdue: the stage ended on ${formatDate(to!)}`,
  upcoming: (from) => `Due during the stage, from ${formatDate(from)}`,
}

export function cityView(state: AppData, viewer: Viewer, projectId: string): CityView | null {
  if (projectSide(state, viewer.userId, projectId) !== 'consultant') return null
  const p = state.world.projects[projectId]
  if (!isCityOfLondon(p)) return null
  const c = cesOf(state, projectId).city
  const options = carbonOptionsView(c.options, c.preferredId, c.justification)
  const preferred = c.options.find((o) => o.id === c.preferredId) ?? null
  const share = (x: number | null) => (x === null ? 'Not given' : pct(x))
  const retrofit = preferred?.superstructureRetainedShare === null || !preferred ? null : preferred.superstructureRetainedShare >= RETROFIT_MIN_SUPERSTRUCTURE_SHARE
  const facadeOnly = !!preferred && (preferred.facadeRetainedShare ?? 0) > 0 && retrofit === false
  const items = projectMetrics(state, viewer, projectId)!.items
  const minimums = cityMinimums(c.catalogue.length, items.length, c.passports.length)
  return {
    options,
    retention: {
      preferredLabel: preferred?.label ?? null,
      superstructureText: share(preferred?.superstructureRetainedShare ?? null),
      facadeText: share(preferred?.facadeRetainedShare ?? null),
      retrofit,
      verdictText: !preferred ? 'Choose a preferred option to see whether it counts as retrofit.' : retrofit === null ? 'Give the share of the superstructure kept, by mass.' : retrofit ? 'The preferred option counts as retrofit.' : 'The preferred option counts as new build.',
      facadeOnly,
    },
    reviewer: {
      name: c.reviewer.name,
      organisation: c.reviewer.organisation,
      years: c.reviewer.years === null ? '' : String(c.reviewer.years),
      ready: reviewerReady(c.reviewer),
      signedOff: c.reviewer.signedOffOn !== null,
      signedOffText: c.reviewer.signedOffOn ? `Signed off on ${formatDate(c.reviewer.signedOffOn)}` : null,
      ruleText: `The options are reviewed independently, by someone with at least ${CITY_OPTIONEERING.reviewerMinYears} years of whole life carbon work.`,
    },
    minimums: minimums.map((m) => ({ id: m.id, label: m.label, countText: `${m.count} of ${m.needed}`, met: m.met })),
    catalogue: c.catalogue.map((e) => ({ id: e.id, item: e.item, quantity: e.quantity, band: e.band, bandText: bandText(e.band) })),
    schedule: items.map((i) => {
      const band = c.scheduleBands[i.publicId] ?? null
      return { publicId: i.publicId, description: i.description, statusText: i.status, band, bandText: bandText(band) }
    }),
    passports: c.passports.map((e) => ({ id: e.id, material: e.material, reference: e.reference })),
    bandOptions: CITY_CONDITION_BANDS.map((b) => ({ value: String(b.band), label: bandText(b.band) })),
    updates: cityUpdates(p.programme, c.updates, todayOf(viewer)).map((u) => ({
      stage: u.stage,
      label: `RIBA stage ${u.stage}`,
      status: u.status,
      statusText: STATUS_TEXT[u.status](u.from, u.to, u.doneOn),
      doneOn: u.doneOn ?? '',
    })),
    benchmarks: CITY_OFFICE_BENCHMARKS.map((b) => ({ id: b.id, label: `${b.label}, ${b.modules}`, limitText: `Below ${b.value.toLocaleString('en-GB')} kgCO2e per m2 GIA` })),
    benchmarkNote: `From ${CITY_ASPIRATIONAL_MINIMUM_FROM} the aspirational whole life carbon benchmark becomes the City's minimum. Office values only; the SPD gives no residential values.`,
  }
}
