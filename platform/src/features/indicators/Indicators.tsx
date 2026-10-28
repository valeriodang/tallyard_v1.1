// The indicators panel (round 3, BRIEF section 15.8): on a project's Sustainability tab, reused against recycled
// content by mass and by value, reuse by building layer against the reuse toolkit's bands, and the Level(s)
// end-of-life score; on the client's home, each project side by side; on the owner's home, each donor building's
// recovery plan scored against business as usual. Every figure is indicative.
import { Link } from 'react-router'
import { Gauge } from 'lucide-react'
import { selectors, useView } from '../../store'
import type { BandPosition } from '../../domain/engines/indicators'
import { Card, CardBody, EmptyState, IndicativeMarker, Pill } from '../../ui'
import { SectionTitle } from '../../app/Page'
import { TabSection } from '../sustainability/parts'

const POSITION_TONE: Record<BandPosition, 'warning' | 'brand' | 'info'> = { below: 'warning', within: 'brand', above: 'info' }

function Position({ position, text }: { position: BandPosition | null; text: string }) {
  if (!position) return null
  return (
    <Pill size="sm" tone={POSITION_TONE[position]}>
      {text}
    </Pill>
  )
}

export function ProjectIndicators({ projectId }: { projectId: string }) {
  const v = useView(selectors.projectIndicators, projectId)
  if (!v) return null
  return (
    <TabSection id="indicators" title="Circularity indicators" indicative description={v.note} testId="indicators">
      {!v.hasBill ? (
        <EmptyState icon={Gauge} title="No bill of materials yet" text="The indicators read the project's bill of materials once it has one." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="md" className="flex flex-col gap-4">
            <table className="w-full border-collapse text-sm" data-testid="indicators-content">
              <caption className="sr-only">Reused and recycled content</caption>
              <thead>
                <tr className="text-xs text-muted">
                  <th scope="col" className="p-0 pb-1 text-left font-normal">
                    Content
                  </th>
                  <th scope="col" className="p-0 pb-1 text-right font-normal">
                    By mass
                  </th>
                  <th scope="col" className="p-0 pb-1 pl-4 text-right font-normal">
                    By value
                  </th>
                </tr>
              </thead>
              <tbody>
                {v.content.map((c) => (
                  <tr key={c.label}>
                    <th scope="row" className="p-0 py-1 text-left font-normal text-ink">
                      {c.label}
                    </th>
                    <td className="p-0 py-1 text-right font-semibold tabular-nums text-ink">{c.byMass}</td>
                    <td className="p-0 py-1 pl-4 text-right font-semibold tabular-nums text-ink">{c.byValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col gap-1 border-t border-line-soft pt-3" data-testid="indicators-eol">
              <p className="m-0 text-xs text-muted">Level(s) end-of-life score, {v.eol.scenarioLabel.toLowerCase()}</p>
              <p className="m-0 text-xl font-semibold tabular-nums text-ink">{v.eol.scoreText}</p>
            </div>
          </Card>
          <Card padding="md" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2" data-testid="indicators-whole">
              <span className="min-w-0 text-sm">
                <span className="block font-medium text-ink">Whole building, reuse by mass: {v.whole.shareText}</span>
                <span className="block text-xs text-muted">{v.whole.bandText}</span>
              </span>
              <Position position={v.whole.position} text={v.whole.positionText} />
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 border-t border-line-soft p-0 pt-3">
              {v.layers.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-sm" data-testid={`indicators-layer-${l.id}`}>
                  <span className="min-w-0">
                    <span className="text-ink">{l.label}</span> <span className="tabular-nums text-ink-soft">{l.shareText}</span>
                    <span className="block text-xs text-muted">Toolkit band {l.bandText}</span>
                  </span>
                  <Position position={l.position} text={l.positionText} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </TabSection>
  )
}

export function ClientIndicators() {
  const v = useView(selectors.clientIndicators)
  if (!v) return null
  return (
    <section aria-labelledby="client-indicators-title" className="min-w-0" data-testid="client-indicators">
      <SectionTitle id="client-indicators-title" title="Circularity indicators" description="Reuse by mass against the range conventional buildings reach, and the Level(s) end-of-life score of each design." />
      <Card>
        <CardBody>
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {v.rows.map((r) => (
              <li key={r.projectId} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6">
                <Link to={r.href} className="inline-flex min-h-11 items-center rounded-sm font-medium text-ink hover:underline sm:min-h-0">
                  {r.name}
                </Link>
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted">Reuse by mass</span>
                  <span className="font-semibold tabular-nums text-ink">{r.reuseText}</span>
                  <Position position={r.position} text={r.positionText} />
                </span>
                <span className="text-sm">
                  <span className="text-muted">End-of-life score </span>
                  <span className="font-semibold tabular-nums text-ink">{r.eolText}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 flex items-center gap-2 text-xs text-muted">
            From secured materials and each project's bill of materials.
            <IndicativeMarker />
          </p>
        </CardBody>
      </Card>
    </section>
  )
}

export function OwnerIndicators() {
  const v = useView(selectors.ownerIndicators)
  if (!v) return null
  return (
    <section aria-labelledby="owner-indicators-title" className="mt-10 min-w-0" data-testid="owner-indicators">
      <SectionTitle id="owner-indicators-title" title="Recovery indicators" description="Each recovery plan scored with Level(s) indicator 2.4, against the same items going the RICS business-as-usual way." />
      <Card>
        <CardBody>
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {v.rows.map((r) => (
              <li key={r.buildingId} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6" data-testid={`owner-indicators-${r.buildingId}`}>
                <Link to={r.href} className="inline-flex min-h-11 items-center rounded-sm font-medium text-ink hover:underline sm:min-h-0">
                  {r.name}
                </Link>
                <span className="text-sm">
                  <span className="text-muted">Score </span>
                  <span className="font-semibold tabular-nums text-ink">{r.scoreText}</span>
                  <span className="text-muted">, business as usual {r.bauScoreText}</span>
                </span>
                <span className="text-sm">
                  <span className="text-muted">Reused </span>
                  <span className="font-semibold tabular-nums text-ink">{r.reusedText}</span>
                  <span className="text-muted">, {r.gainText} more</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 flex items-center gap-2 text-xs text-muted">
            1 means everything reused directly; 0 means everything goes to hazardous disposal.
            <IndicativeMarker />
          </p>
        </CardBody>
      </Card>
    </section>
  )
}
