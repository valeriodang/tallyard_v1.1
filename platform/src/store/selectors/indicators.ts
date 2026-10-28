// The indicators panel (round 3, BRIEF section 15.8), worked out for each workspace: on a project, reused against
// recycled content by mass and by value, reuse by building layer against the reuse toolkit's bands, and the Level(s)
// end-of-life score of the new building; for a client, the same across their projects; for an owner, each donor
// building's recovery plan scored with Level(s) against the RICS business-as-usual case. Shares only, no money.
import { CONVENTIONAL_REUSE_BY_MASS } from '../../domain/reference/fcrbe'
import { EOL_SCENARIOS } from '../../domain/reference/rics'
import { bomRows, contentSplit } from '../../domain/engines/ces'
import { endOfLifeScore, layerReuse, wholeReuse, type BandPosition } from '../../domain/engines/indicators'
import * as f from '../../domain/format'
import type { AppData, Viewer } from '../types'
import { buildingSide, projectSide, projectsOfUser, buildingsOfUser } from '../access'
import { cesOf } from '../actions/ces'
import { projectMetrics } from './consultant'
import { recoverySummaryOf } from './recovery'
import { pct } from './ces'

const POSITION_TEXT: Record<BandPosition, string> = { below: 'Below the band', within: 'Within the band', above: 'Above the band' }

const scoreText = (x: number | null) => (x === null ? 'No mass yet' : x.toFixed(2))

export type ProjectIndicatorsView = {
  hasBill: boolean
  content: { label: string; byMass: string; byValue: string }[]
  whole: { shareText: string; bandText: string; position: BandPosition | null; positionText: string }
  layers: { id: string; label: string; shareText: string; bandText: string; position: BandPosition; positionText: string }[]
  eol: { scoreText: string; scenarioLabel: string }
  note: string
}

const share = (part: number, whole: number) => (whole > 0 ? pct(part / whole) : '0%')

export function projectIndicators(state: AppData, viewer: Viewer, projectId: string): ProjectIndicatorsView | null {
  if (!projectSide(state, viewer.userId, projectId)) return null
  const p = state.world.projects[projectId]
  const lines = projectMetrics(state, viewer, projectId)!.secured.lines
  const split = contentSplit(lines)
  const whole = wholeReuse(lines)
  const scenario = cesOf(state, projectId).eolScenario ?? 'bau'
  return {
    hasBill: p.billOfMaterials.length > 0,
    content: [
      { label: 'Reused content', byMass: share(split.reusedMassT, split.totalMassT), byValue: share(split.reusedValue, split.totalValue) },
      { label: 'Recycled content', byMass: share(split.recycledMassT, split.totalMassT), byValue: share(split.recycledValue, split.totalValue) },
    ],
    whole: {
      shareText: whole.share === null ? 'No bill yet' : pct(whole.share),
      bandText: `Conventional buildings reach ${pct(CONVENTIONAL_REUSE_BY_MASS.low)} to ${pct(CONVENTIONAL_REUSE_BY_MASS.high)}`,
      position: whole.position,
      positionText: whole.position ? POSITION_TEXT[whole.position] : '',
    },
    layers: layerReuse(lines).map((l) => ({ id: l.id, label: l.label, shareText: pct(l.share), bandText: `${pct(l.low)} to ${pct(l.high)}`, position: l.position, positionText: POSITION_TEXT[l.position] })),
    eol: { scoreText: scoreText(endOfLifeScore(bomRows(p.billOfMaterials, p.giaM2, scenario))), scenarioLabel: EOL_SCENARIOS[scenario].label },
    note: 'Secured materials against the bill of materials. Layer bands come from 32 reuse projects in the Interreg reuse toolkit; the end-of-life score is Level(s) indicator 2.4, from 0 to 1.',
  }
}

export type ClientIndicatorsView = { rows: { projectId: string; name: string; href: string; reuseText: string; positionText: string; position: BandPosition | null; eolText: string }[] }

/** The client's projects side by side: reuse by mass against the conventional range, and the end-of-life score. */
export function clientIndicators(state: AppData, viewer: Viewer): ClientIndicatorsView | null {
  const projects = projectsOfUser(state, viewer.userId).filter((p) => projectSide(state, viewer.userId, p.id) === 'client')
  if (projects.length === 0) return null
  return {
    rows: projects.map((p) => {
      const v = projectIndicators(state, viewer, p.id)!
      return { projectId: p.id, name: p.name, href: `/app/projects/${p.id}/sustainability`, reuseText: v.whole.shareText, positionText: v.whole.positionText, position: v.whole.position, eolText: v.eol.scoreText }
    }),
  }
}

export type OwnerIndicatorsView = { rows: { buildingId: string; name: string; href: string; scoreText: string; bauScoreText: string; reusedText: string; gainText: string }[] }

/** Each donor building's recovery plan: its Level(s) score against business as usual, and the reuse it adds. */
export function ownerIndicators(state: AppData, viewer: Viewer): OwnerIndicatorsView | null {
  const buildings = buildingsOfUser(state, viewer.userId).filter((b) => buildingSide(state, viewer.userId, b.id) === 'owner')
  if (buildings.length === 0) return null
  return {
    rows: buildings.map((b) => {
      const s = recoverySummaryOf(state, b.id)
      return {
        buildingId: b.id,
        name: b.name,
        href: `/app/buildings/${b.id}/priorities`,
        scoreText: scoreText(s.levelsScore),
        bauScoreText: scoreText(s.bauLevelsScore),
        reusedText: f.massT(s.reusedT),
        gainText: `${s.gainT >= 0 ? '' : 'minus '}${f.massT(Math.abs(s.gainT))}`,
      }
    }),
  }
}
