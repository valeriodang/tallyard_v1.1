// The arithmetic of the contractor's workspace (round 3, BRIEF section 15.4): forecast against actual by destination,
// the duty of care papers each moved stream still needs, the destination forecast drawn from the pre-deconstruction
// audit, and the true cost of waste. Pure: the store and the screens call these and never compute (P2).
import type { Destination } from '../types'
import type { AuditRow } from '../auditTypes'
import type { Carrier, DestinationEntry, DismantlingMethod } from '../contractorTypes'
import { roundPence, sumPence } from '../money'
import { GATE_FEE_PER_T, HANDLING_PER_T, HAULAGE_PER_T, LANDFILL_TAX, LOWER_RATE_CODES, VAT_RATE } from '../reference/wasteCost'
import { DESTINATIONS } from '../reference/wasteCodes'

/** The destinations, best first, as a demolition bill lists them. */
export const DESTINATION_ORDER: Destination[] = DESTINATIONS.map((d) => d.id)

export const METHOD_LABELS: Record<DismantlingMethod, string> = {
  hand_strip: 'Strip by hand',
  unbolt: 'Unbolt at the connections',
  cut_connections: 'Cut at the connections',
  crane_lift: 'Lift out whole by crane',
  saw_out: 'Saw out in panels',
  break_out: 'Break out',
}

/** The methods that take an item out whole. Breaking out does not. */
export const KEEPS_WHOLE: Record<DismantlingMethod, boolean> = { hand_strip: true, unbolt: true, cut_connections: true, crane_lift: true, saw_out: true, break_out: false }

export function isReuse(d: Destination): boolean {
  return d === 'reused_on_site' || d === 'reused_off_site'
}

/** Reused, recycled or recovered: everything but landfill and hazardous disposal, as the London Plan target reads. */
export function isRecovered(d: Destination): boolean {
  return d !== 'landfill' && d !== 'hazardous_disposal'
}

export type DestinationTotals = {
  forecast: Record<Destination, number>
  actual: Record<Destination, number>
  /** Non-hazardous tonnes, the base of the London Plan shares. */
  forecastT: number
  actualT: number
  hazardousForecastT: number
  hazardousActualT: number
  forecastReuse: number | null
  actualReuse: number | null
  forecastRecovery: number | null
  actualRecovery: number | null
  /** Streams with a weighed actual, and streams still to move. */
  moved: number
  open: number
}

function zeroes(): Record<Destination, number> {
  return Object.fromEntries(DESTINATION_ORDER.map((d) => [d, 0])) as Record<Destination, number>
}

export function destinationTotals(entries: DestinationEntry[]): DestinationTotals {
  const forecast = zeroes()
  const actual = zeroes()
  let moved = 0
  for (const e of entries) {
    forecast[e.route] += e.forecastT ?? 0
    actual[e.route] += e.actualT ?? 0
    if (e.actualT !== null) moved++
  }
  const nonHaz = (r: Record<Destination, number>) => DESTINATION_ORDER.filter((d) => d !== 'hazardous_disposal').reduce((s, d) => s + r[d], 0)
  const share = (r: Record<Destination, number>, pick: (d: Destination) => boolean) => {
    const total = nonHaz(r)
    return total > 0 ? DESTINATION_ORDER.filter((d) => d !== 'hazardous_disposal' && pick(d)).reduce((s, d) => s + r[d], 0) / total : null
  }
  return {
    forecast,
    actual,
    forecastT: nonHaz(forecast),
    actualT: nonHaz(actual),
    hazardousForecastT: forecast.hazardous_disposal,
    hazardousActualT: actual.hazardous_disposal,
    forecastReuse: share(forecast, isReuse),
    actualReuse: share(actual, isReuse),
    forecastRecovery: share(forecast, isRecovered),
    actualRecovery: share(actual, isRecovered),
    moved,
    open: entries.length - moved,
  }
}

export type DutyGap = 'carrier' | 'carrier_registration' | 'carrier_expired' | 'carrier_tier' | 'facility' | 'permit' | 'transfer_note'

export const DUTY_GAP_LABELS: Record<DutyGap, string> = {
  carrier: 'No carrier named',
  carrier_registration: 'The carrier has no registration number',
  carrier_expired: "The carrier's registration had expired when it moved",
  carrier_tier: 'Construction and demolition waste needs an upper tier carrier',
  facility: 'No receiving site named',
  permit: "No permit or exemption for the receiving site",
  transfer_note: 'No transfer note reference',
}

/** Streams that are waste in law and so need the duty of care papers. Reused material is not discarded. */
export function needsDutyOfCare(d: Destination): boolean {
  return d === 'recycled_off_site' || d === 'recovered' || d === 'landfill' || d === 'hazardous_disposal'
}

/** What a moved stream still needs before its papers are complete. Empty for a stream not yet moved. */
export function dutyOfCareGaps(e: DestinationEntry, carriers: Carrier[]): DutyGap[] {
  if (e.actualT === null || !needsDutyOfCare(e.route)) return []
  const gaps: DutyGap[] = []
  const c = e.carrierId ? carriers.find((x) => x.id === e.carrierId) : undefined
  if (!c) gaps.push('carrier')
  else {
    if (!c.registration.trim()) gaps.push('carrier_registration')
    if (c.expiresOn && e.movedOn && c.expiresOn < e.movedOn) gaps.push('carrier_expired')
    if (c.tier !== 'upper') gaps.push('carrier_tier')
  }
  if (!e.facility.trim()) gaps.push('facility')
  if (!e.permitRef.trim()) gaps.push('permit')
  if (!e.transferNoteRef.trim()) gaps.push('transfer_note')
  return gaps
}

const HAZARDOUS_CODE = /\*$|^17 06 05/

/**
 * The destination forecast from the pre-deconstruction audit. A reuse line splits into its reusable share, reused on
 * site or elsewhere as its route says, and the rest recycled; recycling lines are recycled off site; waste lines go to
 * landfill, or to hazardous disposal when the code or the element says so. Lines with no mass are left out.
 */
export function forecastFromAudit(rows: AuditRow[], idFor: (row: AuditRow, part: 'main' | 'rest') => string): DestinationEntry[] {
  const out: DestinationEntry[] = []
  const entry = (r: AuditRow, part: 'main' | 'rest', route: Destination, t: number, description: string): DestinationEntry => ({ id: idFor(r, part), description, ewcCode: r.ewcCode, route, forecastT: t, actualT: null, carrierId: null, facility: r.broker.outlet, permitRef: '', transferNoteRef: '', movedOn: null, auditRowId: r.id, note: '' })
  for (const r of rows) {
    if (r.massT === null || !(r.massT > 0)) continue
    if (r.inventory === 'reuse') {
      const share = r.reusableShare ?? 0
      const reused = r.massT * share
      if (reused > 0) out.push(entry(r, 'main', r.broker.route === 'reuse_on_site' ? 'reused_on_site' : 'reused_off_site', reused, r.description))
      if (r.massT - reused > 0) out.push(entry(r, 'rest', 'recycled_off_site', r.massT - reused, `${r.description}, not reusable`))
    } else if (r.inventory === 'recycle') {
      out.push(entry(r, 'main', 'recycled_off_site', r.massT, r.description))
    } else {
      out.push(entry(r, 'main', HAZARDOUS_CODE.test(r.ewcCode.trim()) || r.nrm === '0.1' ? 'hazardous_disposal' : 'landfill', r.massT, r.description))
    }
  }
  return out
}

export type CostLine = { route: Destination; tonnes: number; handling: number; haulage: number; gateFee: number; landfillTax: number; total: number }

export type TrueCost = {
  lines: CostLine[]
  totalExVat: number
  vat: number
  totalIncVat: number
  tonnes: number
  /** Excluding VAT. Null with no tonnes. */
  perTonne: number | null
  /** What the reused tonnes would have cost at landfill: the receiving fee and the standard landfill tax. */
  landfillAvoidedByReuse: number
}

/** Landfill tax on a stream: the lower rate for inert codes, the standard rate otherwise. Only landfill pays it. */
export function landfillTaxPerT(route: Destination, ewcCode: string): number {
  if (route !== 'landfill' && route !== 'hazardous_disposal') return 0
  return LOWER_RATE_CODES.includes(ewcCode.trim()) ? LANDFILL_TAX.lower : LANDFILL_TAX.standard
}

/**
 * The true cost of the streams: per tonne, handling, haulage, the receiving site's fee and landfill tax, each rounded
 * to pence as it is worked out; VAT on the total. Demolition arisings carry no purchase cost, so none is added.
 */
export function trueCostOfWaste(streams: { route: Destination; ewcCode: string; tonnes: number }[]): TrueCost {
  const byRoute = new Map<Destination, CostLine>()
  for (const s of streams) {
    if (!(s.tonnes > 0)) continue
    const handling = roundPence(s.tonnes * HANDLING_PER_T)
    const haulage = roundPence(s.tonnes * HAULAGE_PER_T[s.route])
    const gateFee = roundPence(s.tonnes * GATE_FEE_PER_T[s.route])
    const landfillTax = roundPence(s.tonnes * landfillTaxPerT(s.route, s.ewcCode))
    const line = byRoute.get(s.route) ?? { route: s.route, tonnes: 0, handling: 0, haulage: 0, gateFee: 0, landfillTax: 0, total: 0 }
    line.tonnes += s.tonnes
    line.handling = sumPence([line.handling, handling])
    line.haulage = sumPence([line.haulage, haulage])
    line.gateFee = sumPence([line.gateFee, gateFee])
    line.landfillTax = sumPence([line.landfillTax, landfillTax])
    line.total = sumPence([line.handling, line.haulage, line.gateFee, line.landfillTax])
    byRoute.set(s.route, line)
  }
  const lines = DESTINATION_ORDER.filter((d) => byRoute.has(d)).map((d) => byRoute.get(d)!)
  const totalExVat = sumPence(lines.map((l) => l.total))
  const vat = roundPence(totalExVat * VAT_RATE)
  const tonnes = lines.reduce((s, l) => s + l.tonnes, 0)
  const reusedT = lines.filter((l) => isReuse(l.route)).reduce((s, l) => s + l.tonnes, 0)
  return {
    lines,
    totalExVat,
    vat,
    totalIncVat: sumPence([totalExVat, vat]),
    tonnes,
    perTonne: tonnes > 0 ? roundPence(totalExVat / tonnes) : null,
    landfillAvoidedByReuse: roundPence(reusedT * (GATE_FEE_PER_T.landfill + LANDFILL_TAX.standard)),
  }
}

/** The streams to cost: each entry's actual tonnes once weighed, else its forecast. */
export function costStreams(entries: DestinationEntry[], basis: 'forecast' | 'actual'): { route: Destination; ewcCode: string; tonnes: number }[] {
  return entries.map((e) => ({ route: e.route, ewcCode: e.ewcCode, tonnes: (basis === 'actual' ? e.actualT : e.forecastT) ?? 0 }))
}
