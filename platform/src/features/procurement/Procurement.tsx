// The client's procurement pack (round 3, BRIEF section 15.7): the reuse objective, the supply route and who does
// what, the clause pack, the award weightings, the reclaimed and new unit prices with a provisional sum, and the
// market consultation annex, with Word and spreadsheet exports. Client only.
import { useState } from 'react'
import { useParams } from 'react-router'
import { FileSpreadsheet, FileText, Gavel, Scale, ScrollText, Store, Target, Truck } from 'lucide-react'
import { act, selectors, useNow, useView } from '../../store'
import type { ProcurementView } from '../../store/selectors/procurement'
import type { Ambition, AwardCriterion, AwardTemplateId, SupplyRoute } from '../../domain/procurementTypes'
import { formatDate } from '../../domain/dates'
import { Button, Callout, Card, CardBody, CardHeader, Checkbox, cx, EmptyState, Field, IndicativeMarker, Input, Pill, RadioCards, SegmentedControl, Table, TBody, TD, TH, THead, TR, toast } from '../../ui'
import { downloadBlob } from '../../app/download'
import { ProjectPage } from '../projects/ProjectParts'
import { TabHeader } from '../sustainability/parts'
import { buildProcurementDocx, buildProcurementWorkbook, DOCX_MIME, XLSX_MIME } from './procurementExport'

function report(r: { ok: boolean; error: string | null }) {
  if (!r.ok) toast.error(r.error ?? 'Could not save.')
  return r.ok
}

export function Procurement() {
  const { projectId = '' } = useParams()
  const v = useView(selectors.procurementView, projectId)
  const today = useNow().slice(0, 10)
  const [busy, setBusy] = useState<'docx' | 'xlsx' | null>(null)
  if (!v) return null
  const exportAs = async (kind: 'docx' | 'xlsx') => {
    setBusy(kind)
    try {
      const buf = kind === 'docx' ? await buildProcurementDocx(v, formatDate(today)) : await buildProcurementWorkbook(v)
      const name = `${v.fileBase}.${kind}`
      downloadBlob(new Blob([buf], { type: kind === 'docx' ? DOCX_MIME : XLSX_MIME }), name)
      toast.success('Procurement pack exported', { description: name })
    } catch {
      toast.error('The file could not be made. Try again.')
    } finally {
      setBusy(null)
    }
  }
  return (
    <ProjectPage testId="procurement">
      <div className="flex flex-col gap-6">
        <TabHeader
          title="Procurement pack"
          subtitle="Set the reuse objective, the supply route and the clauses for the tender, with prices from the materials you approved."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button icon={FileText} loading={busy === 'docx'} onClick={() => void exportAs('docx')} data-testid="export-pack-docx">
                Word
              </Button>
              <Button variant="primary" icon={FileSpreadsheet} loading={busy === 'xlsx'} onClick={() => void exportAs('xlsx')} data-testid="export-pack-xlsx">
                Spreadsheet
              </Button>
            </div>
          }
        />
        <Objective projectId={projectId} v={v} />
        <Route projectId={projectId} v={v} />
        <Clauses projectId={projectId} v={v} />
        <Award projectId={projectId} v={v} />
        <Prices projectId={projectId} v={v} />
        <Annex v={v} />
      </div>
    </ProjectPage>
  )
}

function Objective({ projectId, v }: { projectId: string; v: ProcurementView }) {
  const [text, setText] = useState(v.targetPercent)
  const [shown, setShown] = useState(v.targetPercent)
  if (v.targetPercent !== shown) {
    setShown(v.targetPercent)
    setText(v.targetPercent)
  }
  const commit = () => {
    const n = Number(text)
    if (text.trim() === '' || !Number.isFinite(n) || n === Number(v.targetPercent)) return setText(v.targetPercent)
    if (!report(act.saveProcurement(projectId, { targetShare: n / 100 }))) setText(v.targetPercent)
  }
  return (
    <Card data-testid="pack-objective">
      <CardHeader icon={Target} title="Reuse objective" description="One objective for the whole tender, measured the way you choose." />
      <CardBody className="flex flex-col gap-4">
        <RadioCards columns={3} value={v.ambition} onValueChange={(a) => report(act.saveProcurement(projectId, { ambition: a as Ambition }))} options={v.ambitions.map((a) => ({ value: a.value, label: a.label, description: a.text }))} aria-label="Level" />
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Target" id="pack-target" hint="Percent of the building materials.">
            <Input id="pack-target" inputMode="decimal" className="max-w-28" value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} data-testid="pack-target" />
          </Field>
          <SegmentedControl label="Measured" value={v.unit} onValueChange={(u) => report(act.saveProcurement(projectId, { unit: u as 'value' | 'mass' }))} items={[{ value: 'value', label: 'By value' }, { value: 'mass', label: 'By mass' }]} />
        </div>
        <p className="m-0 rounded-lg border border-line-soft bg-page/60 px-3.5 py-3 text-sm text-ink" data-testid="pack-objective-text">
          {v.objective}
        </p>
      </CardBody>
    </Card>
  )
}

function Route({ projectId, v }: { projectId: string; v: ProcurementView }) {
  const chosen = v.routes.find((r) => r.value === v.route)!
  return (
    <Card data-testid="pack-route">
      <CardHeader icon={Truck} title="Supply route" description="Who buys, stores, prepares, tests, insures and is liable for the reclaimed items." />
      <CardBody className="flex flex-col gap-4">
        <RadioCards columns={2} value={v.route} onValueChange={(r) => report(act.saveProcurement(projectId, { route: r as SupplyRoute }))} options={v.routes.map((r) => ({ value: r.value, label: r.label, description: r.text }))} aria-label="Supply route" />
        <p className="m-0 text-sm text-muted">{chosen.when}</p>
        <Table caption="Responsibilities by supply route" density="compact" data-testid="pack-matrix">
          <THead>
            <tr>
              <TH>Duty</TH>
              {v.routes.map((r) => (
                <TH key={r.value} className={cx(r.value === v.route && 'bg-brand-50 text-brand-800')}>
                  {r.label}
                </TH>
              ))}
            </tr>
          </THead>
          <TBody>
            {v.matrix.map((m) => (
              <TR key={m.task}>
                <TD className="whitespace-nowrap font-medium">{m.task}</TD>
                {m.values.map((x) => (
                  <TD key={x.route} className={cx('min-w-40 text-sm', x.route === v.route ? 'bg-brand-50/60 text-ink' : 'text-muted')}>
                    {x.value}
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </CardBody>
    </Card>
  )
}

function Clauses({ projectId, v }: { projectId: string; v: ProcurementView }) {
  const toggle = (id: string, on: boolean) => {
    const ids = v.clauses.filter((c) => (c.id === id ? on : c.included)).map((c) => c.id)
    report(act.saveProcurement(projectId, { clauseIds: ids }))
  }
  return (
    <Card data-testid="pack-clauses">
      <CardHeader icon={ScrollText} title="Clauses" description={`${v.includedCount} of ${v.clauses.length} in the pack. Those written for your route are marked.`} />
      <CardBody className="flex flex-col gap-4">
        <Callout icon={Gavel}>{v.caveat}</Callout>
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {v.clauses.map((c) => (
            <li key={c.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0" data-testid={`clause-${c.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Checkbox label={c.title} checked={c.included} onCheckedChange={(x) => toggle(c.id, x === true)} data-testid={`clause-toggle-${c.id}`} />
                <span className="flex gap-1.5">
                  <Pill size="sm">{c.stage}</Pill>
                  {c.forRoute ? (
                    <Pill size="sm" tone="brand">
                      For this route
                    </Pill>
                  ) : null}
                </span>
              </div>
              <p className={cx('m-0 text-sm', c.included ? 'text-ink-soft' : 'text-faint')}>{c.text}</p>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function Award({ projectId, v }: { projectId: string; v: ProcurementView }) {
  const [draft, setDraft] = useState<AwardCriterion[] | null>(null)
  const criteria = draft ?? v.award.criteria
  const total = criteria.reduce((s, c) => s + (Number.isFinite(c.weight) ? c.weight : 0), 0)
  const save = () => {
    if (report(act.saveAwardCriteria(projectId, criteria))) {
      setDraft(null)
      toast.success('Weights saved')
    }
  }
  return (
    <Card data-testid="pack-award">
      <CardHeader icon={Scale} title="Award criteria" description="Every contract carries a reuse criterion. Start from a template and adjust the weights." />
      <CardBody className="flex flex-col gap-4">
        <RadioCards
          columns={2}
          value={v.award.template}
          onValueChange={(t) => {
            if (t === 'custom') return
            setDraft(null)
            report(act.setAwardTemplate(projectId, t as Exclude<AwardTemplateId, 'custom'>))
          }}
          options={v.award.templates.map((t) => ({ value: t.value, label: t.label, description: t.text, disabled: t.value === 'custom' && v.award.template !== 'custom' }))}
          aria-label="Award template"
        />
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {criteria.map((c, i) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-line-soft px-3 py-2">
              <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-ink">
                {c.label}
                {c.reuse ? (
                  <Pill size="sm" tone="brand">
                    Reuse
                  </Pill>
                ) : null}
              </span>
              <div className="w-20 shrink-0">
                <Input
                  aria-label={`Weight for ${c.label}`}
                  inputMode="numeric"
                  className="text-right"
                  value={Number.isFinite(c.weight) ? String(c.weight) : ''}
                  onChange={(e) => setDraft(criteria.map((x, j) => (j === i ? { ...x, weight: e.target.value === '' ? NaN : Number(e.target.value) } : x)))}
                  data-testid={`award-weight-${c.id}`}
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={cx('m-0 text-sm', total === 100 ? 'text-muted' : 'font-medium text-warning')} data-testid="award-total">
            Total {total} of 100. {v.award.reuseText}
          </p>
          {draft ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={save} data-testid="award-save">
                Save weights
              </Button>
            </div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  )
}

function Prices({ projectId, v }: { projectId: string; v: ProcurementView }) {
  const [text, setText] = useState(v.prices.provisionalPercent)
  const commit = () => {
    const n = Number(text)
    if (text.trim() === '' || !Number.isFinite(n) || n === Number(v.prices.provisionalPercent)) return setText(v.prices.provisionalPercent)
    if (!report(act.saveProcurement(projectId, { provisionalShare: n / 100 }))) setText(v.prices.provisionalPercent)
  }
  return (
    <Card data-testid="pack-prices">
      <CardHeader
        icon={Store}
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            Reclaimed and new unit prices <IndicativeMarker />
          </span>
        }
        description="The estimated price range the review clause works from, with a provisional sum for tests and losses."
      />
      <CardBody className="flex flex-col gap-4">
        {v.prices.empty ? (
          <EmptyState variant="card" className="py-6" icon={Store} title="No approved materials yet" text="Approve materials your architect sends you and their prices appear here." />
        ) : (
          <>
            <Table caption="Reclaimed and new unit prices" density="compact" data-testid="pack-price-table">
              <THead>
                <tr>
                  <TH>Material</TH>
                  <TH>Quantity</TH>
                  <TH>Reclaimed</TH>
                  <TH>New</TH>
                  <TH align="right">Reclaimed range</TH>
                  <TH align="right">The same new</TH>
                </tr>
              </THead>
              <TBody>
                {v.prices.rows.map((r) => (
                  <TR key={r.publicId}>
                    <TD>
                      <span className="block text-xs tabular-nums text-muted">{r.publicId}</span>
                      <span className="text-sm text-ink">{r.title}</span>
                    </TD>
                    <TD className="whitespace-nowrap text-sm">{r.quantityText}</TD>
                    <TD className="whitespace-nowrap text-sm">{r.reclaimedUnit}</TD>
                    <TD className="whitespace-nowrap text-sm">{r.newUnit}</TD>
                    <TD align="right" className="whitespace-nowrap text-sm">
                      {r.reclaimedRange}
                    </TD>
                    <TD align="right" className="whitespace-nowrap text-sm">
                      {r.newCost}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <dl className="m-0 grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">Reclaimed supply</dt>
                <dd className="m-0 font-semibold text-ink" data-testid="pack-reclaimed-range">
                  {v.prices.reclaimedRange}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">The same new</dt>
                <dd className="m-0 font-semibold text-ink">{v.prices.newCost}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Provisional sum</dt>
                <dd className="m-0 font-semibold text-ink" data-testid="pack-provisional">
                  {v.prices.provisional}
                </dd>
              </div>
            </dl>
          </>
        )}
        <Field label="Provisional sum for tests and losses" id="pack-provisional-share" hint="Percent of the reclaimed supply at the guide price. A placeholder rate.">
          <Input id="pack-provisional-share" inputMode="decimal" className="max-w-28" value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} data-testid="pack-provisional-share" />
        </Field>
      </CardBody>
    </Card>
  )
}

function Annex({ v }: { v: ProcurementView }) {
  return (
    <Card data-testid="pack-annex">
      <CardHeader title="Market consultation annex" description="What the market can offer, from the public listings on this project. Share it with tenderers before the tender." />
      <CardBody>
        {v.annex.length === 0 ? (
          <EmptyState variant="card" className="py-6" icon={Store} title="Nothing on the project yet" text="Materials your architect shortlists appear here." />
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
            {v.annex.map((a) => (
              <li key={a.publicId} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
                <p className="m-0 flex flex-wrap items-baseline gap-2">
                  <span className="text-xs tabular-nums text-muted">{a.publicId}</span>
                  <span className="font-medium text-ink">{a.title}</span>
                  <span className="text-sm text-muted">{a.status}</span>
                </p>
                <p className="m-0 text-sm text-ink-soft">{[a.quantityText, a.availability, a.location, a.condition, a.testStatus].join(', ')}</p>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}

export default Procurement
