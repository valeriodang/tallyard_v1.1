// Form drafts for the contractor's destination log and carrier register: what a field shows, and the input an action
// takes back. A blank field is "not given"; anything that does not read as a number goes on as NaN, so the action
// refuses it with its own message.
import type { Destination } from '../../domain/types'
import type { Carrier, CarrierTier, DestinationEntry } from '../../domain/contractorTypes'
import type { CarrierInput, DestinationInput } from '../actions/contractorWork'
import { numberOrNull } from './audits-ui'

export type DestinationDraft = { id?: string; description: string; ewcCode: string; route: Destination; forecast: string; actual: string; carrierId: string; facility: string; permitRef: string; transferNoteRef: string; movedOn: string; note: string }

const text = (x: number | null) => (x === null ? '' : String(x))

export function destinationDraft(e: DestinationEntry | null): DestinationDraft {
  if (!e) return { description: '', ewcCode: '', route: 'recycled_off_site', forecast: '', actual: '', carrierId: '', facility: '', permitRef: '', transferNoteRef: '', movedOn: '', note: '' }
  return { id: e.id, description: e.description, ewcCode: e.ewcCode, route: e.route, forecast: text(e.forecastT), actual: text(e.actualT), carrierId: e.carrierId ?? '', facility: e.facility, permitRef: e.permitRef, transferNoteRef: e.transferNoteRef, movedOn: e.movedOn ?? '', note: e.note }
}

export function destinationInput(d: DestinationDraft): DestinationInput {
  return {
    ...(d.id ? { id: d.id } : {}),
    description: d.description,
    ewcCode: d.ewcCode,
    route: d.route,
    forecastT: numberOrNull(d.forecast),
    actualT: numberOrNull(d.actual),
    carrierId: d.carrierId || null,
    facility: d.facility,
    permitRef: d.permitRef,
    transferNoteRef: d.transferNoteRef,
    movedOn: d.movedOn || null,
    note: d.note,
  }
}

export type CarrierDraft = { id?: string; name: string; registration: string; tier: CarrierTier; expiresOn: string }

export function carrierDraft(c: Carrier | null): CarrierDraft {
  if (!c) return { name: '', registration: '', tier: 'upper', expiresOn: '' }
  return { id: c.id, name: c.name, registration: c.registration, tier: c.tier, expiresOn: c.expiresOn ?? '' }
}

export function carrierInput(d: CarrierDraft): CarrierInput {
  return { ...(d.id ? { id: d.id } : {}), name: d.name, registration: d.registration, tier: d.tier, expiresOn: d.expiresOn || null }
}
