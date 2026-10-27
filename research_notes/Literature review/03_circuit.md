# Literature review 03: CIRCuIT (Circular Construction in Regenerative Cities)

Documents D22, D23 and D38, all from the EU Horizon 2020 project CIRCuIT (grant 821201, 2019 to 2023, Copenhagen, Hamburg, Helsinki region and Greater London). Read in full. Line references (L123) are to each file. Formulas marked "implied" are this review's reading of a definition; the documents give definitions and units, not formulas.

---

## D22 Recommendations on circularity indicators (D3.3)

**Identity.**
- Authors: Ben Cartwright, Flavie Lowres, Eleanor Turner and Gilli Hobbs (BRE), with input from DTU, TUHH, HSY, Grimshaw and the City of Copenhagen. Submitted 31 January 2021 (L1-25).
- Method: a review of about 510 indicators, then more than 12 workshops with over 80 stakeholders, including the UKGBC circular economy forum (L239, L918, L942).
- Authority: medium to high. It predates the final GLA Circular Economy Statement guidance (2022) and gives no formulas.

**Summary.**
- The deliverable builds an indicator set at three levels: city, building, and material or product. It feeds a city circularity dashboard.
- Indicators are tagged to three indices: urban mining, lifespan and circular design. Each is "core" (a method and data exist) or "aspirational" (L223-224, L550-562).
- The final list has 10 city, 13 building and 11 material indicators, plus "enablers": passports, BIM, pre-demolition audits and logistics hubs. Enablers were judged useful but not measurable (L43, L2200-2205).
- Findings:
  - No existing set aggregates from material to building to city (L1179).
  - Few indicators can be updated through the life cycle (L1018).
  - Workshops asked for kgCO2e alongside circularity metrics (L2040-2048).
  - Stakeholders split on "potential" vs "actual" reuse (L2151-2156).

**Indicators.** The London vote column gives the London workshop's priority: H high, M medium, L low.

City level (L2226-2351):

| Indicator | Definition | Unit | London vote |
|---|---|---|---|
| Total material inputs | Virgin plus secondary inputs to the stock | t | H |
| Secondary inputs, recycled | Excluding downcycling | % | H |
| Secondary inputs, reused | Share of inputs reused | % | H |
| Transformation vs new construction | Buildings refurbished rather than demolished | % | M |
| Proportion of stock mapped | Tonnes by material type, from pre-demolition audits | t | High as an enabler |
| Reuse and recycling potential of stock | Material available in the stock | t | H |
| Total materials and wastes arising | All construction and demolition arisings | t | H |
| Recirculated within the city or region | Share of arisings entering new cycles locally | % | H |
| Through dedicated centres | Tonnes through hubs | t | High as an enabler |

Building level (L2365-2560):

| Indicator | Definition | Unit | Core or aspirational | London vote |
|---|---|---|---|---|
| Dematerialisation | Material avoided by design | % | Aspirational | H |
| Design for disassembly | Share reversible without damage, measured by ISO 20887 | % | Core | H |
| Design for adaptability | ISO 20887 | % | Core | H |
| **Reused content** | Share of the building formed of reused products, citing the GLA statement | % | Core | **M** |
| **Recycled content** | Excluding downcycling | % | Core | L |
| Transformation capacity | Score from 3 (monofunctional) to over 8 (fully transformable) | score | Aspirational | H |
| **Reuse potential** | % **by mass** reusable at end of life | % | Core | H |
| Recycling potential | % by mass | % | Core | M |
| Residual value | Forecast value of recirculated materials | £ or € | Aspirational | H, contested |
| Total arisings, whole life | Waste over the whole life | t | Core | M |
| % reused, remanufactured, recycled | Actual end-of-life fate | % | Core | H |

Material level (L2561-2740): dematerialisation; design for repairability; reused content and recycled content (% by mass); "product is reused after use" (% of similar products actually reused); reuse potential; take-back scheme (yes or no); repairability; **service life** in years, which tells "when the product needs to be considered for further testing"; residual value.

Enablers (L2752-2905):
- City level: incentives; public procurement; a city circularity database; skills.
- Building level: building passport and bill of materials; repair guidelines; BIM; the pre-demolition audit; a logistics centre.
- Material level: a material passport, which "must be in place to support any re-use", including a hazardous substances screen and a disassembly plan (L2876-2886, L4225-4253). Also taxes, and the affordability of reused products.

Dropped as indicators:
- Transport distance: part of whole-life carbon, and mode matters more (L3275, L3706).
- Building condition: "does not always dictate what happens to the building" (L3772).
- Product condition: "difficult to measure for some materials" (L4159).

**Informs Tallyard.**
- Validates: reused and recycled content as London-relevant core indicators; donor reuse potential; the waste bill split; tonnes arising; carbon alongside.
- Adds:
  - a mass basis;
  - reused and recycled content shown separately;
  - "actually reused" per family from completed deals;
  - service life per item, driving test status;
  - residual value per donor building;
  - a take-back flag.
- Tallyard's item records are exactly the bottom-up data D3.3 says no indicator set aggregates. The operator can roll them up to city level.

**Contradictions.**
- Basis: D3.3 measures potential and content by mass; Tallyard measures content by value.
- Downcycling: D3.3 excludes it from recycled content; Tallyard's content formula is silent on it and merges reused and recycled into one figure.
- Condition: D3.3 rejected condition as an indicator, so the A to C grade should stay a data field, not a KPI.
- London rated reuse potential above reused content.

**Gaps.** No calculation methods or boundaries yet (L2985-3000). Social value is weak. Residual value is contested. The material passport is undefined (L3819). Required data often does not exist.

**Feature ideas.**
- Indicator panel on both mass and value bases.
- "Actually reused" statistic per family.
- Service-life tracking that nudges testing.
- Donor residual value and reuse potential.
- Operator city roll-up.
- Passport export with hazard screen and disassembly method.

**Categories.** 9, 1, 2, 3, 8, 16, 17.

---

## D23 Documentation with audit result, inventory and demolition guide (D4.1)

**Identity.**
- Authors: Abis, Maubach-Howard, Bernhardt and others. Partners include TUHH, BRE, Lendager, Arkitema, the City of Vantaa, the Helsinki reuse centre and Grimshaw. Submitted 28 February 2022 (L9-22).
- Authority: high for audit method and medium for quantities. The template is aligned with the EU waste audit guidelines (2018), the BRE pre-redevelopment audit code and PARADE (L3513-3518), and was tested on 8 real demolitions.

**Summary.**
- The report develops and tests a pre-demolition audit template on two demolitions in each city. It argues that standard audits are hazardous-waste and EWC exercises that fail to describe reusable elements (L461-463, L4040-4060).
- It proposes three inventories (hazardous; non-hazardous reusable; non-hazardous recyclable), each compiled by different actors (L4057-4085).
- It also proposes "integrated demolition", tying the audit to the future design and to exchange portals (L3530-3810).
- City findings (L413-455):
  - Helsinki: brick reuse.
  - Copenhagen: participatory audits.
  - Hamburg: recycled concrete.
  - London: on-site crushing, reclaimed timber glulam, and the reuse terminology problem.
- It ends with 14 lessons and a checklist and template.

**Audit method.**
- EU baseline (L838-936):
  1. Desk study: history, drawings, maintenance and renovation records, age for hazards, access.
  2. Field survey: inspection, sampling, condition, reuse possibility, photos.
  3. Inventory: type, quantity, EWC code.
  4. Recommendations.
  5. Report with an elements inventory showing "quantity, quality conditions and potential reuse rate".
- Must contain (L1847-1882): ownership and location, a hazardous inventory, and a management route per material. It should also cover elements that never become waste, have no size threshold, start early and assess refurbishment.
- CIRCuIT chronological checklist (L7180-7240):
  1. Project details and stakeholders.
  2. Desk study, with a draft digital inventory shared before the site visit.
  3. Field survey, including storage areas or final destinations for reclaimed materials, and sorting stations.
  4. The three inventories.
  - The report is signed by the auditor; third-party review is advisable (L7303-7304).
- BRE London report structure (L6176-6344):
  - description;
  - **feasibility of refurbishment**;
  - methodology, with **"estimates and margins of error"**;
  - findings per material with recommendations and waste contractors;
  - reclamation advice (reuse near the site, keep items together, advertise);
  - a **comparison of actual arisings with forecast**.

**Inventory fields.**
- Project details (L7330-7360):
  - owner contact and project ID;
  - address and building type;
  - **historical use**;
  - year of construction and year of reconstruction;
  - gross area, **volume** and floors, including **basements**;
  - structural system;
  - **extent of demolition**;
  - dates.
- Authors (L7370-7395), desk study register (L7400-7415), field survey with methods and **limitations** (L7420-7445).
- Hazardous inventory: substance, EWC code, location, element, component, material, dimensions, density and weight (L7471).
- Reusable inventory (L7490-7550):
  - hierarchical ID (A.1 to Z.n);
  - location, element, component and material;
  - quantity and dimensions, with computed area, volume and mass;
  - **analysis type and result**;
  - **extractability**, **quality**, **market value** and **material score**;
  - **management**;
  - **legal requirements** (transport, storage).
- Rules (L4375-4540):
  - The reusable tab deliberately omits EWC codes.
  - A density table is given (concrete 2.4, brick 1.7, glass 2.5 t/m3; the carpet and EPS values look wrong).
  - Homogeneous groups include handedness; doors and windows need hinge and handle positions so items can be "digitally replicated".
  - Proof of non-hazardousness.
  - Binders cause breakage.

**Scoring** (Table 8, L4569-4790):
- Extractability, quality (for like-for-like use) and market value are each scored 0 to 4.
- Extractability is set by the **demolition contractor**.
- Material score = (E + Q + MV) / 12. The worked example scores 4, 4 and 0 at 67%.
- The score is diagnostic: it shows which factor limits circularity. Perfect material with no market value means virgin prices are the obstacle.

**Results.**
- Helsinki: audits estimated 900 and 1,200 t of bricks. They were not used because no reuse site was found in time and there was no storage; vandalism limited salvage (L2790-2810, L3701, L5060).
- Copenhagen:
  - Trusses, cladding, bricks and tiles were reused on the same site (L2885-2925).
  - The element inventory separated 6 t of hardwood cladding from 12 t of structural hardwood, where a standard audit would have one wood line (L4302-4325).
  - Simulated carbon savings against new (L3056-3060): doors 80%, bricks 78%, wooden floors 77%, roof tiles 96%, windows 97%, concrete 1.4%.
  - PCB transfer study (L5433-5440).
- Hamburg: mixed concrete waste was still the largest stream (L5560-5580).
- London 1 (Hounslow retail warehouse, 1987): an adaptable bolted steel frame, but no off-taker for relocation (L3268-3342).
- London 2 (One Leadenhall Street, 1980s concrete frame):
  - **40% "reused", meaning recycled aggregate**, and 60% recycled, with 0.38 t landfilled (L3354-3368).
  - Retaining the basement would cut concrete waste 20% and steel waste 11% (L3556).
  - Steel barriers in good condition went to recycling because of bespoke sizes and no storage (L5854-5860).
  - Asbestos mastic in pre-1980s ducting (L5997-6013).
- London 3 (glulam from reclaimed timber): removal took no longer; one batch was hazardous with no visible sign; minimum length 0.5 m, ideally 1.5 m or more (L5930-5960).

**Deconstruction guidance.**
- Bricks: about 15 seconds each to remove, with cleaning slower. Know the reuse site before dismantling (L4975-5030).
- Timber: cut on agreed lines and store covered and ventilated (L5370-5380).
- Concrete: crush to recycled aggregate under the WRAP protocol; stockpiles may need a permit (L5768-5805).
- Metals: reuse first, following the SCI 2019 protocol (L5836-5915).
  - Four strategies: relocate, cascade, reshape, remanufacture. Relocate and remanufacture keep the most value.
- Timber in London: the waste producer must prove the timber is non-hazardous (duty of care), and the receiver needed a waste exemption (L5930-6065). EWC codes cannot tell a joist from chipboard.
- Reuse operator lessons (L5096-5200):
  - Gaps: timing, contracts, vandalism.
  - Remedies: a reuse slot before demolition, reuse goals in contracts, named owners for each task.
  - A pop-up sale saved 20 tCO2 (L5192).

**Lessons** (L6460-6640):
- Mandatory audits without size thresholds.
- Audits triggered by end of use and handed to contractors at tender.
- Participatory site visits; element-level detail.
- Targets that separate reuse from downcycling.
- Storage, data transparency, contracts that assign time, cost and responsibility, incentives, exchange platforms, digital logbooks.

London specifics:
- Audits are driven by BREEAM and the Circular Economy Statement, and are run by the contractor's environmental manager (L5735-5750).
- The statement includes a mandatory audit requirement that could cascade to boroughs (L6979-6985).

**Informs Tallyard.**
- Validates the core proposition: users need detailed product information that demolition reporting lacks (L636-640). Geometry to "digitally replicate" items matches Tallyard's DXF, OBJ and IFC exports.
- Answers what an audit must contain.
- Roles:
  - extractability belongs to the contractor;
  - the reusable inventory is co-authored by architect, developer and contractor;
  - reuse consultants translate between parties.
- Materials are legally waste once demolition is imminent, and the producer holds the duty of care (L5411, L5936).

**Contradictions.**
- **Reuse inflation:** London contractors count reprocessing and downcycling as reuse (L2455-2460). Tallyard's "reused" waste rows will be filled this way unless defined and checked.
- The 95% diversion aim is met easily, so it does not distinguish projects.
- CIRCuIT uses 0 to 4 scales owned by different roles; Tallyard uses 3-level grades set by the surveyor.
- The Copenhagen savings (77 to 80%) would read Low or Medium in Tallyard's band.
- D4.1 cites the London Plan 2016; use SI 7 (2021).
- **Audits in London are often done in-house by the demolition contractor,** although BRE warns of commercial influence (L1760-1765, L5740-5745).

**Gaps.** No audit cost or duration. Density table incomplete. No method to reconcile forecast and actual arisings. Who pays for reuse preparation is unclear.

**Feature ideas.**
- Audit module mirroring the template.
- Contractor-owned extractability with a material score and a "limiting factor" badge.
- Hazard evidence per item.
- Forecast vs actual report.
- Retention feasibility and partial-retention scenarios.
- Participatory open-house flow.
- Storage plan and destination per item.
- Reuse-operator slot.

**Categories.** 6, 7, 15, 2, 4, 5, 10, 11, 17, 18.

---

## D38 Circular construction in regenerative cities: insights from the CIRCuIT project (final report)

**Identity.**
- The 31 partners, with London chapters by ReLondon. Covers 2019 to 2023 and is "subject to the final approval of the European Commission" (L85-104).
- Authority: medium to high. Most numbers come from single demonstrators. The report says the audit template was tested on 12 projects (L1497); D4.1 says 8.

**Summary.** Six chapters: transformation, urban mining and reuse, design for disassembly with a return on investment method, data and indicators, policy, and digital tools. Appendices list 36 demonstrators and 26 business cases (L208, L361, L4765-4790).

**Reuse barriers** (L1154-1172):
- supply and demand mismatch;
- lack of trust, "with insurance providers often declining to underwrite reused materials";
- no standard way to identify and report reusable materials.

**Audit recommendations** (L1380-1428):
- make audits standardised, digital, mandatory and public;
- rename them "urban mining audits";
- replace "current Excel models";
- split the audit into an owner's pre-tender assessment and a contractor's offer.

**Demonstrators with numbers.**

| City | Result | Lines |
|---|---|---|
| Copenhagen | The Stack: 58% reused glulam gave 47% less carbon and 12% less cost | L4936 |
| Copenhagen | Adaptable housing: 85% reuse potential | L1903-1915 |
| Hamburg | Gröninger Hof saved 321 t of material, 186 t of waste and 74 t CO2 at 4.2% lower cost | L819-821 |
| Hamburg | Best recycled aggregate 55% cheaper than virgin | L5046 |
| Helsinki | Bricks sorted by colour and ultrasonic pulse velocity; only the lab gives accurate strength and frost results | L1297-1310 |
| London | Glulam from secondary timber met structural standards; non-destructive stiffness correlated with destructive tests; lengths of 1.5 m or more | L1330-1362 |
| London | Relocating a 1980s retail frame was modelled at up to 1,200 t CO2 saved, with 47% less whole-life carbon and 15% less capital cost; replication across Greater London about 400,000 tCO2 | L928-933, L4971-4974 |
| London | Albion Street / The Hithe: 6% more to build, 23% lower whole-life cost; 90% reusable after allowing 5% disassembly loss and 5% wear | L1998-2016 |

**Economics.**
- Steel frame:
  - deconstruction costs **£50/t more** and resale brings **£80/t more**;
  - with a **20% cutting loss** reuse is **8% dearer** than business as usual (L1616-1619, L1728-1730).
- Timber deconstruction adds 15% to contractor costs (L1672).
- Investigating reusable materials was about 10% of the cost of glulam reuse, and the total was still 12% below new (L1678-1679).
- Bricks taken down by excavator were 24% cheaper than virgin; by hand tools, 69% dearer (L1620-1625, L5006-5007).
- Hamburg hubs accept material at prices at least 25% below recyclers (L3943).

**Policy menu** (L3440-3540):
- Carbon assessment of demolition versus retrofit before a permit.
- **A minimum time between demolition permit and demolition.**
- An audit before demolition.
- A reuse percentage in demolition permits.
- **The licensed waste hauler named in the permit.**
- **Audit information made public.**
- Reclaimed content in new-build permits.
- Bonus floor area for circularity.

**Procurement** (L3638-3760):
- Use minimum requirements rather than award criteria.
- For demolition: an audit, staff training, **a storage plan for recovered elements**, and a reuse plan before demolition.
- For construction: future use, lifespan per layer, disassembly, and an LCA of at least three disassembly options.

**Tools** (L4300-4600):
- **Material Reuse Portal**, a London prototype that aggregates listings from several marketplaces. Lessons: aggregation is of great interest; users want real-time demand; small platforms are hard to connect (L4350-4390).
- Circularity Dashboard with five indicators (L4413-4424), plus an atlas, a citizen portal, a wiki and data templates.

**London.**
- Audits are not the norm; they are done for BREEAM or the Circular Economy Statement (L1460-1470).
- Roadmap with ReLondon (L4060-4180):
  - statement data into the Planning London Datahub;
  - audits standardised in the statement template;
  - **audit and targets at pre-application**;
  - **audit data uploaded to a city-wide exchange portal**;
  - required reused and recycled shares in new build;
  - **the bill of materials as a demand signal on the portal**;
  - **passports on completion**, first for 20% and then 80% of furniture, fixtures and equipment (most likely what "FFE" means);
  - statements extended through boroughs.

**Informs Tallyard.**
- The London roadmap describes Tallyard's niche almost exactly: audit data flowing to an exchange, with recipients' bills of materials as demand.
- First published London steel deconstruction economics.
- Brick method dominates cost.
- About a 10% transaction cost for investigating materials.
- Forecast-vs-actual workflow, since current estimates "are flawed" (L5029-5031).

**Contradictions.**
- Reused and recycled content are given "% by mass" (L3086-3096).
- The audit count differs between documents.
- Hounslow relocation is presented as chosen, but D4.1 says no off-taker was found: treat the savings as modelled.
- Whole-frame relocation is a building-scale route that Tallyard's item model does not represent.

**Gaps.**
- A method for reuse potential from available data (L2782-2790).
- LCA and life-cycle cost for urban mining.
- A "golden thread" from product data to deinstallation (L2865-2875).
- A live database of stocks, flows and sale prices (L2896-2905).

**Feature ideas.**
- Export to the London statement template and the datahub.
- Aggregator feed and inbound bill-of-materials demand.
- Deconstruction economics calculator.
- Passport at handover.
- Demolish-or-retain carbon check.
- Hub directory with acceptance pricing.
- Operator city dashboard.

**Categories.** 15, 2, 6, 9, 17, 16, 11, 12, 18, 13, 10, 1, 8, 7, 4, 5.

---

## Batch synthesis

### Top findings

1. **Tallyard can replace the pre-demolition audit in its current form.** Audits today are hazardous-waste and EWC exercises held in spreadsheets. CIRCuIT asks for element-level, dimensioned, rated inventories, delivered digitally and early, which is Tallyard's granularity.
2. **Three inventories with different owners.** The hazardous inventory sits with the auditor or contractor; the reusable inventory with architect, developer and contractor jointly; recyclable bulk with waste managers.
3. **Three 0 to 4 scores, with extractability owned by the contractor.** The material score diagnoses what limits reuse rather than only ranking items.
4. **Reuse inflation is real in London.** Define reuse and check reuse rows.
5. **Timing and storage decide outcomes more than technique.** That means an audit at end of use, a reuse slot before strip-out, a known destination before dismantling, and a storage plan in tenders.
6. **Steel economics are marginal and sensitive to loss:** £50/t to deconstruct, £80/t more on resale, and 8% dearer after a 20% cutting loss.
7. **The indicator consensus** covers reused content, recycled content excluding downcycling, potential by mass, actual fate and arisings, with carbon alongside. Residual value is contested.
8. **London policy is heading towards Tallyard's model:** standard audits, pre-application targets, an exchange portal, a demand signal and passports.
9. **Trust and liability:** insurers decline, hazards can be hidden, and materials are legally waste at demolition.
10. **What the demand side needs:** dimensions, geometry and properties, and predictable supply, because "what is available today may be sold tomorrow".

### Inventory fields Tallyard's capture lacks

| Level | Field | Evidence |
|---|---|---|
| Building | Owner contact; project ID; historical use; refurbishment history; volume; basements; extent of demolition; retained elements | D23 L7330-7356 |
| Building | Feasibility of refurbishment; effect of partial retention on arisings | D23 L6188-6195, L3556 |
| Audit | Auditor, report date, third-party reviewer, signature | D23 L7370-7395, L7303 |
| Audit | Desk study document register; field survey methods and limitations; margins of error; stakeholders invited | D23 L7400-7445, L6206 |
| Site | Storage areas, final destinations, sorting stations, waste facilities | D23 L7215-7225 |
| Item | Hierarchical ID; element, component and material split; density used and its source | D23 L7495-7500, L4420 |
| Item | Homogeneous group, handedness and hardware positions | D23 L4475-4483 |
| Item | Extractability (contractor), quality and market value (0 to 4); material score | D23 L4569-4790 |
| Item | Analysis type and result; proof of non-hazardousness; contamination type; binder or fixing type | D23 L4503-4540 |
| Item | Management route; legal requirements; storage requirement and location; deconstruction method and time; cutting lines; keep-together groups; off-taker identified | D23 various |
| Item | Service life | D22 L2719-2730 |
| Item | Waste or product status; duty-of-care holder; carrier licence | D23 L5411, L5936; D38 L3491 |
| Outturn | Actual quantity per item and stream against forecast | D23 L6344; D38 L5029 |

### Proposed indicators

**Consultant dashboard**
- Reused content by mass and by value.
- Recycled content excluding downcycling.
- Donor reuse potential (items above a threshold on extractability and quality).
- Recycling potential.
- Actual % reused, remanufactured and recycled, with aggregate excluded from reuse.
- Arisings per m2.
- Diversion.
- Audit forecast accuracy.
- Coverage of hazard evidence.
- Material score profile.
- Residual value.
- Avoided carbon.

**Client dashboard**
- Reused content against the 20% aim.
- Avoided carbon and upfront carbon per m2.
- All-in net cost against new, including about 10% transaction cost.
- Supply certainty.
- Design for disassembly of the new building (ISO 20887; The Hithe benchmark 90%).
- Lifespan per layer.
- Return on investment for design for disassembly.

**Operator**
- Stock mapped.
- Potential of mapped stock.
- Throughput of hubs.
- Recirculated within London.
- Average donor age.
- Actual reuse per family.

### Gaps
- No indicator formulas.
- No audit costs or accuracy data.
- Nothing on steel test regimes beyond the SCI reference.
- Title and insurance unresolved.
- The carbon method behind the Copenhagen figures is not stated.
- No London demand data.
- Social value weak.
- Passport undefined.
- **Nothing on curtain wall, precast or stone cladding.**

### Feature ideas, ranked
1. Audit module aligned with CIRCuIT and BRE.
2. Item scoring with a limiting-factor flag.
3. Hazard evidence per item.
4. Reuse integrity guard on the waste bill.
5. Deconstruction contractor workspace.
6. London statement and portal integration.
7. Indicator panel on mass and value.
8. Deconstruction economics calculator.
9. Waste or product status and chain of custody.
10. Passport at handover.
11. Retention-first check.
12. Participatory open house and reuse-operator slot.
13. Storage and hub directory.
14. Operator city roll-up.
15. Capture prompts per material.
