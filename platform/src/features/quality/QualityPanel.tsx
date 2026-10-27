// The quality record of an item (round 3): the family's checks and reject criteria, hazards, yield, processing and
// warranty, and for steel the P427 screen and the assessment pathway. The assurance tier is what buyers see, beside
// what the item's building layer asks for. A tested item gets a printable tested-for-reuse label.
import { useState } from 'react'
import { BadgeCheck, Download, ShieldCheck, Tag, TriangleAlert } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { ItemQualityView, SteelPanel } from '../../store/selectors/quality'
import type { HazardId } from '../../domain/auditTypes'
import type { Processing, SteelAssessment, SteelProvenance, WarrantyKind, YesNoUnknown } from '../../domain/qualityTypes'
import { downloadText } from '../../app/download'
import { shareFromText, shareText } from '../../store/selectors/audits-ui'
import { Button, Callout, Checkbox, Dialog, Field, Input, Pill, SegmentedControl, Select, toast } from '../../ui'
import { SavedInput } from '../audits/fields'

type Patch = Parameters<typeof act.saveItemQuality>[1]

export function QualityPanel({ buildingId, itemId }: { buildingId: string; itemId: string }) {
  const v = useView(selectors.itemQualityView, buildingId, itemId)
  if (!v) return null
  return <QualityBody v={v} />
}

function QualityBody({ v }: { v: ItemQualityView }) {
  const save = (patch: Patch) => {
    const r = act.saveItemQuality(v.itemId, patch)
    if (!r.ok) toast.error(r.error ?? 'Could not save.')
    return r.ok
  }
  return (
    <section aria-label="Quality and assurance" className="flex flex-col gap-4 rounded-lg border border-line-soft p-4" data-testid="quality-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 flex items-center gap-2 text-sm font-semibold text-ink">
          <ShieldCheck aria-hidden="true" className="size-4 text-faint" />
          Quality and assurance
        </h3>
        <Pill tone={v.assurance.meets ? 'brand' : 'warning'} size="sm" data-testid="quality-assurance">
          {v.assurance.text}
        </Pill>
      </div>
      <p className="m-0 text-sm text-ink-soft">
        {v.assurance.needText}. {v.assurance.meets ? 'This item meets it.' : 'This item does not meet it yet.'}
      </p>
      {v.lockedText ? <p className="m-0 text-sm text-muted">{v.lockedText}</p> : null}
      <p className="m-0 text-sm text-ink-soft">{v.conditionText}</p>
      {v.methodText ? (
        <p className="m-0 text-sm text-ink-soft" data-testid="item-method">
          The contractor takes it out: {v.methodText}
        </p>
      ) : null}

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" data-testid="quality-checks">
        <legend className="mb-1 text-sm font-medium text-ink">Checks before listing</legend>
        {v.checks.map((c) => (
          <Checkbox key={c.id} label={c.label} checked={c.done} disabled={!v.canEdit} onCheckedChange={(x) => save({ checks: { [c.id]: x === true } })} data-testid={`check-${c.id}`} />
        ))}
        <p className="m-0 text-sm text-muted" data-testid="quality-checks-text">
          {v.checksText}
        </p>
      </fieldset>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" data-testid="quality-rejects">
        <legend className="mb-1 text-sm font-medium text-ink">Reject if found</legend>
        {v.rejects.map((r) => (
          <Checkbox
            key={r.id}
            label={r.label}
            checked={r.found}
            disabled={!v.canEdit}
            onCheckedChange={(x) => save({ rejects: x === true ? [...v.rejects.filter((o) => o.found).map((o) => o.id), r.id] : v.rejects.filter((o) => o.found && o.id !== r.id).map((o) => o.id) })}
            data-testid={`reject-${r.id}`}
          />
        ))}
        {v.rejected ? (
          <Callout tone="danger" icon={TriangleAlert}>
            {v.checksText}
          </Callout>
        ) : null}
      </fieldset>

      {v.hazards.length > 0 ? (
        <div className="flex flex-col gap-2" data-testid="quality-hazards">
          <p className="m-0 text-sm font-medium text-ink">Hazards</p>
          {v.hazards.map((h) => (
            <div key={h.id} className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
              <span className="text-sm text-ink-soft">
                {h.label}
                {h.suggested ? <span className="text-muted">, suggested by the building's age</span> : null}
              </span>
              <Select
                aria-label={`Status of ${h.label}`}
                value={h.status ?? ''}
                placeholder="Not recorded"
                disabled={!v.canEdit}
                options={[
                  { value: 'suspected', label: 'Suspected' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'cleared', label: 'Cleared' },
                ]}
                onChange={(e) =>
                  save({
                    hazards: [
                      ...v.hazards.filter((x) => x.id !== h.id && x.status !== null).map((x) => ({ id: x.id as HazardId, status: x.status! })),
                      ...(e.target.value ? [{ id: h.id as HazardId, status: e.target.value as 'suspected' | 'confirmed' | 'cleared' }] : []),
                    ],
                  })
                }
                data-testid={`hazard-${h.id}`}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <SavedInput label="Yield after removal" inputMode="decimal" value={v.yield.recorded ? shareText(v.yield.share) : ''} placeholder={shareText(v.yield.share)} onSave={(t) => save({ yieldShare: t.trim() === '' ? null : shareFromText(t) })} testId="quality-yield" trailing={<span className="text-sm text-muted">%</span>} hint={v.yield.text} disabled={!v.canEdit} />
        <Field label="Processing" id={`processing-${v.itemId}`}>
          <Select id={`processing-${v.itemId}`} value={v.processing} options={v.processingOptions} disabled={!v.canEdit} onChange={(e) => save({ processing: e.target.value as Processing })} data-testid="quality-processing" />
        </Field>
        <Field label="Warranty" id={`warranty-${v.itemId}`}>
          <Select id={`warranty-${v.itemId}`} value={v.warranty.kind} options={v.warrantyOptions} disabled={!v.canEdit} onChange={(e) => save({ warranty: { ...v.warranty, kind: e.target.value as WarrantyKind } })} data-testid="quality-warranty" />
        </Field>
        {v.warranty.kind !== 'none' ? (
          <SavedInput label="Warranty years" inputMode="decimal" value={v.warranty.years === null ? '' : String(v.warranty.years)} onSave={(t) => save({ warranty: { ...v.warranty, years: t.trim() === '' ? null : Number(t) } })} testId="quality-warranty-years" disabled={!v.canEdit} />
        ) : null}
      </div>
      <dl className="m-0 flex flex-col gap-1.5 text-sm">
        <div>
          <dt className="inline text-muted">Yield: </dt>
          <dd className="inline text-ink-soft">{v.yield.source}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Surplus: </dt>
          <dd className="inline text-ink-soft">{v.surplusText}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Storage: </dt>
          <dd className="inline text-ink-soft">{v.storage}</dd>
        </div>
      </dl>

      {v.steel ? <SteelForm key={JSON.stringify(v.steel.record)} itemId={v.itemId} s={v.steel} canEdit={v.canEdit} /> : null}
      {v.label ? <LabelButton label={v.label} /> : null}
    </section>
  )
}

const ANSWERS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Not known' },
]

function SteelForm({ itemId, s, canEdit }: { itemId: string; s: SteelPanel; canEdit: boolean }) {
  const [d, setD] = useState(() => ({ ...s.record, cert: s.record.certificate ?? { ref: '', lab: '', issuedOn: '', grade: 'unknown' as const } }))
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }))
  const submit = () => {
    const { cert, ...rest } = d
    const r = act.saveSteelRecord(itemId, { ...rest, certificate: cert.ref.trim() || cert.lab.trim() ? cert : null })
    if (!r.ok) return toast.error(r.error ?? 'Could not save the steel record.')
    toast.success('Steel record saved', { description: 'The test status buyers see follows it.', action: { label: 'Undo', onClick: r.undo } })
  }
  return (
    <div className="flex flex-col gap-3 border-t border-line-soft pt-4" data-testid="steel-record">
      <p className="m-0 flex items-center gap-2 text-sm font-semibold text-ink">
        <BadgeCheck aria-hidden="true" className="size-4 text-faint" />
        Steel assessment
        {!s.recorded ? <span className="font-normal text-muted">, not saved yet</span> : null}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Provenance">
          <Select value={d.provenance} options={s.provenanceOptions} disabled={!canEdit} onChange={(e) => set({ provenance: e.target.value as SteelProvenance })} data-testid="steel-provenance" />
        </Field>
        <Field label="Assessment">
          <Select value={d.assessment} options={s.assessmentOptions} disabled={!canEdit} onChange={(e) => set({ assessment: e.target.value as SteelAssessment })} data-testid="steel-assessment" />
        </Field>
        <Field label="Test group" hint="Members of the same form, size, function and source.">
          <Input value={d.groupId} disabled={!canEdit} onChange={(e) => set({ groupId: e.target.value })} data-testid="steel-group" />
        </Field>
        <Field label="Members tested so far">
          <Input inputMode="decimal" value={String(d.samplesTested)} disabled={!canEdit} onChange={(e) => set({ samplesTested: Number(e.target.value.replace(/\D/g, '') || 0) })} data-testid="steel-samples" />
        </Field>
      </div>
      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-1 text-sm font-medium text-ink">P427 screen</legend>
        {s.questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-ink-soft">{q.label}</span>
            <SegmentedControl label={q.label} size="sm" items={ANSWERS} value={d.admissibility[q.id]} onValueChange={(x) => canEdit && set({ admissibility: { ...d.admissibility, [q.id]: x as YesNoUnknown } })} className="w-fit" />
          </div>
        ))}
      </fieldset>
      <Callout tone={s.verdict === 'not_admissible' ? 'danger' : s.verdict === 'admissible' ? 'brand' : 'neutral'} title={s.verdictText}>
        {s.reasons.length > 0 ? s.reasons.join('. ') + '.' : null}
        <span className="block">{s.protocolText}.</span>
        <span className="block" data-testid="steel-samples-text">
          {s.samplesText}.
        </span>
        <span className="block">
          Shown to buyers as {s.statusText.toLowerCase()}. {s.gradeText}.
        </span>
      </Callout>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Certificate number" optional>
          <Input value={d.cert.ref} disabled={!canEdit} onChange={(e) => set({ cert: { ...d.cert, ref: e.target.value } })} data-testid="steel-cert-ref" />
        </Field>
        <Field label="Laboratory" optional>
          <Input value={d.cert.lab} disabled={!canEdit} onChange={(e) => set({ cert: { ...d.cert, lab: e.target.value } })} data-testid="steel-cert-lab" />
        </Field>
        <Field label="Issued on" optional>
          <Input type="date" value={d.cert.issuedOn} disabled={!canEdit} onChange={(e) => set({ cert: { ...d.cert, issuedOn: e.target.value } })} data-testid="steel-cert-date" />
        </Field>
        <Field label="Grade on the certificate" optional>
          <Select
            value={d.cert.grade}
            disabled={!canEdit}
            options={[
              { value: 'unknown', label: 'Not stated' },
              { value: 'S275', label: 'S275' },
              { value: 'S355', label: 'S355' },
            ]}
            onChange={(e) => set({ cert: { ...d.cert, grade: e.target.value as 'S275' | 'S355' | 'unknown' } })}
          />
        </Field>
      </div>
      {canEdit ? (
        <Button variant="primary" className="self-start" onClick={submit} data-testid="save-steel">
          Save the steel record
        </Button>
      ) : null}
    </div>
  )
}

function LabelButton({ label }: { label: { svg: string; fileName: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button icon={Tag} className="self-start" onClick={() => setOpen(true)} data-testid="reuse-label">
        Tested-for-reuse label
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Tested-for-reuse label"
        description="Print it and fix it to the item or its pallet. It carries only what the listing shows."
        testId="label-dialog"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Close</Button>
            <Button variant="primary" icon={Download} onClick={() => downloadText(label.svg, label.fileName, 'image/svg+xml')} data-testid="download-label">
              Download to print
            </Button>
          </>
        }
      >
        <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(label.svg)}`} alt="The tested-for-reuse label" className="w-full max-w-[360px] rounded-md" />
      </Dialog>
    </>
  )
}
