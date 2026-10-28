// The consultant's circular economy statement workspace (round 3, BRIEF section 15.7): whether a statement is
// needed, the guidance's stage matrix, the decision tree for existing buildings, design approaches by layer, the bill
// of materials, recycling and waste, targets, post-construction and a quality check, with the GLA template export.
import { useState } from 'react'
import { useParams } from 'react-router'
import { Building2, CheckCircle2, CircleDashed, ClipboardCheck, FileSpreadsheet, Flag, Layers, ListChecks, Plus, Recycle, Scale, Target, Trash2, TriangleAlert } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { CesView, CesWasteView } from '../../store/selectors/ces'
import type { CesLayer, DesignApproach, ExistingQuestion, WasteRoutes } from '../../domain/cesTypes'
import type { CesStage } from '../../domain/reference/gla'
import type { EolScenarioId } from '../../domain/reference/rics'
import { amountFromText, shareFromPercentText } from '../../domain/input'
import { Button, Callout, Card, CardBody, CardHeader, Checkbox, cx, EmptyState, IconButton, IndicativeMarker, Input, Pill, ProgressBar, RadioCards, SegmentedControl, Select, Table, TBody, TD, TH, THead, TR, toast } from '../../ui'
import { downloadBlob } from '../../app/download'
import { Page } from '../../app/Page'
import { SavedInput, SavedTextarea } from '../audits/fields'
import { TabHeader } from '../sustainability/parts'
import { buildGlaTemplate } from './glaTemplateExport'

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function report(r: { ok: boolean; error: string | null }) {
  if (!r.ok) toast.error(r.error ?? 'Could not save.')
  return r.ok
}


export function CesWorkspace() {
  const { projectId = '' } = useParams()
  const v = useView(selectors.cesView, projectId)
  const template = useView(selectors.cesTemplate, projectId)
  const [busy, setBusy] = useState(false)
  if (!v || !template) return null
  const exportTemplate = async () => {
    setBusy(true)
    try {
      downloadBlob(new Blob([await buildGlaTemplate(template)], { type: XLSX }), v.fileName)
      toast.success('Template exported', { description: v.fileName })
    } catch {
      toast.error('The template could not be made. Try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Page className="lg:pt-7" testId="ces">
      <div className="flex flex-col gap-6">
        <TabHeader
          title="Statement inputs"
          subtitle="The tables of the GLA template, kept with the project. The statement on the Circular economy tab draws on them."
          actions={
            <Button variant="primary" icon={FileSpreadsheet} loading={busy} onClick={() => void exportTemplate()} data-testid="export-gla">
              GLA template
            </Button>
          }
        />
        <Quality v={v} />
        <Requirement projectId={projectId} v={v} />
        <Stage projectId={projectId} v={v} />
        <Existing projectId={projectId} v={v} />
        <LayersCard projectId={projectId} v={v} />
        <Bill projectId={projectId} v={v} />
        <Waste projectId={projectId} v={v} />
        <Targets projectId={projectId} v={v} />
        <Post projectId={projectId} v={v} />
      </div>
    </Page>
  )
}

function Quality({ v }: { v: CesView }) {
  return (
    <Card data-testid="ces-quality">
      <CardHeader icon={ListChecks} title="Quality check" description={`${v.qualityPassed} of ${v.quality.length} checks pass. Built from what the GLA's 2023 monitoring found statements most often lacked.`} />
      <CardBody>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {v.quality.map((q) => (
            <li key={q.id} className="flex items-start gap-2 text-sm" data-testid={`quality-${q.id}`} data-pass={q.pass}>
              {q.pass ? <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-600" /> : <CircleDashed aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />}
              <span className={q.pass ? 'text-ink-soft' : 'text-ink'}>{q.text}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function Requirement({ projectId, v }: { projectId: string; v: CesView }) {
  const r = v.requirement
  const toggle = (id: string, on: boolean) => report(act.saveCesSettings(projectId, { referralIds: r.criteria.filter((c) => (c.id === id ? on : c.checked)).map((c) => c.id) }))
  return (
    <Card data-testid="ces-requirement">
      <CardHeader
        icon={ClipboardCheck}
        title="Is a statement needed?"
        description="Referable schemes need one, as does every major in the City of London, and boroughs may ask for one too."
        actions={
          <Pill tone={r.required ? 'brand' : 'neutral'} dot data-testid="ces-required">
            {r.required ? 'Needed' : 'Not needed yet'}
          </Pill>
        }
      />
      <CardBody className="flex flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {r.criteria.map((c) => (
            <Checkbox key={c.id} label={c.label} checked={c.checked} onCheckedChange={(x) => toggle(c.id, x === true)} data-testid={`referral-${c.id}`} />
          ))}
          <Checkbox label="The borough's own plan asks for one" checked={r.localRequirement} onCheckedChange={(x) => report(act.saveCesSettings(projectId, { localRequirement: x === true }))} />
        </div>
        {r.reasons.length > 0 ? (
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm text-ink-soft">
            {r.reasons.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : null}
      </CardBody>
    </Card>
  )
}

function Stage({ projectId, v }: { projectId: string; v: CesView }) {
  return (
    <Card data-testid="ces-stage">
      <CardHeader icon={Flag} title="Stage and readiness" description="What the guidance's Table 5 asks for at each stage, and what the records already hold." />
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Select aria-label="Stage" className="max-w-xs" value={v.stage} options={v.stages} onChange={(e) => report(act.saveCesSettings(projectId, { stage: e.target.value as CesStage }))} data-testid="ces-stage-select" />
          {v.nextStageText ? <span className="text-sm text-muted">{v.nextStageText}</span> : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <ProgressBar value={v.readinessShare} max={1} label="Readiness" valueText={v.readinessText} />
          <p className="m-0 text-sm text-ink-soft" data-testid="ces-readiness">
            {v.readinessText}
          </p>
        </div>
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {v.matrix.map((m) => (
            <li key={m.id} className={cx('flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm', m.need === 'not_needed' ? 'border-line-soft text-muted' : 'border-line text-ink')} data-testid={`matrix-${m.id}`}>
              <span className="flex items-center gap-2">
                {m.done ? <CheckCircle2 aria-label="Ready" className="size-4 shrink-0 text-brand-600" /> : <CircleDashed aria-label="Not yet" className="size-4 shrink-0 text-faint" />}
                {m.label}
              </span>
              <Pill size="sm" tone={m.need === 'required' ? (m.done ? 'brand' : 'warning') : 'neutral'}>
                {m.needLabel}
              </Pill>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function Existing({ projectId, v }: { projectId: string; v: CesView }) {
  const t = v.tree
  return (
    <Card data-testid="ces-existing">
      <CardHeader icon={Building2} title="Existing building" description="The guidance's decision tree, as the template asks it. Retention is the starting point." />
      <CardBody className="flex flex-col gap-4">
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {t.questions
            .filter((q) => q.shown)
            .map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-ink">{q.text}</span>
                <div data-testid={`tree-${q.id}`}>
                  <SegmentedControl
                    label={q.text}
                    value={q.answer ?? ''}
                    onValueChange={(x) => report(act.answerExisting(projectId, q.id as ExistingQuestion, x === 'yes' || x === 'no' ? x : null))}
                    items={[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ]}
                  />
                </div>
              </li>
            ))}
        </ol>
        <Callout tone={t.outcome === 'demolish' ? 'warning' : t.outcome === 'incomplete' ? 'neutral' : 'info'} title={t.outcomeLabel}>
          <span data-testid="tree-outcome">{t.outcomeText}</span>
        </Callout>
        {t.needsJustification ? <SavedTextarea label="Why not retain" value={t.justification} hint="The further down the hierarchy, the more compelling the reasons the guidance asks for." onSave={(x) => report(act.saveJustification(projectId, x))} testId="tree-justification" /> : null}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Checkbox label="Pre-redevelopment audit attached" checked={v.audits.preRedevelopment} onCheckedChange={(x) => report(act.saveCesSettings(projectId, { audits: { preRedevelopment: x === true } }))} data-testid="audit-pre-redevelopment" />
          <Checkbox label="Pre-demolition audit attached" checked={v.audits.preDemolition} onCheckedChange={(x) => report(act.saveCesSettings(projectId, { audits: { preDemolition: x === true } }))} data-testid="audit-pre-demolition" />
        </div>
      </CardBody>
    </Card>
  )
}

function LayersCard({ projectId, v }: { projectId: string; v: CesView }) {
  return (
    <Card data-testid="ces-layers">
      <CardHeader icon={Layers} title="Design approaches by layer" description="For each layer, the approaches that apply and how the design meets them." />
      <CardBody className="flex flex-col gap-5">
        {v.layers.map((l) => (
          <section key={l.id} className="flex flex-col gap-2 border-b border-line-soft pb-5 last:border-0 last:pb-0" aria-label={l.label} data-testid={`layer-${l.id}`}>
            <p className="m-0 flex flex-wrap items-baseline gap-2">
              <span className="font-medium text-ink">{l.label}</span>
              <span className="text-xs text-muted">{l.nrm}</span>
            </p>
            <p className="m-0 text-sm text-muted">{l.text}</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Approaches for ${l.label}`}>
              {l.approaches.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={a.checked}
                  onClick={() => report(act.saveLayer(projectId, l.id as CesLayer, { approaches: l.approaches.filter((x) => (x.id === a.id ? !a.checked : x.checked)).map((x) => x.id as DesignApproach) }))}
                  className={cx('min-h-11 rounded-full border px-3 text-sm transition-colors sm:min-h-8', a.checked ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line bg-surface text-ink-soft hover:border-line-strong')}
                  data-testid={`approach-${l.id}-${a.id}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <SavedTextarea label="Response" value={l.response} rows={2} onSave={(x) => report(act.saveLayer(projectId, l.id as CesLayer, { response: x }))} testId={`layer-response-${l.id}`} />
          </section>
        ))}
      </CardBody>
    </Card>
  )
}

function Bill({ projectId, v }: { projectId: string; v: CesView }) {
  const b = v.bom
  return (
    <Card data-testid="ces-bom">
      <CardHeader
        icon={Scale}
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            Bill of materials <IndicativeMarker />
          </span>
        }
        description="Intensity, lifespan, replacements over 60 years, site waste and end of life for each line, with reused and recycled content kept apart."
      />
      <CardBody className="flex flex-col gap-5">
        {b.empty ? (
          <EmptyState variant="card" className="py-6" icon={Scale} title="No bill of materials yet" text="The bill comes from the project's records. Once it has lines, they are read here." />
        ) : (
          <>
            <RadioCards columns={3} value={b.scenario} onValueChange={(x) => report(act.saveCesSettings(projectId, { eolScenario: x as EolScenarioId }))} options={b.scenarios.map((s) => ({ value: s.value, label: s.label, description: s.text }))} aria-label="End-of-life scenario" data-testid="ces-scenario" />
            <Table caption="Bill of materials" density="compact">
              <THead>
                <tr>
                  <TH>Line</TH>
                  <TH align="right">Mass</TH>
                  <TH align="right">Intensity</TH>
                  <TH>Lifespan</TH>
                  <TH align="right">Replaced</TH>
                  <TH align="right">Site waste</TH>
                  <TH>End of life</TH>
                </tr>
              </THead>
              <TBody>
                {b.rows.map((r) => (
                  <TR key={r.id}>
                    <TD className="min-w-44 text-sm">
                      <span className="block text-ink">{r.name || r.element}</span>
                      {r.name ? <span className="block text-xs text-muted">{r.element}</span> : null}
                    </TD>
                    <TD align="right" className="whitespace-nowrap text-sm">
                      {r.massText}
                    </TD>
                    <TD align="right" className="whitespace-nowrap text-sm">
                      {r.intensityText}
                    </TD>
                    <TD className="whitespace-nowrap text-sm">{r.lifespanText}</TD>
                    <TD align="right" className="text-sm">
                      {r.replacements}
                    </TD>
                    <TD align="right" className="text-sm">
                      {r.wasteText}
                    </TD>
                    <TD className="min-w-48 text-sm text-muted">{r.eolText}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-5" data-testid="ces-bom-totals">
              {[
                ['Total mass', b.totals.massText],
                ['Intensity', b.totals.intensityText],
                ['Site waste', b.totals.wasteText],
                ['Reusable at end of life', b.totals.reusableText],
                ['Recyclable at end of life', b.totals.recyclableText],
              ].map(([k, x]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="m-0 font-semibold text-ink">{x}</dd>
                </div>
              ))}
            </dl>
            <div>
              <h3 className="m-0 mb-2 text-sm font-semibold text-ink">Against the guidance benchmarks</h3>
              <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
                {b.benchmarks.map((x) => (
                  <li key={x.label} className="rounded-lg border border-line-soft px-3 py-2 text-sm">
                    <span className="font-medium text-ink">{x.label}</span> <span className="text-ink-soft">{x.intensityText}</span>
                    <span className="block text-xs text-muted">
                      {x.positionText}; median {x.medianText}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="ces-content">
              <div className="rounded-lg border border-line-soft px-3 py-2">
                <p className="m-0 text-xs text-muted">Reused content</p>
                <p className="m-0 text-sm text-ink">
                  {b.content.reusedMassText} ({b.content.reusedMassShare} by mass), {b.content.reusedValueShare} by value
                </p>
              </div>
              <div className="rounded-lg border border-line-soft px-3 py-2">
                <p className="m-0 text-xs text-muted">Recycled content</p>
                <p className="m-0 text-sm text-ink">
                  {b.content.recycledMassText} ({b.content.recycledMassShare} by mass), {b.content.recycledValueShare} by value
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <SavedInput label="Material cost in the cost plan (£)" value={b.materialCost} inputMode="decimal" hint="The 20% content aim needs at least 80% of material cost covered." onSave={(x) => report(act.saveCesSettings(projectId, { materialCost: amountFromText(x) }))} testId="ces-material-cost" className="max-w-sm" />
              {b.coverageText ? (
                <p className={cx('m-0 text-sm', b.coverageOk ? 'text-ink-soft' : 'font-medium text-warning')} data-testid="ces-coverage">
                  {b.coverageText} {b.coverageOk ? '' : 'Below 80%: cost more of the bill.'}
                </p>
              ) : null}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}

const ROUTE_FIELDS: { key: keyof WasteRoutes; label: string }[] = [
  { key: 'reuseOnsite', label: 'Reuse on site' },
  { key: 'reuseOffsite', label: 'Reuse off site' },
  { key: 'recycleOnsite', label: 'Recycle on site' },
  { key: 'recycleOffsite', label: 'Recycle off site' },
  { key: 'landfill', label: 'Landfill' },
  { key: 'other', label: 'Other recovery' },
]

function Waste({ projectId, v }: { projectId: string; v: CesView }) {
  return (
    <Card data-testid="ces-waste">
      <CardHeader icon={Recycle} title="Recycling and waste reporting" description="Estimates by stream, in tonnes and shares by weight. The 95% targets count reuse, recycling and recovery." />
      <CardBody className="flex flex-col gap-5">
        {v.waste.map((w) => (
          <WasteStreamRow key={w.stream} projectId={projectId} w={w} />
        ))}
      </CardBody>
    </Card>
  )
}

function WasteStreamRow({ projectId, w }: { projectId: string; w: CesWasteView }) {
  return (
    <section className="flex flex-col gap-3 border-b border-line-soft pb-5 last:border-0 last:pb-0" aria-label={w.label} data-testid={`waste-${w.stream}`}>
      <p className="m-0 font-medium text-ink">{w.label}</p>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
        <SavedInput label={w.perYear ? 'Tonnes a year' : 'Tonnes'} value={w.tonnes} inputMode="decimal" onSave={(x) => report(act.saveWaste(projectId, w.stream, { tonnes: amountFromText(x) }))} testId={`waste-tonnes-${w.stream}`} />
        <SavedInput label="Source of information" value={w.source} placeholder="For example, the pre-demolition audit" onSave={(x) => report(act.saveWaste(projectId, w.stream, { source: x }))} testId={`waste-source-${w.stream}`} />
      </div>
      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-6">
        {ROUTE_FIELDS.map((r) => (
          <SavedInput key={r.key} label={`${r.label} (%)`} value={w.routes[r.key]} inputMode="decimal" onSave={(x) => report(act.saveWaste(projectId, w.stream, { routes: { [r.key]: shareFromPercentText(x) ?? 0 } }))} testId={`waste-${w.stream}-${r.key}`} />
        ))}
      </div>
      <p className="m-0 text-sm text-ink-soft" data-testid={`waste-summary-${w.stream}`}>
        {w.tonnes === '' ? 'Not estimated yet.' : `${w.tPerM2Text}. Reuse ${w.reuseText}, recycling ${w.recycleText}, reused, recycled or recovered ${w.recoveredText}, landfill ${w.landfillText}.${w.benchmarkText ? ` ${w.benchmarkText}.` : ''}`}
      </p>
      {!w.complete && w.tonnes !== '' ? <p className="m-0 text-sm text-warning">The routes do not add up to 100% yet.</p> : null}
      {w.guard ? (
        <Callout tone="warning" icon={TriangleAlert}>
          Reuse is above a quarter of this stream. Check that crushed concrete and hardcore used as fill are counted as recycling, not reuse.
        </Callout>
      ) : null}
    </section>
  )
}

function Targets({ projectId, v }: { projectId: string; v: CesView }) {
  return (
    <Card data-testid="ces-targets">
      <CardHeader icon={Target} title="Targets" description="Aim above a minimum to reach the template's pioneering status. Report what was achieved after completion." />
      <CardBody>
        <ul className="m-0 flex list-none flex-col divide-y divide-line-soft p-0">
          {v.targets.map((t) => (
            <li key={t.id} className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_10rem_10rem] sm:items-end" data-testid={`target-${t.id}`}>
              <div className="min-w-0">
                <p className="m-0 text-sm font-medium text-ink">{t.label}</p>
                <p className="m-0 mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  {t.minimumText}, {t.basis.toLowerCase()}
                  {t.pioneering ? (
                    <Pill size="sm" tone="brand">
                      Pioneering
                    </Pill>
                  ) : null}
                  {t.copiesMinimum ? (
                    <Pill size="sm" tone="warning">
                      At the minimum
                    </Pill>
                  ) : null}
                  {t.met === true ? (
                    <Pill size="sm" tone="brand">
                      Met
                    </Pill>
                  ) : t.met === false ? (
                    <Pill size="sm" tone="danger">
                      Not met
                    </Pill>
                  ) : null}
                </p>
              </div>
              <SavedInput label="Aiming for (%)" value={t.aiming} inputMode="decimal" onSave={(x) => report(act.setTargetRate(projectId, t.id, 'aiming', shareFromPercentText(x)))} testId={`aim-${t.id}`} />
              <SavedInput label="Achieved (%)" value={t.achieved} inputMode="decimal" onSave={(x) => report(act.setTargetRate(projectId, t.id, 'achieved', shareFromPercentText(x)))} testId={`achieved-${t.id}`} />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

function Post({ projectId, v }: { projectId: string; v: CesView }) {
  const [measure, setMeasure] = useState('')
  const [action, setAction] = useState('')
  const [lesson, setLesson] = useState('')
  const [solution, setSolution] = useState('')
  const addAchievement = () => {
    if (report(act.addAchievement(projectId, measure, action))) {
      setMeasure('')
      setAction('')
    }
  }
  const addLesson = () => {
    if (report(act.addLesson(projectId, lesson, solution))) {
      setLesson('')
      setSolution('')
    }
  }
  return (
    <Card data-testid="ces-post">
      <CardHeader icon={CheckCircle2} title="Post-construction" description="The final statement is due no more than three months after practical completion, with the actual figures." />
      <CardBody className="flex flex-col gap-5">
        <dl className="m-0 grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-muted">Practical completion</dt>
            <dd className="m-0 font-semibold text-ink">{v.post.completionText}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Statement due by</dt>
            <dd className={cx('m-0 font-semibold', v.post.overdue ? 'text-danger' : 'text-ink')} data-testid="ces-due">
              {v.post.dueText}
            </dd>
          </div>
        </dl>
        <section className="flex flex-col gap-2" aria-label="Key achievements">
          <h3 className="m-0 text-sm font-semibold text-ink">Key achievements</h3>
          <EntryList entries={v.post.achievements.map((a) => ({ id: a.id, title: a.measure, text: a.action }))} onRemove={(id) => report(act.removeCesEntry(projectId, 'achievements', id))} empty="None recorded yet." />
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
            <Input aria-label="Measure or target" placeholder="Measure or target" value={measure} onChange={(e) => setMeasure(e.target.value)} data-testid="achievement-measure" />
            <Input aria-label="What was done" placeholder="What was done, and any difference from the target" value={action} onChange={(e) => setAction(e.target.value)} data-testid="achievement-action" />
            <Button icon={Plus} onClick={addAchievement} data-testid="achievement-add">
              Add
            </Button>
          </div>
        </section>
        <section className="flex flex-col gap-2" aria-label="Lessons learnt">
          <h3 className="m-0 text-sm font-semibold text-ink">Lessons learnt</h3>
          <EntryList entries={v.post.lessons.map((l) => ({ id: l.id, title: l.description, text: l.solution }))} onRemove={(id) => report(act.removeCesEntry(projectId, 'lessons', id))} empty="None recorded yet." />
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
            <Input aria-label="Lesson" placeholder="Lesson" value={lesson} onChange={(e) => setLesson(e.target.value)} data-testid="lesson-description" />
            <Input aria-label="Solution or future approach" placeholder="Solution or future approach" value={solution} onChange={(e) => setSolution(e.target.value)} data-testid="lesson-solution" />
            <Button icon={Plus} onClick={addLesson} data-testid="lesson-add">
              Add
            </Button>
          </div>
        </section>
      </CardBody>
    </Card>
  )
}

function EntryList({ entries, onRemove, empty }: { entries: { id: string; title: string; text: string }[]; onRemove: (id: string) => void; empty: string }) {
  if (entries.length === 0) return <p className="m-0 text-sm text-muted">{empty}</p>
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {entries.map((e) => (
        <li key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-line-soft px-3 py-2">
          <span className="min-w-0 text-sm">
            <span className="font-medium text-ink">{e.title}</span>
            <span className="block text-ink-soft">{e.text}</span>
          </span>
          <IconButton icon={Trash2} label={`Remove ${e.title}`} onClick={() => onRemove(e.id)} className="max-sm:size-11" />
        </li>
      ))}
    </ul>
  )
}

export default CesWorkspace
