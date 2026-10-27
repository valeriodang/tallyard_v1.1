// The deconstruction contractor's home (round 3, BRIEF section 15.2): four figures, then each appointed building
// drawn from its survey with the items still to date, and recent activity (collapsed). Every figure comes from
// contractorDashboard (P2).
import { Link } from 'react-router'
import { Building2, CalendarClock, ClipboardList, HardHat, Users, Waypoints } from 'lucide-react'
import { useView } from '../../store'
import { contractorDashboard, type ContractorDashboard } from '../../store/selectors/home-contractor'
import { BuildingThumbnail, Button, Card, MetricGrid, MetricTile, PageHeader, Pill } from '../../ui'
import { Page, SectionTitle } from '../../app/Page'
import { ActivityPanel } from './ActivityPanel'
import { FirstRunCard } from './FirstRunCard'

const CONTRACTOR_FIRST_STEPS = [
  { title: 'Wait for an appointment', text: 'An owner or their surveyor appoints your firm to a building, or invites you by email. The building then appears here.' },
  { title: 'Say when each item comes out', text: 'Set the month you expect each item to be free, from the programme. The owner decides what buyers see.' },
  { title: 'Take it apart for reuse', text: 'Record how each item comes out and where everything goes, so the owner can prove what was reused.' },
] as const

function Metrics({ v }: { v: ContractorDashboard }) {
  const t = v.tiles
  return (
    <MetricGrid label="Your figures" testId="home-stats" className="mt-6">
      <MetricTile testId="metric-owners" label="Clients" icon={Users} value={t.owners} sub="Owners who appointed your firm" />
      <MetricTile testId="metric-to-date" label="Buildings" icon={Building2} value={t.buildings} sub={t.buildingsSubText} />
      <MetricTile testId="metric-dated" label="Dates set" icon={CalendarClock} value={t.dated} sub={t.datedSubText} />
      <MetricTile testId="metric-undated" label="Still to date" icon={ClipboardList} value={t.undated} state={t.undatedState?.state} stateLabel={t.undatedState?.label} sub={t.undatedSubText} />
    </MetricGrid>
  )
}

export function ContractorHome() {
  const v = useView(contractorDashboard)
  if (!v) return null
  return (
    <Page testId="contractor-home">
      <PageHeader title={v.greeting} subtitle={v.dateText} />
      {v.firstRun ? null : <Metrics v={v} />}
      <section aria-labelledby="contractor-buildings-title" className="mt-10 flex min-w-0 flex-col gap-4">
        <SectionTitle id="contractor-buildings-title" title="Your buildings" description="Buildings your firm is appointed to take apart, with the items still to date." className="mb-0" />
        {v.firstRun ? (
          <FirstRunCard spot="building" titleAs="h3" testId="contractor-first-run" title="No buildings yet" text="Buildings appear here once an owner or a surveyor appoints your firm as deconstruction contractor." steps={CONTRACTOR_FIRST_STEPS} />
        ) : (
          <Card>
            <ul className="m-0 list-none divide-y divide-line-soft p-0">
              {v.buildings.map((b) => (
                <li key={b.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5" data-testid={`contractor-building-${b.id}`}>
                  <BuildingThumbnail sketch={b.sketch} decorative className="w-24 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 truncate text-base font-semibold text-ink">
                      <Link to={b.href} className="hover:underline">
                        {b.name}
                      </Link>
                    </h3>
                    <p className="m-0 text-sm text-muted">
                      {b.ownerName}. {b.dismantlingText}
                    </p>
                    <p className="m-0 mt-0.5 text-sm text-ink-soft" data-testid={`contractor-progress-${b.id}`}>
                      {b.methodText}. {b.streamsText}.{b.sells ? ' Your firm holds title and sells what comes out.' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Pill tone={b.datedCount < b.itemCount ? 'warning' : 'brand'} dot size="sm" data-testid={`contractor-dated-${b.id}`}>
                      {b.datedCount} of {b.itemCount} dated
                    </Pill>
                    <Button asChild variant="secondary" size="sm" icon={HardHat}>
                      <Link to={b.availabilityHref}>Set dates</Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm" icon={Waypoints}>
                      <Link to={b.destinationsHref}>Destinations</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
      <ActivityPanel panelId="home-activity-contractor" rows={v.activity} summary={v.activitySummary} emptyText="Dates you set and appointments appear here." className="mt-10" />
    </Page>
  )
}

export default ContractorHome
