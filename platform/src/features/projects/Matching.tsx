// Matching (round 3, BRIEF section 15.6): design from stock. The architect loads a steel schedule, chooses how it is
// matched (cut to length, offcuts back to stock, the 30% excess rule, unknown grade) and reads each line against the
// stock the project can see, with that stock by serial size. Matching a whole BIM model stays in version 2.
import { useRef, useState, type ChangeEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Boxes, Compass, FileSpreadsheet, FileUp, Info, LockKeyhole, RotateCcw, Ruler, TableProperties, TriangleAlert, Warehouse } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { StockLineRow, StockMatchView } from '../../store/selectors/stock'
import { LABELS } from '../../domain/reference/labels'
import { Button, Callout, Card, CardBody, CardHeader, CollapsiblePanel, EmptyState, Field, IndicativeMarker, Input, Pill, Switch, toast } from '../../ui'
import { StatStrip } from '../notifications/kit'
import { marketplaceHref } from '../discover/links'
import { ProjectPage } from './ProjectParts'

export function Matching() {
  const { projectId = '' } = useParams()
  const v = useView(selectors.stockMatchView, projectId)
  return (
    <ProjectPage testId="project-matching">
      <div className="flex flex-col gap-6">
        {v ? <ScheduleCard projectId={projectId} v={v} /> : null}
        {v?.summary ? <Results v={v} /> : null}
        {v ? <StockCard v={v} /> : null}
        <ModelCard projectId={projectId} />
      </div>
    </ProjectPage>
  )
}

function ScheduleCard({ projectId, v }: { projectId: string; v: StockMatchView }) {
  const file = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const loaded = (r: { ok: boolean; error: string | null; value: number | null; undo: () => void }) => {
    if (!r.ok) {
      setError(r.error)
      return
    }
    setError(null)
    toast.success('Schedule loaded', { description: `${r.value} lines matched against stock.`, action: { label: 'Undo', onClick: r.undo } })
  }
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setBusy(true)
    try {
      loaded(act.loadSteelSchedule(projectId, await f.text(), f.name))
    } finally {
      setBusy(false)
    }
  }
  const save = (patch: Parameters<typeof act.saveStockMatch>[1]) => {
    const r = act.saveStockMatch(projectId, patch)
    if (!r.ok) toast.error(r.error ?? 'Could not save.')
  }
  const s = v.settings
  return (
    <Card data-testid="stock-schedule">
      <CardHeader
        icon={Ruler}
        title="Design from stock"
        description="Match a steel schedule against the reclaimed steel this project can see, before the frame is fixed."
      />
      <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={upload} data-testid="schedule-file" />
      <CardBody className="flex flex-col gap-5">
        {error ? (
          <Callout tone="danger" icon={TriangleAlert} title="The schedule could not be read" role="alert">
            {error}
          </Callout>
        ) : null}
        {v.schedule ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted" data-testid="schedule-summary">
              <FileSpreadsheet aria-hidden="true" className="size-4 text-faint" />
              <span className="font-medium text-ink">{v.schedule.fileName}</span>
              <span>
                {v.schedule.lines} lines, {v.schedule.members} members, {v.schedule.requiredMassText}
              </span>
              {v.schedule.loadedText ? <span>{v.schedule.loadedText}</span> : null}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => act.clearSteelSchedule(projectId)} data-testid="clear-schedule">
                Clear
              </Button>
              <Button size="sm" icon={FileUp} loading={busy} onClick={() => file.current?.click()}>
                Replace
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            variant="card"
            className="py-6"
            icon={FileSpreadsheet}
            title="No steel schedule yet"
            text={`A CSV with a header row, then mark, section, length in mm, quantity and grade on each line. Up to ${v.maxLines} lines; every line takes the project's steel need-by date.`}
            action={
              <>
                <Button variant="primary" icon={TableProperties} onClick={() => loaded(act.loadSteelSchedule(projectId, null, null))} data-testid="load-sample-schedule">
                  Use the sample schedule
                </Button>
                <Button icon={FileUp} loading={busy} onClick={() => file.current?.click()} data-testid="upload-schedule">
                  Upload a CSV
                </Button>
              </>
            }
          />
        )}
        <fieldset className="m-0 grid gap-4 border-0 p-0 md:grid-cols-2" aria-label="How the schedule is matched">
          <Switch label="Cut long pieces into several members" description="Off, one piece serves one member. The engineer agrees the cut ends." checked={s.cutToLength} onCheckedChange={(c) => save({ cutToLength: c })} data-testid="stock-cut" />
          <Switch label={`Pass over pieces more than ${v.excessText} excess`} description="A piece mostly left over is better used elsewhere." checked={s.excessRule} onCheckedChange={(c) => save({ excessRule: c })} data-testid="stock-excess" />
          <Switch label="Count stock of unknown grade" description="Flagged for testing before it is used." checked={s.allowUnknownGrade} onCheckedChange={(c) => save({ allowUnknownGrade: c })} data-testid="stock-unknown" />
          {s.cutToLength ? <OffcutField value={s.minOffcutM} onSave={(m) => save({ minOffcutM: m })} /> : null}
        </fieldset>
        {v.openOnly ? (
          <Callout icon={Info}>
            Matched against open lots only. Accept the confidentiality terms in the{' '}
            <Link to={marketplaceHref(projectId)} className="font-medium text-ink underline underline-offset-2">
              Marketplace
            </Link>{' '}
            to include lots owners share with this project.
          </Callout>
        ) : null}
      </CardBody>
    </Card>
  )
}

function OffcutField({ value, onSave }: { value: number; onSave: (m: number) => void }) {
  const [text, setText] = useState(String(value))
  const commit = () => {
    const m = Number(text)
    if (text.trim() === '' || m === value) return setText(String(value))
    onSave(m)
  }
  return (
    <Field label="Shortest offcut back to stock" id="stock-offcut" hint="In metres, from 0.5 to 6. Shorter ends are scrap.">
      <Input id="stock-offcut" inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} data-testid="stock-offcut" className="max-w-32" />
    </Field>
  )
}

function Results({ v }: { v: StockMatchView }) {
  const sm = v.summary!
  return (
    <section aria-labelledby="stock-results" className="flex flex-col gap-3" data-testid="stock-results">
      <h2 id="stock-results" className="m-0 text-md font-semibold text-ink">
        Matched against stock
      </h2>
      <StatStrip
        items={[
          { label: 'Members matched', value: sm.matchedText, sub: `${sm.coverageText} of the schedule`, testId: 'stock-matched' },
          { label: 'Stock to buy', value: sm.stockMassText, sub: `Members need ${sm.baselineText}` },
          { label: 'Offcut', value: sm.offcutText, sub: sm.returnText !== null ? `${sm.returnText} back to stock, ${sm.scrapText} scrap` : 'Cutting is off', testId: 'stock-offcut-total' },
          { label: 'Carbon avoided', value: sm.avoidedText, indicative: true, sub: 'Against new steel for the same members' },
        ]}
      />
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {v.lines.map((l) => (
          <li key={l.ref}>
            <LineCard l={l} />
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm text-muted">
        Open a lot to save it to the shortlist. <IndicativeMarker />
      </p>
    </section>
  )
}

function LineCard({ l }: { l: StockLineRow }) {
  return (
    <Card padding="md" data-testid={`stock-line-${l.ref}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-medium tabular-nums text-muted">{l.ref}</span>
          <span className="font-medium text-ink">{l.designation}</span>
          <span className="text-sm text-muted">
            {l.lengthText}, {l.gradeText}
          </span>
        </p>
        <Pill tone={l.tone} size="sm" dot>
          {l.matchedText} matched
        </Pill>
      </div>
      {l.reason ? <p className="m-0 mt-2 text-sm text-ink-soft">{l.reason}</p> : null}
      {l.allocations.length > 0 ? (
        <ul className="m-0 mt-3 flex list-none flex-col divide-y divide-line-soft rounded-lg border border-line-soft p-0">
          {l.allocations.map((a, i) => (
            <li key={`${a.publicId}-${i}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm">
              <Link to={a.href} className="inline-flex min-h-11 items-center font-medium tabular-nums text-ink underline-offset-2 hover:underline sm:min-h-0">
                {a.publicId}
              </Link>
              <span className="text-ink-soft">{a.piecesText}</span>
              <span className="text-muted">{a.overSpecText}</span>
              <span className="text-muted">{a.offcutText}</span>
              {a.excessText ? <span className={a.excessHigh ? 'font-medium text-danger' : 'text-muted'}>{a.excessText}</span> : null}
              <span className="text-muted">{a.storageText}</span>
              {a.fromOffcut ? (
                <Pill tone="brand" size="sm">
                  From an offcut
                </Pill>
              ) : null}
              {a.gradeFlag ? (
                <Pill tone="warning" size="sm">
                  Grade to test
                </Pill>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}

function StockCard({ v }: { v: StockMatchView }) {
  return (
    <section aria-labelledby="stock-explorer" className="flex flex-col gap-3" data-testid="stock-explorer">
      <div>
        <h2 id="stock-explorer" className="m-0 text-md font-semibold text-ink">
          Steel in stock
        </h2>
        <p className="m-0 mt-0.5 text-sm text-muted">{v.stock.length > 0 ? `${v.stockPieces} pieces this project can see, by serial size. Design to these sizes and lengths to use them.` : 'No reclaimed steel this project can see yet.'}</p>
      </div>
      {v.stock.length === 0 ? (
        <Card>
          <EmptyState variant="inline" icon={Warehouse} title="No steel in stock" text="Steel shows here as owners list it or share it with this project." />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {v.stock.map((g) => (
            <CollapsiblePanel key={g.serial} id={`stock-${g.serial.replace(/\s+/g, '-')}`} title={g.serial} summary={`${g.pieces} pieces in ${g.rows.length} ${g.rows.length === 1 ? 'lot' : 'lots'}`} testId={`stock-group-${g.serial}`}>
              <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
                {g.rows.map((r) => (
                  <li key={r.publicId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm sm:px-5">
                    <Link to={r.href} className="inline-flex min-h-11 items-center font-medium tabular-nums text-ink underline-offset-2 hover:underline sm:min-h-0">
                      {r.publicId}
                    </Link>
                    <span className="text-ink">{r.designation}</span>
                    <span className="text-ink-soft">
                      {r.pieces} at {r.lengthText}
                    </span>
                    <span className="text-muted">{r.gradeText}</span>
                    <span className="text-muted">{r.availabilityText}</span>
                  </li>
                ))}
              </ul>
            </CollapsiblePanel>
          ))}
        </div>
      )}
    </section>
  )
}

const STEPS = [
  { icon: FileUp, title: 'Upload a model', text: 'An IFC or Revit model of the frame.' },
  { icon: Boxes, title: 'Match every member', text: 'Each member is checked against open and shared lots, by section, length and grade.' },
]

function ModelCard({ projectId }: { projectId: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-subtle px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-line">
            <LockKeyhole aria-hidden="true" className="size-3" />
            Version 2
          </span>
          <div>
            <h2 className="m-0 text-xl font-semibold text-ink">Match a whole model against the marketplace</h2>
            <p className="m-0 mt-2 max-w-lg text-base text-ink-soft">Upload a BIM model and match every member, not just a schedule.</p>
            <p className="m-0 mt-2 text-sm text-muted">{LABELS.L35}</p>
          </div>
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {STEPS.map((s) => (
              <li key={s.title} className="flex items-start gap-3">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-subtle text-muted ring-1 ring-inset ring-line-soft">
                  <s.icon aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <p className="m-0 font-medium text-ink">{s.title}</p>
                  <p className="m-0 text-sm text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button asChild icon={Compass}>
              <Link to={marketplaceHref(projectId)}>Find materials by hand</Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center border-t border-line-soft bg-page p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div aria-disabled="true" className="flex w-full max-w-sm cursor-not-allowed flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center opacity-80" data-testid="matching-dropzone">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-subtle text-faint ring-1 ring-inset ring-line">
              <Boxes aria-hidden="true" className="size-5" />
            </span>
            <p className="m-0 font-medium text-ink-soft">Drop an IFC or Revit model</p>
            <p className="m-0 text-sm text-muted">Not available in this release</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
