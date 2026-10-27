// The building's Audits tab (round 3): the pre-redevelopment audit, which asks whether the building can be kept, and
// the pre-deconstruction audit, the inventory of what comes out and where it goes. The owner and the surveyor write
// them; the deconstruction contractor reads the pre-deconstruction audit. Nothing here reaches a buyer.
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowUpRight, ClipboardList, Landmark, Plus } from 'lucide-react'
import { act, selectors, useView } from '../../store'
import type { AuditKindCard, AuditListEntry } from '../../store/selectors/audits'
import { Button, Callout, Card, Pill, toast } from '../../ui'

export function Audits() {
  const { buildingId = '' } = useParams()
  const v = useView(selectors.auditsView, buildingId)
  const navigate = useNavigate()
  if (!v) return null
  const start = (k: AuditKindCard) => {
    const r = act.createAudit({ buildingId, kind: k.kind })
    if (!r.ok || !r.value) return toast.error(r.error ?? 'Could not start the audit.')
    toast.success(`${k.title} started`, { description: 'It stays private to the building until you share what it finds.' })
    navigate(`/app/buildings/${buildingId}/audits/${r.value}`)
  }
  return (
    <div className="flex flex-col gap-6" data-testid="audits">
      <p className="m-0 max-w-2xl text-base text-ink-soft">
        {v.canWrite
          ? 'Audit the building before it is designed out and before it comes down. Each audit follows the London guidance and checks itself as you go.'
          : 'The pre-deconstruction audit says what comes out of the building, in what state and where it goes.'}
      </p>
      {v.isCity ? (
        <Callout tone="info" icon={Landmark} title="City of London">
          The City asks for a carbon options appraisal with independent review, condition bands on reuse items and at least five items in the reuse catalogue. The audits below check for each.
        </Callout>
      ) : null}
      <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
        {v.kinds.map((k) => {
          const entry = v.audits.find((a) => a.kind === k.kind) ?? null
          return (
            <li key={k.kind}>
              <KindCard k={k} entry={entry} canWrite={v.canWrite} onStart={() => start(k)} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function KindCard({ k, entry, canWrite, onStart }: { k: AuditKindCard; entry: AuditListEntry | null; canWrite: boolean; onStart: () => void }) {
  return (
    <Card padding="md" className="flex h-full flex-col gap-3" data-testid={`audit-kind-${k.kind}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 flex items-center gap-2 text-base font-semibold text-ink">
          <ClipboardList aria-hidden="true" className="size-4 text-faint" />
          {k.title}
        </h2>
        {entry ? (
          <Pill tone={entry.status === 'complete' ? 'brand' : 'neutral'} dot data-testid={`audit-status-${k.kind}`}>
            {entry.statusLabel}
          </Pill>
        ) : (
          <Pill tone="neutral" variant="quiet">
            Not started
          </Pill>
        )}
      </div>
      <p className="m-0 text-sm text-ink-soft">{k.text}</p>
      <p className="m-0 text-xs text-muted">Follows {k.source}</p>
      {entry ? (
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-muted">Auditor</dt>
            <dd className="m-0 font-medium text-ink">{entry.auditorName}</dd>
          </div>
          <div>
            <dt className="text-muted">{entry.completedText ? 'Completed' : 'Last saved'}</dt>
            <dd className="m-0 font-medium text-ink">{entry.completedText ?? entry.updatedText}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted">Checks</dt>
            <dd className="m-0 font-medium text-ink" data-testid={`audit-checks-${k.kind}`}>
              {entry.checksDone} of {entry.checksTotal} done
            </dd>
          </div>
        </dl>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {entry ? (
          <Button asChild variant={entry.status === 'complete' ? 'secondary' : 'primary'} icon={ArrowUpRight} data-testid={`open-audit-${k.kind}`}>
            <Link to={entry.href}>{entry.status === 'complete' || !canWrite ? 'Open the audit' : 'Carry on'}</Link>
          </Button>
        ) : k.canStart ? (
          <Button variant="primary" icon={Plus} onClick={onStart} data-testid={`start-audit-${k.kind}`}>
            Start the audit
          </Button>
        ) : (
          <p className="m-0 text-sm text-muted">The owner or the surveyor starts this audit.</p>
        )}
      </div>
    </Card>
  )
}
