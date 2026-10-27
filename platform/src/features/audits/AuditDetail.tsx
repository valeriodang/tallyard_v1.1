// One audit of a donor building: its checks, who carried it out, and the audit itself. A draft saves as you go;
// completing it needs every check marked as needed, and tells the building's other sides.
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ChevronLeft, CircleCheck, CircleDashed, Download, Lock, LockOpen, ShieldCheck } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { AuditDetailView } from '../../store/selectors/audits'
import type { AuditIndependence } from '../../domain/auditTypes'
import { Button, Callout, Card, CardBody, CardHeader, Dialog, Field, Input, Pill, ProgressBar, Select, Textarea, cx, toast } from '../../ui'
import { downloadFile } from '../compliance/exports'
import { ReadValue, SavedInput, SavedTextarea } from './fields'
import { PreRedevelopment } from './PreRedevelopment'
import { PreDemolition } from './PreDemolition'

export function AuditDetail() {
  const { buildingId = '', auditId = '' } = useParams()
  const v = useView(selectors.auditDetailView, buildingId, auditId)
  if (!v) return null
  return (
    <div className="flex flex-col gap-6" data-testid="audit-detail">
      <div className="flex flex-col gap-3">
        <Link to={v.listHref} className="inline-flex min-h-11 w-fit items-center gap-1 rounded-sm text-sm font-medium text-ink-soft hover:text-ink" data-testid="audit-back">
          <ChevronLeft aria-hidden="true" className="size-4" />
          All audits
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="m-0 text-lg font-semibold text-ink">{v.title}</h2>
          <Pill tone={v.status === 'complete' ? 'brand' : 'neutral'} dot data-testid="audit-status">
            {v.completedText ? `${v.statusLabel}, ${v.completedText}` : v.statusLabel}
          </Pill>
        </div>
        <p className="m-0 max-w-3xl text-sm text-muted">Follows {v.source}</p>
      </div>
      <ChecklistCard v={v} />
      <AboutCard v={v} />
      {v.kind === 'pre_redevelopment' ? <PreRedevelopment v={v} /> : <PreDemolition v={v} />}
    </div>
  )
}

function ChecklistCard({ v }: { v: AuditDetailView }) {
  const [busy, setBusy] = useState(false)
  const complete = () => {
    const r = act.completeAudit(v.id)
    if (!r.ok) return toast.error(r.error ?? 'Could not complete the audit.')
    toast.success('Audit complete', { description: "The building's other sides have been told.", action: { label: 'Undo', onClick: r.undo } })
  }
  const reopen = () => {
    const r = act.reopenAudit(v.id)
    if (!r.ok) return toast.error(r.error ?? 'Could not reopen the audit.')
    toast.success('Audit reopened', { description: 'Change it, then complete it again.', action: { label: 'Undo', onClick: r.undo } })
  }
  const download = async () => {
    setBusy(true)
    try {
      const { buildAuditWorkbook } = await import('./exportAudit')
      downloadFile(await buildAuditWorkbook(v), v.fileName)
    } catch {
      toast.error('Could not build the workbook. Try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card data-testid="audit-checklist">
      <CardHeader
        icon={ShieldCheck}
        title="Checks"
        description={v.isCity ? "The GLA guidance, with the City of London's additions." : 'What the GLA guidance asks of this audit.'}
        actions={
          <Button size="sm" icon={Download} loading={busy} onClick={download} data-testid="audit-download">
            Workbook
          </Button>
        }
      />
      <CardBody className="flex flex-col gap-4">
        <ProgressBar value={v.checksDone} max={v.checksTotal} label="Needed checks done" valueText={`${v.checksDone} of ${v.checksTotal}`} showLabel />
        <ul className="m-0 grid list-none gap-2 p-0 md:grid-cols-2">
          {v.checklist.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm" data-testid={`check-${c.id}`} data-ok={c.ok}>
              {c.ok ? <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-700" /> : <CircleDashed aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-faint" />}
              <span className="min-w-0">
                <span className={cx('text-ink', !c.ok && 'text-ink-soft')}>{c.label}</span>
                {!c.required ? <span className="ml-1.5 text-muted">Recommended</span> : null}
                {c.detail ? <span className="block text-muted">{c.detail}</span> : null}
                <span className="sr-only">{c.ok ? 'Done' : 'Not done'}</span>
              </span>
            </li>
          ))}
        </ul>
        {v.canWrite ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-line-soft pt-4">
            {v.status === 'draft' ? (
              <>
                <Button variant="primary" icon={Lock} onClick={complete} disabled={!v.ready} data-testid="complete-audit">
                  Complete the audit
                </Button>
                <p className="m-0 text-sm text-muted">{v.ready ? "Every needed check is done. Completing it tells the building's other sides." : 'Finish the checks above to complete it.'}</p>
              </>
            ) : (
              <>
                <Button icon={LockOpen} onClick={reopen} data-testid="reopen-audit">
                  Reopen to change it
                </Button>
                <p className="m-0 text-sm text-muted">A complete audit is locked so what was shared stays as it was.</p>
              </>
            )}
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}

function AboutCard({ v }: { v: AuditDetailView }) {
  const [reviewing, setReviewing] = useState(false)
  const save = (patch: Parameters<typeof act.saveAudit>[1]) => {
    const r = act.saveAudit(v.id, patch)
    if (!r.ok) toast.error(r.error ?? 'Could not save.')
    return r.ok
  }
  return (
    <Card data-testid="audit-about">
      <CardHeader title="Who carried it out" description={v.isCity ? 'The City asks for an independent reviewer of the carbon options and the audit.' : 'The guidance asks for an independent reclamation specialist where possible.'} />
      <CardBody className="grid gap-4 md:grid-cols-2">
        {v.editable ? (
          <>
            <SavedInput label="Auditor" value={v.auditorName} onSave={(t) => save({ auditorName: t })} testId="audit-auditor" hint="The firm as it appears on the report." />
            <Field label="Independence" id="audit-independence">
              <Select id="audit-independence" data-testid="audit-independence" value={v.independence} options={v.independenceOptions} onChange={(e) => save({ independence: e.target.value as AuditIndependence })} />
            </Field>
            <SavedInput label="Surveyed on" type="date" value={v.surveyedOn ?? ''} onSave={(t) => save({ surveyedOn: t || null })} testId="audit-surveyed-on" />
            <div className="flex flex-col gap-1.5">
              <ReadValue label="Peer reviewer" value={v.reviewerText} testId="audit-reviewer" />
              <Button size="sm" variant="link" className="w-fit px-0" onClick={() => setReviewing(true)} data-testid="edit-reviewer">
                {v.reviewer ? 'Change the reviewer' : 'Add a reviewer'}
              </Button>
            </div>
            <SavedTextarea className="md:col-span-2" label="Summary" value={v.summary} onSave={(t) => save({ summary: t })} testId="audit-summary" placeholder="What the audit found, in a few lines." />
          </>
        ) : (
          <>
            <ReadValue label="Auditor" value={v.auditorName} testId="audit-auditor" />
            <ReadValue label="Independence" value={v.independenceLabel} />
            <ReadValue label="Surveyed on" value={v.surveyedOnText} />
            <ReadValue label="Peer reviewer" value={v.reviewerText} testId="audit-reviewer" />
            <div className="md:col-span-2">
              <ReadValue label="Summary" value={v.summary} testId="audit-summary" />
            </div>
          </>
        )}
      </CardBody>
      {reviewing ? <ReviewerDialog v={v} onClose={() => setReviewing(false)} /> : null}
    </Card>
  )
}

function ReviewerDialog({ v, onClose }: { v: AuditDetailView; onClose: () => void }) {
  const [name, setName] = useState(v.reviewer?.name ?? '')
  const [organisation, setOrganisation] = useState(v.reviewer?.organisation ?? '')
  const [reviewedOn, setReviewedOn] = useState(v.reviewer?.reviewedOn ?? '')
  const [note, setNote] = useState(v.reviewer?.note ?? '')
  const submit = () => {
    const r = act.saveAudit(v.id, { reviewer: name.trim() ? { name, organisation, reviewedOn: reviewedOn || null, note } : null })
    if (!r.ok) return toast.error(r.error ?? 'Could not save the reviewer.')
    onClose()
  }
  return (
    <Dialog
      open
      onOpenChange={(o) => (!o ? onClose() : undefined)}
      title="Peer reviewer"
      description="Someone outside the design team who has read the audit and the options."
      testId="reviewer-dialog"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} data-testid="save-reviewer">
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="reviewer-name" />
        </Field>
        <Field label="Organisation">
          <Input value={organisation} onChange={(e) => setOrganisation(e.target.value)} data-testid="reviewer-organisation" />
        </Field>
        <Field label="Reviewed on" optional>
          <Input type="date" value={reviewedOn} onChange={(e) => setReviewedOn(e.target.value)} data-testid="reviewer-date" />
        </Field>
        <Field label="Notes" optional>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {!name.trim() && v.reviewer ? <Callout tone="warning">Saving with no name removes the reviewer.</Callout> : null}
      </div>
    </Dialog>
  )
}
