// A project's limits on reclaimed steel (round 3): what the structural engineer allows. The architect sets them;
// steel listings then say what testing each needs and about how long it takes.
import { useState } from 'react'
import { Columns3, Pencil } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { SteelLimits } from '../../domain/qualityTypes'
import type { SteelLimitsView } from '../../store/selectors/quality'
import { Button, Card, CardBody, CardHeader, Checkbox, Dialog, Field, Select, toast } from '../../ui'

export function SteelLimitsCard({ projectId }: { projectId: string }) {
  const v = useView(selectors.steelLimitsView, projectId)
  const [editing, setEditing] = useState(false)
  if (!v) return null
  return (
    <Card data-testid="steel-limits">
      <CardHeader
        icon={Columns3}
        title="Reclaimed steel limits"
        description="What the structural engineer allows. Steel listings show the testing each would need."
        actions={
          v.canEdit ? (
            <Button size="sm" icon={Pencil} onClick={() => setEditing(true)} data-testid="edit-steel-limits">
              {v.limits ? 'Change' : 'Set limits'}
            </Button>
          ) : null
        }
      />
      <CardBody>
        <p className="m-0 text-base text-ink" data-testid="steel-limits-text">
          {v.text}
        </p>
      </CardBody>
      {editing ? <LimitsDialog projectId={projectId} v={v} onClose={() => setEditing(false)} /> : null}
    </Card>
  )
}

function LimitsDialog({ projectId, v, onClose }: { projectId: string; v: SteelLimitsView; onClose: () => void }) {
  const [d, setD] = useState<SteelLimits>(() => v.limits ?? { exc: 'EXC2', cc: 'CC2', fatigue: false, seismic: false, grade: 'S275' })
  const set = (patch: Partial<SteelLimits>) => setD((x) => ({ ...x, ...patch }))
  const save = (limits: SteelLimits | null) => {
    const r = act.setProjectSteelLimits(projectId, limits)
    if (!r.ok) return toast.error(r.error ?? 'Could not save the limits.')
    onClose()
  }
  return (
    <Dialog
      open
      onOpenChange={(o) => (!o ? onClose() : undefined)}
      title="Reclaimed steel limits"
      description="From the structural engineer's brief for this project."
      testId="steel-limits-dialog"
      footer={
        <>
          {v.limits ? (
            <Button variant="ghost" onClick={() => save(null)}>
              Clear the limits
            </Button>
          ) : null}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => save(d)} data-testid="save-steel-limits">
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Execution class">
          <Select value={d.exc} options={v.excOptions} onChange={(e) => set({ exc: e.target.value as SteelLimits['exc'] })} data-testid="limits-exc" />
        </Field>
        <Field label="Consequence class">
          <Select value={d.cc} options={v.ccOptions} onChange={(e) => set({ cc: e.target.value as SteelLimits['cc'] })} data-testid="limits-cc" />
        </Field>
        <Field label="Highest grade relied on">
          <Select value={d.grade} options={v.gradeOptions} onChange={(e) => set({ grade: e.target.value as SteelLimits['grade'] })} data-testid="limits-grade" />
        </Field>
        <div className="flex flex-col justify-end gap-2">
          <Checkbox label="Fatigue loading" checked={d.fatigue} onCheckedChange={(c) => set({ fatigue: c === true })} />
          <Checkbox label="Seismic design" checked={d.seismic} onCheckedChange={(c) => set({ seismic: c === true })} />
        </div>
      </div>
    </Dialog>
  )
}
