// Form drafts for the audit screens: what a field shows, and the input an action takes back. Shares are typed as
// percentages and stored as ratios; a blank field is "not given". Anything that does not read as a number is passed
// on as NaN, so the action refuses it with its own message.
import type { AuditRow, BrokerRoute, BrokerStatus, RetentionOption, RetentionOptionKind } from '../../domain/auditTypes'
import type { FamilyId } from '../../domain/types'
import type { AuditRowInput, RetentionOptionInput } from '../actions/audits'

export function numberOrNull(text: string): number | null {
  const t = text.trim().replace(/,/g, '')
  if (t === '') return null
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : Number.NaN
}

/** A percentage typed as 85 or 85% read back as a ratio, 0.85. */
export function shareFromText(text: string): number | null {
  const n = numberOrNull(text.replace('%', ''))
  return n === null ? null : n / 100
}

/** A ratio shown as a percentage for a field, up to two decimals and no trailing zeros. */
export function shareText(ratio: number | null): string {
  if (ratio === null) return ''
  return String(Math.round(ratio * 10000) / 100)
}

const numText = (x: number | null) => (x === null ? '' : String(x))

export type OptionDraft = { id?: string; label: string; kind: RetentionOptionKind; superstructure: string; facade: string; gia: string; upfront: string; wlc: string; demolishedArea: string; demolition: string; note: string }

export function optionDraft(o: RetentionOption | null): OptionDraft {
  if (!o) return { label: '', kind: 'retain_refurbish', superstructure: '', facade: '', gia: '', upfront: '', wlc: '', demolishedArea: '', demolition: '', note: '' }
  return { id: o.id, label: o.label, kind: o.kind, superstructure: shareText(o.superstructureRetainedShare), facade: shareText(o.facadeRetainedShare), gia: numText(o.giaM2), upfront: numText(o.upfrontKgM2), wlc: numText(o.wlcKgM2), demolishedArea: numText(o.demolishedAreaM2), demolition: numText(o.demolitionKgM2), note: o.note }
}

export function optionInput(d: OptionDraft): RetentionOptionInput {
  return {
    ...(d.id ? { id: d.id } : {}),
    label: d.label,
    kind: d.kind,
    superstructureRetainedShare: shareFromText(d.superstructure),
    facadeRetainedShare: shareFromText(d.facade),
    giaM2: numberOrNull(d.gia),
    upfrontKgM2: numberOrNull(d.upfront),
    wlcKgM2: numberOrNull(d.wlc),
    demolishedAreaM2: numberOrNull(d.demolishedArea),
    demolitionKgM2: numberOrNull(d.demolition),
    note: d.note,
  }
}

export type RowDraft = {
  id?: string
  inventory: AuditRow['inventory']
  description: string
  family: string
  nrm: string
  ewcCode: string
  quantity: string
  unit: string
  mass: string
  extractability: string
  quality: string
  marketValue: string
  reusable: string
  band: string
  considerations: string
  route: BrokerRoute
  status: BrokerStatus
  outlet: string
}

export function rowDraft(r: AuditRow | null): RowDraft {
  if (!r) return { inventory: 'reuse', description: '', family: '', nrm: '2.5', ewcCode: '', quantity: '', unit: '', mass: '', extractability: '', quality: '', marketValue: '', reusable: '', band: '', considerations: '', route: 'none', status: 'not_offered', outlet: '' }
  return {
    id: r.id,
    inventory: r.inventory,
    description: r.description,
    family: r.family ?? '',
    nrm: r.nrm,
    ewcCode: r.ewcCode,
    quantity: numText(r.quantity),
    unit: r.unit,
    mass: numText(r.massT),
    extractability: numText(r.extractability),
    quality: numText(r.quality),
    marketValue: numText(r.marketValue),
    reusable: shareText(r.reusableShare),
    band: numText(r.cityBand),
    considerations: r.considerations,
    route: r.broker.route,
    status: r.broker.status,
    outlet: r.broker.outlet,
  }
}

export function rowInput(d: RowDraft): AuditRowInput {
  return {
    ...(d.id ? { id: d.id } : {}),
    inventory: d.inventory,
    description: d.description,
    family: d.family === '' ? null : (d.family as FamilyId),
    nrm: d.nrm,
    ewcCode: d.ewcCode,
    quantity: numberOrNull(d.quantity),
    unit: d.unit,
    massT: numberOrNull(d.mass),
    extractability: numberOrNull(d.extractability),
    quality: numberOrNull(d.quality),
    marketValue: numberOrNull(d.marketValue),
    reusableShare: d.inventory === 'reuse' ? shareFromText(d.reusable) : null,
    cityBand: numberOrNull(d.band),
    considerations: d.considerations,
    broker: { route: d.route, status: d.status, outlet: d.outlet },
  }
}

/** The filled-in draft when the family changes: its element category, waste code and unit, unless already typed. */
export function rowDraftForFamily(d: RowDraft, family: string, defaults: Record<string, { nrm: string; ewc: string; unit: string }>, previous: string): RowDraft {
  const next = { ...d, family }
  const was = previous ? defaults[previous] : null
  const now = family ? defaults[family] : null
  if (!now) return next
  if (d.ewcCode === '' || d.ewcCode === was?.ewc) next.ewcCode = now.ewc
  if (d.unit === '' || d.unit === was?.unit) next.unit = now.unit
  if (d.nrm === '2.5' || d.nrm === was?.nrm) next.nrm = now.nrm
  return next
}
