// Listings: for each lot, private, shared with selected projects, or published, with the ask, reserve and date;
// and the building's disclosure settings with the score they give. For whoever sells: the owner, or (round 3) the
// deconstruction contractor the owner passed title to. The owner reads it then, and can take title back.
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowRight, Landmark, Pencil, RotateCcw, Store } from 'lucide-react'
import { formatDate } from '../../domain/dates'
import * as f from '../../domain/format'
import { act, selectors, useView } from '../../store'
import type { ListingRow, ListingsView } from '../../store/selectors/owner'
import { disclosureMeter } from '../../store/selectors/roles-views'
import { Badge, Button, Card, CardBody, CardHeader, Dialog, EmptyState, Pill, SegmentedControl, Sheet, Table, TBody, TD, TH, THead, TR, toast } from '../../ui'
import { DisclosureBox, ListingEditor } from './ListingEditor'
import { VISIBILITY_SHORT, VISIBILITY_TONE } from './labels'

type Tab = 'all' | 'private' | 'matched_only' | 'open'

export function Listings() {
  const { buildingId = '' } = useParams()
  const v = useView(selectors.listingsView, buildingId)
  const [tab, setTab] = useState<Tab>('all')
  const [editing, setEditing] = useState<string | null>(null)
  if (!v) return null
  if (v.empty) return <EmptyState variant="page" icon={Store} title="Nothing to list yet" text="Captured items appear here, private. You decide which to share with selected projects or publish." />
  const meter = disclosureMeter(v.disclosure)
  const rows = v.rows.filter((r) => tab === 'all' || r.visibility === tab)
  const current = v.rows.find((r) => r.lotId === editing) ?? null
  const disclose = (patch: { locationLevel?: 'region' | 'local_authority'; timingLevel?: 'quarter' | 'month' }) => {
    const r = act.setDisclosure(buildingId, patch)
    if (!r.ok) return toast.error(r.error ?? 'Could not change the setting.')
    toast.success('Disclosure updated', { description: 'Published listings now show it this way.', action: { label: 'Undo', onClick: r.undo } })
  }
  const reset = () => {
    const r = act.resetDisclosure(buildingId)
    if (!r.ok) return toast.error(r.error ?? 'Could not reset.')
    toast.success('Back to region, three-month window and private photos', { action: { label: 'Undo', onClick: r.undo } })
  }
  return (
    <div className="flex flex-col gap-6" data-testid="listings">
      <TitleCard v={v} buildingId={buildingId} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            title="Disclosure settings"
            description="How precisely published listings say where and when. The less you show, the harder the building is to identify."
            actions={
              v.sells ? (
                <Button size="sm" variant="ghost" icon={RotateCcw} onClick={reset}>
                  Reset
                </Button>
              ) : null
            }
          />
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="m-0 text-base font-medium text-ink">Location</p>
                <p className="m-0 text-sm text-muted">Shown as the region or the local authority</p>
              </div>
              {v.sells ? (
                <SegmentedControl label="Location shown" value={v.locationLevel} onValueChange={(x) => disclose({ locationLevel: x as 'region' | 'local_authority' })} items={[{ value: 'region', label: 'Region' }, { value: 'local_authority', label: 'Local authority' }]} />
              ) : (
                <span className="text-base font-medium text-ink">{v.locationLevel === 'region' ? 'Region' : 'Local authority'}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="m-0 text-base font-medium text-ink">Timing</p>
                <p className="m-0 text-sm text-muted">Availability shown as a month or a three-month window</p>
              </div>
              {v.sells ? (
                <SegmentedControl label="Timing shown" value={v.timingLevel} onValueChange={(x) => disclose({ timingLevel: x as 'quarter' | 'month' })} items={[{ value: 'quarter', label: 'Three-month window' }, { value: 'month', label: 'Month' }]} />
              ) : (
                <span className="text-base font-medium text-ink">{v.timingLevel === 'quarter' ? 'Three-month window' : 'Month'}</span>
              )}
            </div>
          </CardBody>
        </Card>
        <DisclosureBox meter={meter} inferences={v.disclosure.inferences} blocked={v.disclosure.blocksPublishing} title="Disclosure score for this building" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl
            label="Show"
            value={tab}
            onValueChange={(x) => setTab(x as Tab)}
            items={[
              { value: 'all', label: `All ${v.rows.length}` },
              { value: 'private', label: `Private ${v.counts.private}` },
              { value: 'matched_only', label: `Shared ${v.counts.matched_only}` },
              { value: 'open', label: `Published ${v.counts.open}` },
            ]}
            className="max-w-full overflow-x-auto"
          />
          <Link to={`/app/buildings/${buildingId}/sharing`} className="inline-flex items-center gap-1 rounded-sm text-sm text-ink-soft hover:text-ink max-sm:min-h-11">
            Shared lots are visible to {v.sharedProjectCount} {v.sharedProjectCount === 1 ? 'project' : 'projects'}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
        <Table caption="Listings" data-testid="listings-table">
          <THead>
            <tr>
              <TH>Item</TH>
              <TH>Visibility</TH>
              <TH align="right">Ask</TH>
              <TH align="right">Reserve</TH>
              <TH>Available from</TH>
              <TH align="right">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.lotId} data-testid={`listing-${r.tag}`}>
                <TD>
                  <span className="flex items-baseline gap-2">
                    <span className="text-xs font-medium tabular-nums text-muted">{r.tag}</span>
                    <span className="font-medium text-ink">{r.title}</span>
                  </span>
                </TD>
                <TD>
                  <span className="flex items-center gap-1.5">
                    <Pill tone={VISIBILITY_TONE[r.visibility]} dot size="sm">
                      {VISIBILITY_SHORT[r.visibility]}
                    </Pill>
                    {r.reserved ? <Badge tone="brand">Reserved</Badge> : null}
                  </span>
                </TD>
                <TD align="right" className="whitespace-nowrap">
                  {r.ask !== null && r.visibility !== 'private' ? (
                    <>
                      {f.priceOnly(r.ask, r.family)}
                      <span className="block text-xs text-muted">{r.unitLabel}</span>
                    </>
                  ) : (
                    <span className="text-faint">Not set</span>
                  )}
                </TD>
                <TD align="right" className="whitespace-nowrap">
                  {r.reserve !== null && r.visibility !== 'private' ? (
                    <>
                      {f.priceOnly(r.reserve, r.family)}
                      <span className="block text-xs text-muted">{r.unitLabel}</span>
                    </>
                  ) : (
                    <span className="text-faint">Not set</span>
                  )}
                </TD>
                <TD muted className="whitespace-nowrap">
                  {r.availableFrom ? formatDate(r.availableFrom) : `Expected ${r.expectedText}`}
                </TD>
                <TD align="right">
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(r.lotId)} disabled={!r.canChange} data-testid={`edit-${r.tag}`}>
                    {r.visibility === 'private' ? 'List' : 'Edit'}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {rows.length === 0 ? <p className="m-0 text-sm text-muted">No lots here.</p> : null}
      </div>

      <Sheet open={!!current} onOpenChange={(o) => !o && setEditing(null)} width="lg" title={current ? `${current.tag} · ${current.title}` : ''} description="Visibility, prices and availability" testId="listing-sheet">
        {current ? <ListingEditor key={current.lotId + current.visibility} lot={toEditorLot(current)} onSaved={() => setEditing(null)} compact /> : null}
      </Sheet>
    </div>
  )
}

/** Who holds title to the arisings, and the owner's way to pass it to the contractor or take it back. */
function TitleCard({ v, buildingId }: { v: ListingsView; buildingId: string }) {
  const [confirming, setConfirming] = useState(false)
  const t = v.title
  const change = () => {
    const r = act.setArisingsTitle(buildingId, t.holder === 'owner' ? 'contractor' : 'owner')
    setConfirming(false)
    if (!r.ok) return toast.error(r.error ?? 'Could not change who holds title.')
    toast.success(t.holder === 'owner' ? `Title passed to ${t.contractorName}` : 'Title taken back', { description: t.holder === 'owner' ? 'They now list and sell what comes out, and answer requests.' : 'You list and sell what comes out again.', action: { label: 'Undo', onClick: r.undo } })
  }
  return (
    <Card padding="md" className="flex flex-col gap-3" data-testid="title-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Landmark aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
          <div className="min-w-0">
            <p className="m-0 text-base font-semibold text-ink">Title to the arisings</p>
            <p className="m-0 mt-0.5 max-w-3xl text-sm text-ink-soft" data-testid="title-text">
              {t.text}
            </p>
            {t.blockedText ? <p className="m-0 mt-1 text-sm text-muted">{t.blockedText}</p> : null}
          </div>
        </div>
        {t.canPass ? (
          <Button onClick={() => setConfirming(true)} data-testid="pass-title">
            Pass title to {t.contractorName}
          </Button>
        ) : t.canTakeBack ? (
          <Button onClick={() => setConfirming(true)} data-testid="take-title-back">
            Take title back
          </Button>
        ) : null}
      </div>
      <Dialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t.holder === 'owner' ? `Pass title to ${t.contractorName}?` : 'Take title back?'}
        description={
          t.holder === 'owner'
            ? 'They will list and sell what comes out, set prices and answer requests, as the seller. The projects you share with keep their access. You keep the building and can take title back while no request waits.'
            : 'You will list and sell what comes out again. Requests they already decided stay with them.'
        }
        testId="title-dialog"
        footer={
          <>
            <Button onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant="primary" onClick={change} data-testid="confirm-title">
              {t.holder === 'owner' ? 'Pass title' : 'Take title back'}
            </Button>
          </>
        }
      />
    </Card>
  )
}

function toEditorLot(r: ListingRow) {
  return { lotId: r.lotId, family: r.family, visibility: r.visibility, ask: r.ask, reserve: r.reserve, availableFrom: r.availableFrom, suggested: r.suggested, guide: r.guide, unitLabel: r.unitLabel, reserved: r.reserved }
}

export default Listings
