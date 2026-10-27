// The deconstruction contractor's records on a building (round 3, BRIEF section 15.4): how each item comes out, where
// every stream goes (forecast against actual, with the duty of care papers), and the firm's register of waste
// carriers. Building-private: the contractor writes them, the owner reads them, a buyer never sees them.
import type { Destination } from './types'

export type DismantlingMethod = 'hand_strip' | 'unbolt' | 'cut_connections' | 'crane_lift' | 'saw_out' | 'break_out'

/** How one item comes out. Extractability runs 0 (cannot come out whole) to 4 (comes out easily), as in the audit. */
export type ItemMethod = { method: DismantlingMethod | null; extractability: number | null; protection: string; note: string; updatedAt: string; byUserId: string }

export type DestinationEntry = {
  id: string
  description: string
  ewcCode: string
  /** Where it goes, in the same words as a demolition bill (reused, recycled, recovered, landfill, hazardous). */
  route: Destination
  /** Tonnes expected to go this way, from the audit or the contractor's plan. */
  forecastT: number | null
  /** Tonnes that went, from the weighbridge tickets. Null until they have. */
  actualT: number | null
  /** The carrier from the firm's register, or null when the contractor carries it under its own registration. */
  carrierId: string | null
  /** The receiving site, as the transfer note names it. */
  facility: string
  /** The receiving site's permit or exemption reference. */
  permitRef: string
  /** The waste transfer note, or the consignment note for hazardous waste. */
  transferNoteRef: string
  movedOn: string | null
  /** The audit line this stream was forecast from, if any. */
  auditRowId: string | null
  note: string
}

export type CarrierTier = 'upper' | 'lower'

/** A waste carrier the firm uses, with its registration. */
export type Carrier = { id: string; name: string; registration: string; tier: CarrierTier; expiresOn: string | null }

export type BuildingWork = {
  buildingId: string
  /** The contractor these records belong to. A new contractor starts afresh. */
  contractorOrgId: string
  methods: Record<string, ItemMethod>
  destinations: DestinationEntry[]
  updatedAt: string
}

export type ContractorWork = {
  /** By building ID. */
  buildings: Record<string, BuildingWork>
  /** Each contractor organisation's carriers, by organisation ID. */
  carriers: Record<string, Carrier[]>
}
