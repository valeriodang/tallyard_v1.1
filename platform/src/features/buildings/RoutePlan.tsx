// The recovery plan's routes (round 3): where each item goes, from keeping it in place to landfill, the plan's
// Level(s) 2.4 score against the RICS business-as-usual case, and each family's cascade of uses. Owner only.
import { useState } from 'react'
import { ChevronDown, Recycle, RotateCcw } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { RecoveryPlanRow } from '../../store/selectors/recovery'
import type { RecoveryRoute } from '../../domain/reference/recovery'
import { Card, CardBody, CardHeader, cx, IconButton, IndicativeMarker, Pill, Select, toast, VIZ } from '../../ui'
import { StatStrip } from '../notifications/kit'

/** Each route keeps its own categorical colour, in route order, best first. */
const ROUTE_ORDER: RecoveryRoute[] = ['retain', 'relocate', 'reuse_on_site', 'reuse_off_site', 'upcycle', 'recycle', 'downcycle', 'energy_recovery', 'landfill']
const colourOf = (route: RecoveryRoute) => VIZ[ROUTE_ORDER.indexOf(route) % VIZ.length]

export function RoutePlan({ buildingId }: { buildingId: string }) {
  const v = useView(selectors.recoveryPlanView, buildingId)
  if (!v || v.empty) return null
  const options = v.options.map((o) => ({ value: o.value, label: o.label }))
  return (
    <Card data-testid="route-plan">
      <CardHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            Routes and circularity <IndicativeMarker />
          </span>
        }
        description="Where each item goes, best first. Change a route where the plan differs from the suggestion."
      />
      <CardBody className="flex flex-col gap-5">
        <StatStrip
          items={[
            { label: 'Level(s) score', value: v.scoreText, sub: `Business as usual: ${v.bauScoreText}`, testId: 'route-score' },
            { label: 'Reused', value: v.reusedText, sub: `Of ${v.totalText}` },
            { label: 'Reuse gain', value: v.gainText, sub: 'Over the RICS business-as-usual split', testId: 'route-gain' },
          ]}
        />
        <div className="flex flex-col gap-2">
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-3 w-full overflow-hidden rounded-full bg-subtle" role="img" aria-label={`Plan by route: ${v.byRoute.map((r) => `${r.label} ${r.text}`).join(', ')}`}>
            {v.byRoute.map((r) => (
              <rect key={r.route} x={r.at} y="0" width={r.size} height="8" fill={colourOf(r.route)} />
            ))}
          </svg>
          <ul aria-hidden="true" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-muted">
            {v.byRoute.map((r) => (
              <li key={r.route} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px]" style={{ background: colourOf(r.route) }} />
                {r.label} <span className="tabular-nums text-ink">{r.text}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-sm text-muted">{v.note}</p>
        </div>
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft rounded-lg border border-line p-0" aria-label="Route for each item">
          {v.rows.map((r) => (
            <RouteRow key={r.itemId} buildingId={buildingId} r={r} options={options} />
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function RouteRow({ buildingId, r, options }: { buildingId: string; r: RecoveryPlanRow; options: { value: RecoveryRoute; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const save = (route: RecoveryRoute | null) => {
    const x = act.setItemRoute(buildingId, r.itemId, route)
    if (!x.ok) toast.error(x.error ?? 'Could not save.')
  }
  const cascadeId = `cascade-${r.itemId}`
  return (
    <li className="flex flex-col gap-3 px-4 py-3" data-testid={`route-${r.tag}`}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)] sm:items-center">
        <div className="min-w-0">
          <p className="m-0 flex flex-wrap items-baseline gap-2">
            <span className="text-xs font-medium tabular-nums text-muted">{r.tag}</span>
            <span className="font-medium text-ink">{r.title}</span>
            <span className="text-sm tabular-nums text-muted">{r.massText}</span>
          </p>
          <p className="m-0 mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Pill tone={r.reuse ? 'brand' : 'neutral'} size="sm" dot>
              {r.coefficientText}
            </Pill>
            {r.chosen ? <span>Suggested: {r.suggestedLabel}</span> : <span>Suggested route</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select aria-label={`Route for ${r.tag}`} className="flex-1" value={r.route} options={options} onChange={(e) => save(e.target.value as RecoveryRoute)} data-testid={`route-select-${r.tag}`} />
          {r.chosen ? <IconButton icon={RotateCcw} label={`Use the suggested route for ${r.tag}`} onClick={() => save(null)} data-testid={`route-reset-${r.tag}`} className="max-sm:size-11" /> : null}
        </div>
      </div>
      <button type="button" aria-expanded={open} aria-controls={cascadeId} onClick={() => setOpen(!open)} className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-ink-soft hover:text-ink sm:min-h-0">
        <Recycle aria-hidden="true" className="size-4 text-faint" />
        Cascade of uses
        <ChevronDown aria-hidden="true" className={cx('size-4 text-faint transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <ol id={cascadeId} className="m-0 flex list-decimal flex-col gap-1 pl-9 text-sm text-ink-soft">
          {r.cascade.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
      ) : null}
    </li>
  )
}
