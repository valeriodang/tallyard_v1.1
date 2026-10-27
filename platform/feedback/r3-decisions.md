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
