# The literature backs Tallyard's model, but its numbers, test logic and compliance outputs need rebuilding

## Summary

The reference literature, 52 documents and 29 images, supports what Tallyard is for. Every strand points to the same gap:
- London policy studies;
- an owner's practice guide;
- EU research projects;
- regional strategies.

Reclaimed structural and facade materials have no easy-to-procure market. Supply and demand are out of step in time. Owners, consultants and contractors still pass audits and statements around in spreadsheets. The CIRCuIT project's London roadmap even describes Tallyard's niche:
- audit data flowing to a city-wide exchange;
- recipients' bills of materials as a demand signal;
- passports at handover.

The literature also shows where the tool is thin or wrong, in four areas.

**1. Steel test status is built on the wrong axis.** The European protocols (CEN/TS draft, Swedish MVR, Norwegian, PROGRESS) decide how much testing a reclaimed member needs from three things:
- its provenance and documents;
- its age;
- its execution class.

They then test in groups of 0, 1, 3 or all members. Tallyard's four statuses and per-piece test fees capture none of this.

**2. Several placeholder values are now contradicted or confirmed by sources.**
- The 20% discount for reclaimed steel is described as already net of rework and testing, so adding testing on top double counts it.
- The reclaimed steel carbon factor is confirmed by an EPD (46.6 kgCO2e/t).
- The raised floor factor is confirmed by an architect's study (29 to 42 kgCO2e/m2).
- Stone and precast price ratios look wrong.
- **Curtain walling has no evidence at all.**

**3. The compliance outputs need more structure.** A real London sustainability statement, an owner's passport protocol and two European reporting methods show what consultants expect:
- numbered commitments in minimum, target and aspiration tiers;
- a BREEAM tracker with a safety margin;
- versioned benchmarks;
- reuse kept separate from recycling;
- mass reported beside value;
- a guard against contractors logging crushed hardcore as "reuse".

**4. Roles and documents that real projects use are missing.** The deconstruction contractor holds title in some models, scores extractability and updates the owner's demolition tracker. The structural engineer signs off reclaimed steel. Recertification, warranty and insurance status decide whether a client will buy. That last point matches the finding that the binding barriers are trust and liability, not technology.

**What is missing from the folder.** The primary sources the compliance wedge rests on are absent:
- the GLA Circular Economy Statement guidance and its template spreadsheet;
- London Plan policy SI 7;
- the draft 2026 London Plan;
- SCI P427 and P440;
- the RICS and IStructE carbon methods;
- the BREEAM V7 manual.

Also missing: any UK prices for testing, storage, handling and haulage, and anything at all on curtain wall or precast cladding reuse.

**What to build.** The report ranks 17 feature ideas in three tiers. Tier 1:
- a steel assessment pathway;
- a pre-demolition audit module with a contractor workspace;
- compliance upgrades for the consultant;
- per-family grading and hazard screening;
- a specification and procurement pack;
- a provenance and assurance pack, including a visible "tested for reuse" label.

None was built in this pass.

The detailed notes, with line references for every claim, are in `research_notes/Literature review/`. The full register of files is `00_corpus_register.md`.

## 1. The corpus and how it was read

The user added 84 files to `reference literature/` on 27 October 2026:
- 51 PDF text extractions;
- 4 saved web pages;
- 29 images.

Three text files are duplicates or partial copies:
- a second copy of the Arup and Ellen MacArthur Foundation report;
- a re-extraction of British Land's strategy;
- the first 798 lines of the Re-Use Atlas.

That leaves 52 unique documents.

**How it was read.** Every document and image was read in full, either directly or by parallel reading passes. Each pass followed the same template:
- identity and authority;
- summary;
- key content with line references;
- what it informs in Tallyard;
- contradictions;
- gaps;
- feature ideas;
- categories.

Large reports were read section by section, with searches for figures and tables. Where PDF extraction scrambled a table, the notes say so rather than guess.

**What it covers.**

| Type | Count | Examples |
|---|---|---|
| EU research deliverables and toolkits | 9 | ADVANCE D2.1; three CIRCuIT reports; five FCRBE reports |
| UK industry guidance and toolkits | 17 | Nine DISRUPT steel notes; BCO; UKGBC; Zero Waste Scotland tools |
| London practice documents | 5 | British Land strategy; a sustainability statement; a site waste management plan; NLA report; a pre-redevelopment audit example |
| Policy, finance and advocacy | 9 | ACAN, Don't Waste Buildings, Standard Chartered, two regional strategies, BBP, BS 8001 flyer, Circular Buildings Coalition reports |
| Peer-reviewed papers | 3 | A 2020 review, a 2025 survey, a 2025 policy study (abstract only) |
| Books and case collections | 3 | Re-Use Atlas; 32 FCRBE project sheets; Danish Ressource Blokken |
| Web pages and marketing | 6 | Fit-out guides, campaign pages, toolkits |

**Two skews to keep in mind.**
- The technical and case evidence is strongest from Belgium, France, the Netherlands and Denmark. London practice rests on five documents.
- Prices are mostly in euros from 2019 to 2021, from small samples.

## 2. Knowledge map

The knowledge sorts into 18 categories. Document IDs refer to the register (D01 to D52, I01 to I29).

| # | Category | Main documents | Depth |
|---|---|---|---|
| 1 | Circular economy principles | D14, D18, D20, D35, D46, D48; D16 glossary; image I05 | Good, generic |
| 2 | Policy and regulation | D12, D21, D25, D34, D14 (Scotland), D51 (West Midlands), D07, D31 | Secondary for London; **no GLA primary text** |
| 3 | Standards and certification | D16 (EN 1090, CEN/TS, CPR), D27 (EN product standards), D34 (BREEAM 2018), D18 | EU standards strong; BREEAM V7, LEED and RICS texts missing |
| 4 | Structural steel reuse | D02 to D11, D16, D27, D21, D41 | **Strongest area** |
| 5 | Material-specific technical guidance | D27, D49 (precast), D41 (glass, aluminium, raised floor), D50 | Good for brick, stone, timber, raised floor; **none for curtain wall or precast cladding** |
| 6 | Pre-demolition audit and inventory | D23, D16 (PROGRESS template), D41 (tracker), D13, D12, D34 | Good |
| 7 | Deconstruction and site waste | D23, D32, D42 to D45, D02, D27 | Good |
| 8 | Carbon and LCA | D06, D16, D39, D27, D36, D49, D21, D41 | Factors scattered; RICS and IStructE methods missing |
| 9 | Circularity indicators | D22, D39, D16 (Level(s), BRE, PROGRESS), D14, D17, D21 | Good |
| 10 | Procurement, contracts and specification | D52, D27, D41, D15, D40, D47 | Strong for EU; UK law missing |
| 11 | Business models, supply chain and storage | D10, D02, D40, D21, D48, D51, D11 | Qualitative; **no UK rates** |
| 12 | Finance, valuation, insurance and warranties | D11, D29, D33, D25, D40, D37 | Concepts good; no UK products or prices |
| 13 | Owner and developer practice | D41, D17, D34, D50, D21 | Good for London |
| 14 | Fit-out | D36, D28, D50, D30 | Moderate |
| 15 | Case studies | D24, D21, D16, D38, D48, D49 | Good, mostly EU |
| 16 | Design for disassembly and design from stock | D26, D48, D49, D16, D13 | Good |
| 17 | Data, digital tools and passports | D41, D16, D22, D33, D51 | Moderate |
| 18 | Market and economic barriers | D37, D11, D06, D25, D31, D21 | Good, qualitative |

## 3. How each document informs the tool

Tool areas:
- **CAP** capture and inventory;
- **AUD** donor building and audit;
- **REC** recovery plan and decision tree;
- **LST** listings and privacy;
- **MKT** marketplace and material page;
- **SPC** specification and geometry;
- **RES** approvals, reservations, deals and package costs;
- **TST** testing and assurance;
- **LOG** storage and logistics;
- **CO2** carbon engine and factors;
- **SUS** goals, requirements, certification and the Circular Economy Statement;
- **WST** waste bill;
- **BIZ** business model and operator;
- **REF** families and prices;
- **NEW** new roles or families.

| ID | Document | Areas | What it changes in Tallyard |
|---|---|---|---|
| D01 | Benachio et al. 2020, systematic review | CO2, CAP | Module D is only 3 to 4% of LCA results, so never netting it off is right. Seven data categories give an item completeness score |
| D02 | DISRUPT business considerations (ASBP 2023) | CAP, TST, RES, BIZ, LOG, NEW | P427 admissibility at capture. 70% yield, cut 1 m from connections, lengths 3 to 12 m. 6 to 8 weeks to recover, test and fabricate. Title depends on supply model. Warranty chain. £40/t set-down. Prime, then A to E grades |
| D03 | DISRUPT guidance note 1 | REF, RES | The 20% saving is net of rework and testing |
| D04 | DISRUPT guidance note 2 | CAP, TST | Inspect, test, blast, refabricate, mark; visual grades |
| D05 | DISRUPT guidance note 3 | CAP, BIZ | Seen or concealed quantities; hybrid supply; buy early |
| D06 | DISRUPT literature review | CO2, REF, CAP, TST | EMR EPD 46.6 kg/t; new £428 to £1,307/t; scrap £65 to £350/t; reclaimed 3 to 10% dearer (Dunant). P427 data schema; hazardous coatings; destination limits |
| D07 | DISRUPT policy note | SUS | Policy hooks for audits and procurement |
| D08 | DISRUPT scenario mapping | CO2, LOG | 1.693 tCO2e/t avoided; about 4 m2 of storage per tonne |
| D09 | DISRUPT stakeholder checklists | RES, NEW | Deal readiness checklist; missing roles. Role matrix lost in extraction |
| D10 | DISRUPT supply chain models | BIZ, RES | Deal model selector: client-driven, stockholder, hybrid |
| D11 | Circular Buildings Coalition, Building confidence (2025) | TST, RES, BIZ | Assurance tier by layer; platform guarantee pattern; process attestation; futures |
| D12 | ACAN policy campaign (2025) | SUS, AUD | Policy watch; audit in the tender; % retained by stage; arisings database |
| D13 | Materials reuse evaluation example (2024) | AUD, REC, CAP | Audit card format; reuse potential, demountability and value; a worked upcycle cascade |
| D14 | Circularity Gap Report Scotland (2022) | SUS, REC, LOG | Scotland requirement entry; cycling definitions; planned hubs |
| D15 | Product-as-a-service white paper (2024) | LST, SPC, BIZ | Legal owner and take-back fields; clause library; IFRS 16 check |
| D16 | ADVANCE D2.1 (2024) | TST, CAP, REC, CO2, AUD | Protocols A to D, group sampling, EN 10204 3.1. CEN data list. Level(s) 2.4 coefficients. EU used-product rules. Glossary. Audit template |
| D17 | BBP briefing (2025) | SUS, CO2 | Owner circularity score (40%, rising to over 60%); owner reuse figures; green lease yield-up |
| D18 | BS 8001 flyer | SUS | Framework language; competition and liability pointers |
| D19 | Circular Buildings Toolkit page | | Landing page only: a gap |
| D20 | UKGBC explainer | Help | A materials marketplace is a named enabler |
| D21 | NLA Circular London (2023) | SUS, CO2, RES, LOG, MKT | Statement = table + written statement; policy watch; London cases; 30% excess rule; CE-MVR; futures; exchanges; storage strategy |
| D22 | CIRCuIT indicators (D3.3) | SUS, operator | Core indicators: reused and recycled separately, potential by mass, service life, residual value, city roll-up |
| D23 | CIRCuIT audit template (D4.1) | AUD, CAP, WST, NEW | Three inventories; extractability, quality and value scores; reuse inflation; forecast against actual |
| D24 | FCRBE 32 project sheets | MKT, SUS | Case library and carbon cross-checks |
| D25 | Don't Waste Buildings (2025) | SUS, BIZ | No UK fiscal incentive; VAT gap; Scope 3 reporting from 2027 |
| D26 | UKGBC design for deconstruction | SPC, SUS | Disassembly principles by RIBA stage |
| D27 | FCRBE material sheets | REF, CAP, TST, LOG, SPC, NEW | Grading, tests, storage and prices per family; new families; nothing for curtain wall |
| D28 | End Cat A lighting campaign | NEW | Luminaire family; Cat A carbon |
| D29 | Lignum (2026) | RES, TST | Chain of custody; warranty versus guarantee |
| D30 | Oktra refurbishment guide | MKT | Fit-out lead time as a supply signal |
| D31 | Corsini (2025), abstract only | Strategy | 12 leverage points; full paper needed |
| D32 | Museum Street site waste plan | WST, NEW | Carrier register; diversion by volume and mass; waste per 100 m2; targets above policy |
| D33 | Standard Chartered (2025) | BIZ, SUS | IFC lists marketplaces as eligible; lender reporting parameters; risk scorecard |
| D34 | 7 Millbank sustainability statement (2021) | SUS | Statement structure; policy table; BREEAM tracker; three-tier commitments; waste benchmarks |
| D35 | Zero Waste Scotland nine strategies | Help | Generic strategies |
| D36 | AHMM Fit out, rip out (2024) | CO2, NEW, MKT | Raised floor 29 to 42 kgCO2/m2; replacement rates; lease lengths give a supply forecast |
| D37 | Griffiths et al. (2025) | LST, RES | 62% see insurance as a barrier; insured reclaimed materials 20 to 30% cheaper; contract templates |
| D38 | CIRCuIT final report | AUD, SUS, BIZ | London roadmap; steel and brick deconstruction economics; policy menu |
| D39 | FCRBE ex-post analysis | SUS | Mass rates per layer; target bands; conversion defaults |
| D40 | Arup and EMF (2020) | BIZ, RES | Residual-value futures at 50% of original cost, break-even at 33%; performance contract terms |
| D41 | British Land (2024) | SPC, SUS, AUD, LST, NEW | Passport protocol; demolition tracker; deconstruction tender; targets under 500 and 275; portfolio-first reuse |
| D42 | CWIC user guide | WST | True cost of waste; condition classes |
| D43 | Lovell case study | WST | True cost about £389 per m3 |
| D44 | Site Waste Reduction Protocol | CAP | Waste status changes with ownership (Scotland); grade wording |
| D45 | Kier case study | WST | True cost about £472 per m3 |
| D46 | Circular business toolkit | Onboarding | Seller quality mark analogue |
| D47 | Olympic Park learning legacy (2011) | SUS, SPC | Origin of the 20% by value aim; output-based specifications |
| D48 | Re-Use Atlas (2017) | MKT, SPC, REC, BIZ | Design from stock; price ceiling about 50% of new; Hub 67 risks; buy-back |
| D49 | Ressource Blokken (2021) | NEW, TST, CO2, REC | Precast reuse tests and downgrades; cutting 12 to 16% of carbon; preserve, reuse, upcycle |
| D50 | BCO Circular economy in offices (2022) | SUS, NEW | No speculative Cat A; pre-tender testing; raised floor recertification |
| D51 | West Midlands routemap (2021) | SUS, LOG | West Midlands entry; planned hubs, platform, passports |
| D52 | FCRBE procurement strategies (2022) | SPC, RES, SUS, BIZ | Clause pack; award criteria; routes; who pays testing; specification structure; report indicators |
| Images | 29 images | TST, CAP, REC, SUS | ADVANCE protocol charts and data lists; Level(s) coefficients; reuse-by-connection table; the "Not what Tate said" note; the "circularity stamps" idea |

## 4. Evidence against current reference values

Files are under `platform/src/domain/reference/` (mirrored in `src/domain/reference/`).

| Value | Now | Evidence | Recommendation |
|---|---|---|---|
| Steel, new carbon (`families.ts`) | 1.74 t/t, published | 1,740 kg/t (BCSA and SCI), labelled "A1 only" by DISRUPT; EU database range 1.41 to 4.76 | Keep; confirm the module basis in the source |
| Steel, reclaimed carbon | 0.05, indicative | EMR EPD 0.0466 (A1 25.5, A2 13.4, A3 7.7) | Cite the EPD |
| Steel, new price | £1,000/t, placeholder | £428 (2016) to £1,307 (2022) per tonne | Dated, indexed value; mark indicative |
| Steel, base reuse ratio | 0.8, founder assumption | 20% saving net of rework and testing; Dunant 3 to 10% dearer; ADVANCE case 0.77 all-in; EU dealers €850 to €1,080/t | Keep 0.8 as an all-in benchmark; **do not add testing on top in buyer comparisons** |
| Steel, scrap floor | £220/t | £65 to £350/t (2016 to 2022) | Index it |
| Recovery premium | £90/t | £40/t set-down; £50/t extra to deconstruct (CIRCuIT, London) | £40 to £90, indicative, with sources |
| Condition and test-status multipliers (`assumptions.ts`) | Placeholders | No source anywhere in the corpus | Keep marked placeholder; restructure (feature 1) |
| Testing fees (£25 per piece, £300 per 20 t) | Placeholders | No UK figures; testing is by group (0, 1, 3 or all members) | Restructure per group; obtain UK tariffs |
| Storage, handling and haulage | Placeholders | No rates; land about 4 m2 per tonne | Gap |
| Raised floor, new carbon | 40 kgCO2e/m2 | 29 to 42 (AHMM); 42.7 to 95.5 (FCRBE) | Validated; cite AHMM |
| Raised floor, reclaimed carbon | 8.6 | 1.05 to 1.67, panels only | Record that 8.6 assumes new pedestals |
| Raised floor, price ratio | Placeholder | About 0.85 of new (EU 2021) | Indicative 0.85 |
| Brick, new carbon | 0.213 (ICE v3) | FCRBE quotes ICE at 0.45 | Keep; record the conflict |
| Brick, reclaimed carbon | 0.005, placeholder | Danish reclaimed brick EPD 0.0027 | Indicative, with source |
| Stone, price ratio | 0.4 | Most stone €15 to €50/m2; Rotor ceiling about 50% of new | Ratio per rock type; mass from thickness x density |
| Stone, new carbon | 0.08 | ICE limestone 0.09, granite 0.7 | Factor per rock type |
| Precast, mass | 360 kg/m2 | 15 cm at 2,400 kg/m3 | Validated |
| Precast, price ratio | 0.15 | Reclaimed panels cost more than new in one study | Allow zero or negative material value |
| Curtain wall, all values | Placeholder or indicative | **No evidence.** Facade glazing rarely reused; whole units sometimes are | Biggest evidence gap |
| Timber, new price and ratio | Placeholder | Reclaimed softwood €365 to €625/m3 | Ratio about 0.8 to 1.0, or raise the new price |
| Timeline "tight" (`v1assumptions.ts`) | 60 days | Recover, test and fabricate 6 to 8 weeks; tested stock in 4 days | Make it depend on status |
| Upfront carbon goal (`goals.ts`) | 950 office, 850 residential | Owner target under 500 by 2030; LETI 600; exemplars 265 to 386; a 2021 scheme at 991 against the 2020 draft | Version benchmarks; lead with the owner's target |
| Content goal | 20% by value | Most reporting methods use mass | Show both bases |
| BREEAM credit (`certification.ts`) | "Mat 05, material efficiency" | BREEAM NC 2018 numbers it Mat 06 | Confirm V7 numbering in the manual |
| Business model rates | Placeholders | No evidence; stockholders buy near scrap price | Gap |

## 5. Corrections to current logic

1. **Decision tree.**
   - Define upcycle (a component remade into something of equal or higher value) and downcycle (lower value, such as concrete to road sub-base).
   - Add "retain in place" and "relocate the whole structure".
   - Weight routes with the Level(s) indicator 2.4 coefficients.
   - Say which definition is used, since ADVANCE counts both upcycling and downcycling as recycling.
2. **Steel test status.** Store provenance (P0 to P3) and assessment (S0 to S4) as two fields, map them to CEN protocols A to D, and derive the four display labels. Rename "certified" to "CE/UKCA marked (EN 1090-2)".
3. **Condition grades.** The steel trade proposes Prime, then A to E. The carpet trade uses A, B, C. CIRCuIT scores 0 to 4 and rejects condition as an indicator. Keep condition as a data field with per-family rubrics, not a KPI.
4. **Recoverability.** It depends on fixing type, access, coatings and mortar, which differ by family. For steel, cutting near connections often beats unbolting.
5. **Matcher.** The "no cutting" rule contradicts practice. Allow cut-to-length within a 10% "minor alteration" limit, return offcuts, and flag stock over 30% in excess.
6. **Content basis.** Report mass beside value. Report reused and recycled content separately, with downcycling excluded from recycled content.
7. **Waste bill integrity.** London contractors log crushed hardcore as "reuse" (40% at one City demolition). Add a guard, and report diversion by both mass and volume.
8. **Double counting.** The same steel from one City building appears to be claimed by both the owner and a developer. Split donor credit ("diverted to reuse") from recipient credit (avoided A1-A3).
9. **Privacy.** For referable London schemes the bill of materials and the pre-demolition audit become public with the planning application. Privacy matters most before that point. An "own portfolio" tier helps owners who reuse within their estate.
10. **Audit independence.** In practice the audit is often run by the demolition contractor.
11. **Waste status.** The Scottish regulator says an item leaving site or changing owner cannot legally be called "reusable". The English position needs checking before Tallyard records transfers as reuse.
12. **Hubs.** Outside London, hubs are planned, not operating. Direct site-to-site transfer is common and needs its own route.
13. **Carbon.** Reuse is not zero-carbon. Cutting and disassembly can add 12 to 16% of the element's embodied carbon (Danish precast study), and reclaimed items' own A4 transport must be charged.
14. **Roles.** Missing: deconstruction contractor, structural engineer, stockholder, tenant, and service provider or lessor (an item in a donor building may not belong to the building owner).

## 6. What is missing from the folder

**Update, 27 October 2026.** Eight more documents arrived after this review (D53 to D60). They are in `research_notes/Literature review/08_new_documents_october.md`, which also has the updated gap status. In short:
- **Closed.** The CES template and its columns; the UK audit report format; the consultant's workflow; ICE V3 factors for common materials; and the RICS end-of-life defaults.
- **Mostly closed.** Raised floor recertification by the trade route, and real reclaimed specification clauses.
- **Partly closed.** BREEAM numbering, for V6 only. V6 numbers material efficiency Mat 06; Mat 05 is durability.
- **Unchanged.** Everything else below.

**Priority 1: needed for the compliance wedge or the core engines**
- **GLA primary documents:**
  - London Plan 2021 policy SI 7;
  - Circular Economy Statement guidance (2022) and **the statement template spreadsheet**, whose columns are already an open question for the founder;
  - whole life-cycle carbon guidance and template;
  - the draft London Plan of July 2026.
- **Steel standards:**
  - SCI P427 (2019, and the draft second edition) and SCI P440;
  - BCSA model specification for reclaimed sections;
  - NSSS Annex J;
  - NFDC DRG116 audit protocol;
  - the BRE pre-redevelopment audit code.
- **Carbon methods:** RICS whole life carbon assessment, second edition, and IStructE "How to calculate embodied carbon". These settle how reuse is counted and whether the 1,740 figure is A1 only or A1-A3.
- **Certification:** extracts from BREEAM NC V7 (material and waste issues), LEED v5 materials credits and WELL v2 X01.
- **UK cost data:**
  - stockholder price lists;
  - test laboratory tariffs;
  - yard storage and handling rates;
  - haulage;
  - deconstruction premiums;
  - audit fees.

**Priority 2**
- **Curtain wall and facade unit reuse:** no source of any kind. Facade-as-a-service pilots, glass reuse studies, and cases of whole unitised panels. Precast cladding panels likewise.
- **Raised floor recertification:** manufacturer evidence. Recertification schemes, PSA MOB PF2 and BS EN 12825, and the manufacturer's view behind the note "Not what Tate said".
- **UK insurance and warranty:** UK products and insurers' views, and the German reclaimed-material insurance white paper cited by one paper but absent.
- **English law:**
  - waste or not waste, end of waste, exemptions and duty of care;
  - UKCA and the GB construction products regime for used products;
  - Building Regulations regulation 7;
  - the Building Safety Act for higher-risk buildings.
- **UK contracts:** Procurement Act 2023 adaptation of the FCRBE clauses; JCT and NEC reuse clauses.

**Priority 3**
- **UK guidance per family:**
  - timber: TRADA, BS 4978 grading of reclaimed timber, Truly Reclaimed;
  - brick: reclaimed brick trade evidence;
  - stone: BS 8298, Historic England;
  - slate: BS 5534.
- **Fit-out:** CIBSE TM65 and TM66, and lighting reuse schemes.
- **Passports and data:** EU Digital Product Passport, ISO 20887, ISO 59004 and 59020, and established passport formats.
- **London market data:** the demolition pipeline and demand for reclaimed structure.
- **Marketplace confidentiality and competition law:** nothing in the corpus.

**Partial copies to complete**
- Corsini 2025: abstract only.
- Circular Buildings Toolkit: landing page only.
- BS 8001: a 2016 flyer, not the standard.
- DISRUPT checklists: the role matrix was lost; the original PDF is needed.
- Two FCRBE companion reports cited but absent.

Still awaited from the founder and partner: their own process notes and the office's specification template.

## 7. New features, ranked

None of these is built. Each lists its evidence, the roles affected and where it lands.

### Tier 1: high value, strong evidence, fits the current direction

1. **Steel assessment pathway** (D16, D02, D06, D27; images I19 to I21).
   - Admissibility screen at capture: build year, fire, corrosion, plasticity, built-up or spliced members, fatigue history, encasement, hazardous coatings.
   - Provenance x assessment status.
   - Protocol A to D wizard with sample counts per group.
   - Certificate record (EN 10204 3.1).
   - Demand-side limits on projects (execution and consequence class, fatigue, seismic, exposed steel).
   - Lead time by status.
   - Roles: surveyor, owner, testing company, structural engineer (new).
   - Lands in: `testing.ts`, item types, matcher, timeline.
2. **Pre-demolition audit module and deconstruction contractor workspace** (D23, D16, D41, D12, D13, D34, D38, D50).
   - Desk study and field survey.
   - Three inventories (hazardous, reusable, recyclable).
   - Extractability, quality and market value scores, with a "limiting factor" badge.
   - Hazard evidence.
   - Margins of error and a signed export.
   - Demolition tracker with "as demolished" destinations.
   - Forecast against actual arisings.
   - Deconstruction tender comparison.
   - Contractor title and extractability.
3. **Compliance upgrades for the consultant** (D34, D41, D21, D22, D39, D23, D32, D52).
   - Statement structure with numbered commitments in minimum, target and aspiration tiers.
   - Statement milestones (stage 1, planning, stage 4, after completion) and a bill of materials.
   - A BREEAM-style tracker (targeted, potential, difficult; lead; stage; margin alert).
   - Versioned benchmarks, and a policy watch where emerging policy counts as a "material consideration".
   - Mass and value shown side by side; reused and recycled shown separately.
   - Reuse inflation guard.
   - Waste per 100 m2.
   - Donor and recipient carbon split.
4. **Grading, capture checklists and hazard screening per family** (D27, D44, D13, D49, D06).
   - Condition and recoverability rubrics with reject criteria.
   - Hazard flags by build date: red lead, asbestos, PAH, PCP, PCB.
   - Yield and surplus factors.
   - Processing state.
   - Storage rules.
5. **Specification and procurement pack** (D52, D27, D41, D47, D15).
   - Specification sheet in the FCRBE structure: ranges and tolerances, operations, regulatory against contractual requirements, presumed quantities, surplus, new fallback.
   - Client clause library: objective, award criteria, review or substitution, insurance, execution, origin.
   - Procurement route selector with a responsibility matrix.
   - A schedule of reclaimed and new prices.
6. **Provenance pack, chain of custody and assurance tier** (D11, D29, D37, D16, D52; image I29).
   - Batch identity sheet.
   - Chain-of-custody ledger.
   - Tiered disclosure to engineer, test house and insurer.
   - Assurance tier by layer: structure needs test proof, skin product liability and QA, space plan a warranty.
   - Warranty, insurance and recertification status on each lot.
   - A "tested for reuse" stamp or QR label.

### Tier 2

7. **Recovery plan rework** (D16, D14, D49, D48, D13, D41).
   - Defined tree steps, plus retain and relocate.
   - Upcycle suggestions per family.
   - Level(s) route coefficients and a donor score.
8. **Deal models and forward sale** (D10, D02, D11, D40, D21, D48).
   - Client-driven, stockholder, hybrid, forward and futures models, each setting title, testing payer, storage owner and warranty chain.
   - Reservations with deposit, storage fee and price lock.
   - A design-change clause.
   - Buy-back.
9. **Design from stock for architects** (D48, D21, D27, D02, D49).
   - Profile ranges and minimum lengths.
   - The 30% excess rule and offcuts.
   - Matching on structural grid.
   - Reservation before strip-out.
10. **Cost and carbon refinements** (D52, D06, D49, D21).
    - Dismantling, preparation and packaging lines.
    - A client provisional sum for tests.
    - Indexed new and scrap prices.
    - Carbon for cutting and the reclaimed item's own transport.
    - A storage bridge in the timeline check.
11. **Portfolio-first visibility** and import of public statements and audits once a planning application is lodged (D41, D21, D12, D38).
12. **New families** (D27, D49, D36, D28, D50).
    - Precast structural elements with a downgrade engine.
    - Natural slate.
    - Stone sills, copings and paving.
    - Glulam.
    - Clay roof tiles.
    - A fit-out set (carpet tiles, ceilings, luminaires) with a supply forecast from lease expiries.

### Tier 3

13. **Indicator and benchmark panel** (D22, D39, D24, D17, D21; image I05).
    - CIRCuIT core indicators and FCRBE layer bands.
    - An MCI-style circularity gap.
    - CE-MVR and the owner circularity score.
14. **Lender and reporting exports** (D33, D25).
    - IFC reporting parameters.
    - Scope 3 avoided emissions.
    - An EU Taxonomy note.
    - A VAT and incentive scenario toggle.
15. **Regional data** (D14, D51, D37).
    - Scotland and West Midlands requirement entries, marked indicative and, where relevant, proposed.
    - Planned or virtual hubs.
    - Site-to-site routing.
16. **Operator city roll-up and demand feed** (D22, D38).
    - Stock mapped and potential.
    - Hub throughput.
    - Actual reuse per family.
    - Recipients' bills of materials as a demand signal.
17. **True cost of waste card** for the consultant (D42 to D45).

### Rules that apply to all of this

- Every new value enters with a source and a status (published, indicative or placeholder).
- Every figure comes from a pure, tested domain function (R2 and P2).
- Real projects and organisations from the literature appear only as cited publications in Help or Methodology, never as actors in the product world (R6 and P5).
- Nothing is presented as certified.
- Reference values change only when the user decides to adopt a source.

## 8. Recommended next steps

1. **Obtain the priority 1 sources**, above all:
   - the GLA statement guidance and template;
   - SCI P427 and P440;
   - the RICS and IStructE methods;
   - UK testing and storage tariffs.
   
   Then confirm the module basis of the steel factor and the BREEAM V7 issue numbers.
2. **Decide the reference-value updates** in section 4 that are ready now:
   - the reclaimed steel EPD source;
   - raised floor sources;
   - indexed steel prices;
   - the double-counting note on the steel ratio.
3. **Pick the Tier 1 features to build first.** The steel assessment pathway and the compliance upgrades carry the most evidence and touch the founder's open questions 2, 4, 8, 9 and 17 directly.
4. **Take the contradictions to the partner**, in particular:
   - raised floor reuse ("Not what Tate said");
   - the 950 kgCO2e/m2 default against owners' targets;
   - mass against value reporting;
   - whether the deconstruction contractor should become a role.
