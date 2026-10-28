# Round 3 decisions

Decisions taken while building round 3 (`BRIEF.md` section 15), with the reason for each. The user chose four of them on 27 October 2026:
- the platform only;
- the contractor as a full role;
- staged releases;
- configurable deal models with labelled placeholders.

## Stage 1

- **Steel's new carbon factor stays at 1.74 tCO2e per tonne.**
  - The RICS standard's default for rolled sections is the blended UK market rate (60% BOF and 40% EAF) from the BCSA, Steel for Life and SCI average, and 1.74 is that UK average.
  - ICE V3's 1.55 is recorded in the source line as an alternative.
- **Reclaimed steel is 0.0466 tCO2e per tonne**, the published declaration for reclaimed sections. The value is A1 to A3 and includes transport to the processing yard.
  - Under the RICS rule, reused material enters with no impact from its previous use, so only this reprocessing counts.
- **Reclaimed brick is 0.0027**, from a published declaration for cleaned reclaimed bricks.
- **The raised floor panel mass is 9.3 kg**, from a London pre-demolition audit (320.5 t over 34,572 panels). This replaces the 12 kg sample figure.
- **A4 for the new product follows the RICS Table 17 category of each family.**
  - Steel, precast, brick, raised floor and timber are national (120 km, as before).
  - Stone cladding stays national because the seeded stone is UK quarried.
  - Curtain wall becomes European (1,500 km by road and 100 km by sea), which is the RICS example for facade modules. The longer delivery of the new unit raises both the avoided figure and its share: TH-08 goes from 78.1 to 81.5 tCO2e, and from 92.4% to 92.7%.
- **The sea freight factor is indicative.** It is taken from the UK government conversion factors for an average container ship, and is to be confirmed against the current year's table.
- **Module D stays the donor's.** A guard test proves no project figure includes it.
- **The six new families carry placeholder factors and prices** wherever the reference folder has no figure. Each Methodology row says which value stands in. Slate and ceiling tiles use the ICE V3 stone and steel factors; glulam uses ICE V3 softwood. Hollowcore reprocessing is 14% of the new factor, the middle of the 12 to 16% that cutting added in the Danish precast study.
- **The state version stays at 2 until stage 6.** One version bump and one dated "Updated on" notice cover all of round 3. Until then a `SEED_REVISION` in `looksValid` reseeds any sandbox stored before the current revision. Stage 1 set it to 1.
- **The deconstruction contractor is a role of its own**, which reverses the round 2 decision of "no new role".
  - Fennick Dismantling becomes a `Dismantling contractor` with the sample account Kofi Rennard, a contracts manager.
  - Surveying firms keep the stored type `Deconstruction contractor`, labelled "Surveying firm", and can still be appointed contractor.
  - The contractor's sidebar lists its appointed buildings with the contractor tabs. Its home counts the dates set and the dates still to set.

## Stage 2

- **Audits are owner-private records in their own store key, `audits`**, not World records. No buyer view reads them, and `auditPrivateStrings` is checked against every buyer view.
- **Who reads and writes them.**
  - The owner and the surveyor write both audits.
  - The deconstruction contractor reads the pre-deconstruction audit only. It says what comes out and where it goes; the pre-redevelopment audit is the owner's case for the design and stays with the owner and the surveyor.
  - The activity line and the notice of a pre-redevelopment audit leave the contractor out for the same reason.
- **One audit of each kind per building.** A complete audit is locked. Reopening it lets the auditor change it and complete it again, so there is one current version.
- **Completing needs every needed check.** The checks come from the GLA guidance, with the City of London additions on a City building:
  - options at different levels of intervention with carbon for each;
  - an independent reviewer;
  - at least 5 catalogued reuse items;
  - a condition band on each.
  Checks the guidance only recommends, such as a peer reviewer outside the City, do not block.
- **The demolition carbon default** is 50 kgCO2e per m2 of floor area demolished, spread over the option's GIA. It applies whenever an option gives no figure of its own, as in the City advice note.
- **The recovery forecast counts a reuse line's whole mass as recovered.** The share that cannot be reused still leaves the site for recycling. This is a reading, not a figure from the folder, and it is stated in the code.
- **Listing early makes private lots.**
  - "List reusable lines early" makes a private item and lot for each reusable line that can take a default specification, and marks surveyed lines as offered on Tallyard.
  - Steel and curtain wall lines without a surveyed item are left for capture, because their sizes decide the listing.
  - Nothing is published. The owner decides on Listings, as for any captured item.
- **The suggested reusable share** of an imported item comes from its recoverability: A 90%, B 70%, C 10%. This is a placeholder for the auditor to check, and Methodology says so.
- **The workbook is a spreadsheet only in this stage.** A Word version of the audit waits for the statement work in stage 6, which reuses the same document parts.
- **Seeded audits use fixed IDs** (`aud_tiv_pra`, `aud_tiv_pda`, `aud_har_pda`). They add no notification or activity line, so earlier counts on the homes and the inbox are unchanged.
- **The independent reviewer of the Tiverne House options** is a new fictional name pair in `names.ts`: Nadia Orrin of Ellery Carbon Review.
- `SEED_REVISION` is now 2.

## Stage 3

- **The contractor's records sit in their own store key, `contractorWork`.** It holds, for each building, the methods and the destination log, plus each firm's carrier register.
  - The records belong to the contractor the building has now. A new contractor starts with an empty log; the old one's records stay stored, unread.
  - The owner reads Destinations. The surveyor does not.
  - Buyers see neither. `contractorWorkPrivateStrings` is checked against every buyer view.
- **The destination log uses the demolition bill's own destinations** (reused, recycled, recovered, landfill, hazardous disposal), so the consultant's waste engine and the contractor's log speak the same words.
- **Shares are over non-hazardous tonnes**, as the London Plan target reads. Hazardous tonnes are shown on their own.
  - "Reused, recycled or recovered" counts everything but landfill and hazardous disposal.
- **The forecast from the audit splits each reuse line by its reusable share.**
  - The reusable part is reused on site or elsewhere, as its route says. The rest is recycled.
  - Waste lines go to landfill, or to hazardous disposal when the waste code is asbestos or the element is hazardous material removal.
- **Duty of care checks are indicative.** English waste law is not in the reference folder.
  - Each moved stream of waste needs:
    - an upper tier carrier, with a registration that was in date when the stream moved;
    - a receiving site, with its permit or exemption;
    - a transfer note, or a consignment note for hazardous waste.
  - Reused material is not waste, so it needs none of these.
- **The true cost of waste follows the site waste calculator's method.** Per tonne: handling, haulage, the receiving site's fee and landfill tax, rounded to pence as each amount is made, then VAT on the total.
  - Demolition arisings carry no purchase cost, as the calculator says.
  - Handling, haulage and fees are placeholders.
  - Landfill tax is £126.15 standard and £4.05 for inert codes, from 1 April 2025. It is indicative, to confirm against the current year.
  - Hazardous disposal pays the standard rate.
  - The two published site studies are cited as context, without the firms' names.
- **Title to the arisings is held at building level.** It uses the existing `arisingsTitle` field, which already drove the public seller type.
  - The seller is the owner, or the contractor once the owner passes title.
  - The seller sets visibility, the disclosure settings and public photos; answers requests; and shares with projects.
  - The owner keeps the building, its records and its audits.
- **Title passes only while no request waits**, so no buyer is left waiting on the wrong seller.
  - Decided requests stay with the organisation that decided them. A buyer's contact never passes to a later seller.
  - The projects the owner shared with keep their access: the contractor is added to their approvals.
- **While the contractor holds title it cannot be replaced.** The owner takes title back first.
- **The contractor's method shows on the item's page for the owner and the surveyor.** The owner gets no Method tab, which keeps the owner's tabs to nine.
- **Seeded records use fixed IDs.**
  - Fennick's three carriers include one lower tier carrier whose registration has expired, so the register shows its warning.
  - There are methods for ten of the eleven Tiverne House items. The bricks are broken out.
  - The destination forecast comes from the seeded audit. The asbestos stream is already weighed out, with its papers complete.
  - No notification or activity line is seeded.
- `SEED_REVISION` is now 3.

## Stage 4

- **Quality lives on the item, as an optional `quality` record in the world.** The public projection reads it. Items without a record read as before.
  - The record holds the family's checks, reject criteria, hazards, yield, processing and warranty.
  - For steel it also holds the provenance and assessment pathway.
- **For steel the record drives the four statuses.**
  - Saving it sets the test status and the usable grade, through `statusFrom` and `usableGrade`.
  - Test results from the Testing tab move the record on: an inspection to S1 at least; a test to S3 at least, with a certificate named after the request.
  - Traceable EN 10204 papers confirmed by NDT (P2 at S2) count as tested.
- **Provenance and assessment follow the literature review's scheme:**
  - P0 to P3 and S0 to S4;
  - the ADVANCE protocols A to D, testing none, one, three or every member of a group;
  - NDT alone is enough for EXC1 at any grade and for EXC2 below S355;
  - S355 at EXC2, anything at EXC3 or EXC4, and fatigue or seismic uses need S3;
  - consequence class 3 gets a note that the engineer sets extra testing.
- **The P427 screen routes steel made before 1970 to P440 rather than rejecting it.**
  - Fire, plastic deformation, section loss over 5% and members out of tolerance rule a member out.
  - Built-up members and fatigue-loaded members are admitted on a condition.
  - Steel that is not admissible, and any item that fails a reject check, cannot be shared or published.
- **Lead time by status is indicative:** S0 8 weeks, S1 6, S2 5, S3 2, S4 1. These are read from the DISRUPT toolkit's 6 to 8 weeks to recover, test and refabricate, and about a week in the lab.
  - It shows on a steel listing against the steel limits of the project being checked, from public facts only.
- **Grading guides follow the FCRBE grading table** for steel, timber, brick, stone, precast and raised floor.
  - The raised floor checks are the London audit's acceptance rules.
  - Other families carry guides written from the toolkit's candidate-family notes. Their yields are placeholders and say so.
  - Hazards are suggested by the building's age and only for the materials each can be found in.
- **Assurance by layer**, from the DISRUPT toolkit:
  - structure needs test proof;
  - skin needs inspection;
  - the space plan needs a warranty;
  - site work needs the seller's declaration.
  A warranty never stands in for test proof in the structure.
- **The public listing gains one key, `quality`, so it now has 22.** It holds the assurance tier, processing, warranty kind, the steel codes and confirmed hazards. It never holds notes, groups, certificate numbers, labs or warranty notes, and a privacy test proves it.
- **The provenance pack is a page for the client side of the project once the seller has accepted.** The client side may be an owner building something of its own.
  - It names the donor building, which the CEN technical specification needs in the test record.
  - Its custody events are derived from the existing records (capture, testing, the audit, the contractor's dates, stock and the acceptance), so nothing is entered twice.
  - It is never shown to the architect or the consultant.
- **The tested-for-reuse label is an SVG** built from public facts only: the public ID, title, status, steel codes, tester and date. It is offered once an item is tested or certified.
- **Steel limits sit on the project**, set by the architect on the Requirements tab. Merrowgate Wharf is seeded at EXC2, CC2, S355.
- **The seed records quality on Tiverne House:**
  - every steel member is at P1, S0, in four test groups, with red lead suspected;
  - the raised floor has four of its five acceptance checks;
  - the stone has been cleaned.
  No figure on any listing changes.
- `SEED_REVISION` is now 4.

## Stage 5

- **The recovery plan has nine routes.** They run from retain and relocate, through reuse on site, reuse elsewhere, upcycle, recycle and downcycle, to energy recovery and landfill.
  - Each maps to a Level(s) 2.4 route. The mapping is indicative and says so in Methodology.
  - The suggested route comes from the ranking and the pre-deconstruction audit's broker route. An item worth recovering is reused on site where the audit says so, else elsewhere. The rest go their family's usual way, from a London landowner's recommended routes by material.
  - The owner changes a route where the plan differs. Only those choices are stored, in a new `recoveryPlans` key, owner-private.
  - The plan is scored by mass against the score the same items would have under the RICS 2nd edition business-as-usual split for their material. The reuse gain is the tonnes reused beyond that split.
- **Each family has a cascade of uses, best first.** Steel follows the CIRCuIT programme's four strategies.
- **Design from stock lives on the Matching tab, for the architect only.** The client and consultant see what reaches the shortlist.
  - The schedule is stored on the project, in its existing `requirements`, with the settings in a new optional `stockMatch`.
  - The match is worked out on reading, from public listings the project can see and could reserve, so nothing of a seller's crosses.
  - An uploaded CSV is read line by line, and a bad line is named rather than thrown.
- **The matcher keeps its rule by default: one stock piece serves one member, and it is never cut into several (03 section F7).** Three options sit beside it:
  - **Cut to length.** A piece serves as many members as fit, and a last piece serves the members left over.
  - **Offcuts back to stock.** An offcut at least the minimum length (3 m by default, from a London scheme's specification for incoming steel) goes back to stock and serves shorter lines. Lines are processed longest first, and offcuts are used before a new piece is cut. The result splits offcut mass into back to stock and scrap.
  - **The 30% excess rule.** It counts both the offcut and a heavier section. When it is on, a piece more than 30% excess is passed over, and a line left unmatched says why.
  With no option set the result is identical to before, and a test proves it on the seeded schedule.
- **BIM matching stays in version 2.** Its card stays on the Matching tab, and the Help entry now says steel schedules match today.
- **Deal terms are proposed by the client with a request, not offered on the listing.** The public listing keeps its 22 keys.
  - The four models (client-driven, stockholder, hybrid, forward sale) come from the steel reuse supply chain study. Each sets who holds title, tests, stores and carries the warranty.
  - The terms are a deposit, the storage bridge (up to 36 months) and who pays it, a price lock, a design-change clause, a buy-back and a guarantee.
  - Every rate is a placeholder in Methodology.
  - A forward sale is only for a lot not yet out of the building. A design-change clause needs a deposit.
  - The request stores the terms and what they were costed on (`terms.offer`, `terms.base`).
- **The seller reads the terms through `toBlindTerms` until accepting.** It is a sibling of `toBlindBuyer`.
  - The storage bridge is shown in bands, so with the blind buyer's need-by window it says no more about the buyer's programme.
  - The cost base, which holds the buyer's timeline months, never reaches the seller before acceptance. A privacy test proves it.
  - Once accepted, both sides read the full terms and their cost.
- **Portfolio-first is a flag on a private lot: `portfolio`.**
  - A held lot is visible to projects whose client is the seller, and to their architect. It is not visible to any other project, and not on the marketplace.
  - Sharing or publishing the lot ends the hold.
  - Only the building owner holds lots, while it holds title. A lot that fails a reject check or the P427 screen cannot be held.
- **The owner allocates its own lot to its own project directly.** This is `allocateOwnLot`.
  - The reservation is accepted at once, with no request and no blind stage, since both sides are one organisation. Other waiting requests are declined, as on any acceptance.
  - Requesting your own lot is still refused, as in round 2.
- `SEED_REVISION` is now 5, for the new key. No seeded figure changes.

## Stage 6a

- **Specification v2 adds a reuse clause to each clause of the schedule, in the FCRBE factsheet 12 structure.** It is generated from the family's guides until the architect writes their own text. Its rows are:
  - the supply route;
  - location;
  - ranges and tolerances;
  - accepted patina;
  - operations on the batch;
  - acceptance, from the grading checks and reject rules;
  - surplus, from the grading guide;
  - storage;
  - the new fallback;
  - a marking line that keeps CE or UKCA marking for new products.
- **The schedule carries the selection pattern once.** It is the nine steps from the London specification with reclaimed clauses.
- **The architect's entries are stored per clause in `specs[projectId].clauses`.** Clearing a field returns it to the generated text. The spreadsheet gains a "Reuse clauses" sheet, and the main sheet is unchanged.
- **A clause's supply route is free issue once the client holds the item for the project, else the route in the client's pack.** The architect may set a clause's route.
- **The procurement pack is the client's, on a new Procurement tab.** It is stored in a new `procurement` key. Without a saved pack it reads:
  - the ambitious level, 5% by value;
  - the route: sourced by the contractor, or free issue once the client holds reserved material;
  - the clauses written for that route;
  - the works award weightings;
  - a 10% provisional sum, which is a placeholder.
- **The four supply routes and the responsibility matrix follow FCRBE factsheets 3, 4 and 12 and the London specification.** The routes are free issue, sourced by the contractor, through a dealer, and a reuse lot. The matrix says who buys, stores, prepares, tests, insures and is liable.
- **The clause library adapts the FCRBE model clauses.** It is labelled as needing UK legal review. The review clause carries the 15% cap.
- **Award templates come from FCRBE factsheet 15.** The split of each template's remaining weights is a placeholder, and Methodology says so. The client's own weights must be whole numbers, add up to 100 and weight reuse somewhere. The toolkit asks for a reuse criterion in every contract.
- **The price schedule lists the approved materials.** For each it gives the reclaimed range at the public low and high guide prices and the same new at the family's new price, plus a provisional sum on the guide total. The market consultation annex lists every material not declined, from public facts.
- **The pack exports as Word, through the statement's `docxParts`, and as a workbook with six sheets.** Both are built from the view only, and privacy tests reopen them.
- `SEED_REVISION` is now 6, for the new key.
