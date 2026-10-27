# Literature review 08: the files added on 27 October 2026

Nine files were added to `reference literature/` in commits 4657439 and 0c1b796. The user described them as ten files.

- Two of the nine are the same specification, once as a PDF and once as its text extraction, so there are eight documents.
- Either one file did not upload, or the count included the PDF twice.

IDs continue from the register (`00_corpus_register.md`).

Three of the documents are one project chain on one London site, the kind of chain Tallyard's compliance work aims to serve:
1. The pre-redevelopment audit (D55, 2023).
2. The pre-demolition audit (D56, 2024).
3. The circular economy statement (D57, 2024 to 2026).

Two more documents come from a second project:
- the architectural specification (D59);
- the stage 3 sustainability report (D60), which includes the landowner's own development sustainability principles.

None of the names may appear in the product (rule R6 / P5). They are cited here as publications only.

## D53. GLA circular economy statement template (`gla_circular_economy_statements_template.xlsm`)

- **Identity.** The Greater London Authority's spreadsheet that goes with the London Plan Guidance on circular economy statements (March 2022). Authority: high; it is the form an applicant submits.
- **Sheets.** Introduction, Pre-App, Outline, Detailed and Post-Construction, plus a hidden sheet of dropdowns.
- **What each stage asks for:**
  - CE targets and design approaches at every stage.
  - Design principles, at pre-app only.
  - Principles by building layer.
  - Pre-redevelopment and pre-demolition audits, at outline and detailed.
  - Bill of materials: estimated at outline and detailed, actual at post-construction.
  - End-of-life strategy and operational waste plan, at detailed.
  - Recycling and waste reporting.
  - Lessons learnt, at post-construction.
  - The post-construction return is due within 3 months of completion.
- **Pre-app sheet.**
  - Project details, use classes and GIA.
  - A question chain on the existing building leading to one strategy: new build, retain and retrofit, partial retention, disassemble and reuse, or demolish and recycle.
  - For new elements: relocation, component reuse or adaptability.
  - Default targets:
    - 95% diversion for demolition, excavation and construction waste;
    - municipal recycling 65% by 2030;
    - "Minimum 20% of the building material elements to be comprised of recycled or reused content", by value.
- **Bill of materials columns.**
  - Building element category, from 19 NRM categories (0.1 demolition toxic to 8 external works).
  - Material type.
  - Material quantity, module A (kg).
  - Material intensity (kg/m2 GIA).
  - Performance indicator, the computed intensity compared with LPG Appendix 1.
  - Construction waste factor and construction waste, module A (kg).
  - Recycled content by mass (kg) and by value (%).
  - Expected lifespan.
  - Number of replacements over 60 years.
  - Repair and replacement quantity, module B (kg), with its own waste factor and waste.
  - Design for disassembly.
  - Assumed end-of-life scenario.
  - % reusing, % recycling and % landfill.
  - Estimated reusable and recyclable materials, module D (kg and kg/m2).
- **Recycling and waste reporting table.**
  - Rows: demolition, excavation, construction, module B strip-out and construction, municipal and industrial waste, and total materials.
  - For each row: tonnes and t/m2 GIA; then reuse on site or off site %, recycle on site or off site %, landfill %, other management %, and totals.
- **Layer table.** From site to "stuff". Questions over a 5 to 15 year horizon lead to flexibility, replaceability or adaptability.
- **Formula defects found in this copy.** These need checking against the current GLA download before Tallyard copies any formula.
  - The module B quantity multiplies replacements by the waste factor, not by quantity (`O92 = N92*I92`).
  - The module B waste multiplies the waste factor by the lifespan (`Q92 = P92*M92`).
  - Two total cells point at row 109 columns, one of which holds text (`E470`, `E477`).
  - The module B header reads "Recycle Offsite" twice.
- **Not in the template.** The LPG Appendix 1 benchmarks themselves. The template only computes intensity by category with SUMPRODUCT, so the benchmarks must come from the LPG text.
- **How it informs Tallyard.**
  - This closes the open question on the template's columns.
  - For every reclaimed item in a project, Tallyard can already supply most of a bill of materials row:
    - NRM category;
    - material type;
    - mass;
    - reused content by mass;
    - the design-for-disassembly note;
    - an end-of-life scenario.
  - The supply side can fill the reuse columns of the waste reporting table, on site and off site.
  - Feature 3, the consultant's compliance upgrades, should export in this layout, keyed by NRM category.

## D54. Consultant's circular economy workflow (`REUSEFULLY - WORKFLOW.docx`)

- **Identity.** A consultant's service description for circular economy statements. Authority: medium; it describes practice.
- **Content.**
  - **Three stages:**
    - pre-application;
    - planning;
    - post-construction (RIBA stage 6, at most 3 months after completion).
  - **At planning:**
    - pre-redevelopment and pre-demolition audits;
    - reuse opportunities;
    - reclaimed and recycled-content products;
    - end of life;
    - material passports;
    - bills of quantities.
  - **During construction:** excavation, the site waste management plan, and the operational waste strategy.
  - **Also:** workshops at each stage, and wider circular economy strategies where no statement is required.
- **How it informs Tallyard.** This is the consultant's workflow that brief 09 section 12 was waiting for, in outline. The consultant's screens should follow the three stages, with the audit and the bill of materials as inputs. It does not give the partner's own decision tree or frameworks list.

## D55. Pre-redevelopment audit, three-building office site (`Pre-Redevelopment Audit Report ... 19.06.23.txt`)

- **Identity.** A circular economy consultancy's audit for a cost consultant acting for an overseas owner, June 2023. It was based on a non-invasive visual survey on 1 June 2023. Authority: high for UK practice.
- **Buildings.** Late 1960s, early 1960s and 1913 to 1914.
- **Content.**
  - **Six evaluation factors:**
    - technical capacity;
    - energy performance;
    - occupant comfort;
    - construction practicalities;
    - social and economic value;
    - commercial viability.
  - **Three-point scale for each factor:**
    - "Not likely to prohibit retention";
    - "May be supported";
    - "May not be supported".
  - **Scenarios:** heavy refurbishment; refurbishment with extension; partial retention per building. Cores must be rebuilt for fire compliance.
  - **Material recovery potential** per element.
  - **Recommended follow-on assessments:** structural, condition (RICS), MEP, energy, whole life carbon, financial, real-estate demand and social value.
- **How it informs Tallyard.**
  - A ready format for the donor building's retention screen (feature 2), and evidence that retention is assessed before any reuse.
  - Supports adding "retain in place" to the decision tree (correction 1).

## D56. Pre-demolition audit, the same site (`Reusefully Pre-Demolition Audit Report ... 16.09.2024 v1.2.txt`)

- **Identity.** The same consultancy, September 2024, version 1.2. Authority: high for UK practice.
  - Follows the BRE Code of Practice for pre-redevelopment audits (July 2017) and the GLA guidance.
  - Written to be compliant with BREEAM Wst 01.
- **Arisings.** 23,802 t (11,699 m3), tabled by EWC code. The main streams:

  | Stream | Tonnes | EWC code |
  |---|---|---|
  | Concrete | 18,548 | 17 01 01 |
  | Ceramics | 2,766 | |
  | Metals | 866 | |
  | Timber | 482 | |
  | Brick | 461 | |
  | Gypsum | 265 | |

  An NRM breakdown is given in an appendix.
- **Reuse table.** Columns: item, % reusable, tonnes, avoided tCO2e (ICE V3), quantity, considerations and guidance.

  | Item | Reusable | Notes |
  |---|---|---|
  | Raised floor | 70% | 320.5 t; 12,446 m2; 34,572 panels; 280.6 tCO2e avoided |
  | Carpet tiles | 75% | |
  | Metal ceiling tiles | 70% | |
  | Portland stone cladding | 70% | |
  | Stone paving | 60% | |
  | Slate | 75% | |
  | Steelwork | 50% | Stockholders need lengths of at least 3 m and about a lorry load |
  | Older brick | 40% | |
  | Modern brick | 10% | |
  | White glazed brick | 20% | |
  | Timber doors | 30% | 246 doors; fire doors only where a fire door is not required |
  | Windows | 30% | |
  | Glass partitions | 25% | Frames not reusable |
  | Concrete paving | 30% | |
  | Concrete cladding | 10% | |
  | Blockwork | 10% | |
  | Ceramic floor tiles | 5% | |
  | Metal stairs | 100% | |
  | LEDs | 75% | |
  | WC pans | 60% | |
  | Sinks | 80% | |

  Total reusable: 664 t, 2.8% by weight, 559 tCO2e.
- **Raised floor detail.**
  - 17,780 m2 present, 70% reusable.
  - Panels have a medium-grade steel skin with a chipboard core. **Pedestals are not reusable.**
  - The manufacturer tests, recertifies and resells them as its Eco range:
    - the owner sends photos first;
    - the manufacturer quotes per panel and collects;
    - carpet must be removed and panels kept dry;
    - 32 panels to a pallet;
    - edge damage and rust are not acceptable.
- **Targets.**
  - Reuse: 2% by weight.
  - Diversion: 97% (estimated 97.8%).
  - The BREEAM credit needs 90% by weight or 80% by volume; London needs 95%.
  - Per-material reuse targets: brick 16%, timber 61%, stone 53%, carpet 67%, metals 10%.
- **Logistics.** 2,329 eight-yard skips or 1,553 twelve-yard skips.
- **Next steps the audit sets.**
  - A reuse workshop.
  - A resource tracker.
  - The demolition tender must reference the audit.
  - Actual results are recorded against the forecast in a waste data system.
- **ICE V3 factors in its appendix** (kgCO2e/kg):

  | Material | Factor |
  |---|---|
  | Steel section | 1.55 |
  | Rebar | 1.99 |
  | Brick | 0.21 |
  | Stone | 0.08 |
  | Glass | 1.60 |
  | Aluminium | 6.58 |
  | Chipboard | 0.70 |
  | Concrete | 0.10 |
  | Carpet tiles | 13.0 |
  | Softwood | 0.30 |
  | Plasterboard | 0.40 |

- **Appendix of local reuse and recycling organisations.** An early list of the buyers and brokers Tallyard competes with or serves.
- **How it informs Tallyard.**
  - **Raised floor mass.** 320.5 t over 34,572 panels is about 9.3 kg a panel, against Tallyard's 12 kg (`families.ts`, `massRule`). Panels-only avoided carbon is about 22.5 kgCO2e/m2.
  - **Pedestals.** "Pedestals not reusable" agrees with Tallyard's reclaimed factor, which assumes new pedestals.
  - **Raised floor acceptance rules** (photos first, dry, carpet off, no edge damage or rust) are the capture checklist for the family (feature 4).
  - **The reuse table** is the import format for listings created from an audit (features 2 and 11).
  - **Low reuse by weight.** 2.8% by weight confirms the ex-post finding that reuse by mass stays in single figures.
  - **Steel minimums.** "At least 3 m and a lorry load" is a stockholder's minimum lot rule for the matcher.

## D57. Circular economy statement, the same site (`294009-ARP-RP-YS-10001 Circular Economy Statement _MMA Draft Issue.txt`)

- **Identity.** An engineering consultancy's statement for the scheme. Revision P01 is from November 2024; P04 (1 July 2026) is the update for a Section 73 application. Authority: high for UK practice.
- **Optioneering.**
  - Follows the City of London Carbon Options Planning Advice Note (April 2023, revision 01).
  - Options ranged from 0% to 79% retained. Full demolition was chosen, and the options went through third-party review.
  - Reasons: fire escape and core compliance, among others.
- **Policy.** London Plan SI 7 and D3, with GLA decision trees adapted for existing structures and for new elements (figures 8 and 10). Local policy cited:
  - City of London Local Plan 2015 CS17 (DM 17.1 and 17.2);
  - draft City Plan 2040 S16, DE1 and CE1;
  - Planning for Sustainability SPD (February 2025).
- **Targets.**
  - 95% diversion for demolition and excavation waste, and 95% for construction waste.
  - At most 6.5 t of construction waste per 100 m2 GIA.
  - 20% recycled or reused content by value.
  - Municipal recycling 65% by 2030, and 75% of business waste by 2030 under the London Environment Strategy.
  - All delivered through the Sustainability Employer's Requirements.
- **Commitments** (table 15), each tracked as "On track", among them:
  - reclaimed steel where possible, otherwise low-carbon steel;
  - reuse of the 1913 building's stone on the new facade, subject to a stone survey;
  - maximum recovery of raised floor, "programme and storage dependant";
  - a material reuse schedule for a cultural space, with items possibly stored for 3 years;
  - "likely furniture will be sent to a marketplace";
  - "Designing structural framing to be accommodating to the steel stock and lengths anticipated to be in circulation".
- **Opportunities** (table 16).
  - "Investigate the use of marketplaces and exchange platforms to donate/sell materials and components from the existing site".
  - Material passports, to be confirmed by the principal contractor.
- **Recycled content by value.**
  - Preliminary result 29%, from a commercial LCA tool's circularity module.
  - Limitations the statement itself lists:
    - only the elements modelled in the WLCA are counted, typically substructure and superstructure at stage 2;
    - the cost database covers main materials only;
    - database prices differ from the cost plan.
- **Bill of materials.** Built from the WLCA. Lifespans come from RICS WLC Professional Statement edition 2, table 20, and end-of-life defaults from its table 23.
- **RICS PS v2 default end-of-life scenarios** (the statement's table 17; columns are reuse, recycle, energy recovery and landfill):

  | Material | Reuse | Recycle | Energy recovery | Landfill |
  |---|---|---|---|---|
  | Concrete in situ | 0% | 97.5% | 0% | 2.5% |
  | Precast | under 1% | 96.5% | 0% | 2.5% |
  | Hot-rolled sections | 7% | 93% | 0% | 0% |
  | Studwork | 5% | 93% | 0% | 2% |
  | Piles | 15% | 71% | 0% | 14% |
  | Rebar | 0% | 98% | 0% | 2% |
  | Blockwork | 0% | 97.5% | 0% | 2.5% |
  | Brickwork | under 1% | 97.5% | 0% | 2.5% |
  | Solid timber | under 1% | 78% | 20% | 1% |
  | Treated timber | 0% | 30% | 69% | 1% |
  | Engineered timber | 5% | 35% | 59% | 1% |
  | Wood panels | 0% | 0% | 99% | 1% |
  | Aluminium | 0 to under 1% | 96% | 0% | 4% |
  | Plasterboard | under 1% | 17% | 0% | 83% |
  | Glass | 0% | 61% | 0% | 39% |
  | Lights | 0% | 45% | 0% | 55% |
  | Ventilation | 0% | 40% | 0% | 60% |
  | Radiators | 0% | 80% | 0% | 20% |

- **Post-construction.** An updated statement within three months, with "key achievements" and "lessons learnt" in the GLA spreadsheet.
- **How it informs Tallyard.**
  - **Default end-of-life scenarios.** These are the business-as-usual defaults a statement uses. Tallyard's end-of-life scenario for an item should start from them and show where reuse beats the default.
  - **The commitments table** (principle, layer, original target, update, status) is the layout for a consultant's commitment tracker (feature 3).
  - **Demand evidence.** Marketplaces, storage for up to 3 years, and framing designed to the steel stock all appear in a live statement. That is evidence of demand for reservations with storage (features 8 and 10) and for design from stock (feature 9).
  - **Recycled content method.** The statement's own limits show why Tallyard should state the basis and coverage of any by-value figure (correction 6).

## D58. Detailed architectural specification, a new office in a conservation area (`01061-Detailed Architectural Specification-2024-08-30-DetailedRevisions.txt`)

- **Identity.** An architect's NBS-style specification for a London landowner, stage 4, revision P09, 30 August 2024. 378 pages. Authority: high; it is a contract document.
- **Targets.** BREEAM UK NC V6 Outstanding (offices, shell and core), Excellent (retail shell), WELL v2 Platinum, NABERS 5 star.
- **Sustainability clauses (A33).**
  - EPDs to EN 15804 for every system before procurement; where none exists, an embodied carbon assessment.
  - Sourcing to BS ISO 20400.
  - Material efficiency to BS 8895.
  - Recycled content and circular economy targets by reference to the sustainability report.
- **Service life table.** BS 7543 table D1, with overrides. Examples:
  - structural steel and aluminium frames: 60 years, permanent;
  - glass units: 25, replaceable;
  - galvanised steel: 40, maintainable;
  - internal stone: 40, maintainable;
  - membranes: 20 to 25.
- **Reclaimed clauses, all "free issue by Client and Demolition Contractor":**
  - reclaimed marble wall tiles (LIN-150 / M40) and feature surround (FIX-201 / N10);
  - a reclaimed glass block screen (GLA-130 / F11);
  - panelling with reclaimed marble (LIN-170 / K13);
  - reclaimed signage and mosaic from the existing building (SGN-201, 202, 311);
  - **reclaimed raised access floor (RAF-120 / K41/120).**
- **Common clause pattern for reclaimed items.**
  1. Examine for damage or deterioration and confirm suitable for the intended use and service conditions.
  2. Present to the architect for review and selection by size, shape, condition, colour and appearance.
  3. Clean and prepare.
  4. Reduce thickness where needed.
  5. Dry lay before fixing.
  6. Submit samples showing the visual range.
  7. Agree the first installation as a benchmark.
  8. The client makes the reclaimed items available for the contractor's review of condition and weight, to write method statements.
  9. Joints are left open to allow demounting.
- **RAF-120.**
  - The visual reference is a named manufacturer's Eco range, 38 mm, edge banded.
  - Medium grade to MOB PF2 PSU/SPU; 2.5 kN/m2 typical and 5 kN/m2 in enhanced areas.
  - Panels 600 x 600 mm, supplied by the client; new pedestals as the panel supplier recommends, bonded and fixed, galvanised to BS EN ISO 1461.
  - Cut ends sealed and exposed metal treated against corrosion.
  - Samples: a "selection of reclaimed tiles to demonstrate the visual range".
- **Other.** Ceilings framed with at least 90% recycled steel.
- **How it informs Tallyard.**
  - These are real reclaimed clauses from a practice of the kind that will use the spec sheet.
  - The spec sheet should follow this structure: description, location, visual reference, grade and loading, support, panels, accessories, samples and benchmarks. It should add the free-issue clause and the eight-step selection pattern (feature 5).
  - **Supply routes.** "Free issue by client and demolition contractor" is the client supply route of FCRBE factsheet 12; it applies when donor and recipient share an owner, as in the portfolio-first tier (feature 11).
  - **Service lives.** The service life table gives defaults for the "expected lifespan" column of the GLA bill of materials.

## D59. Architectural specification, a mixed-use block with a listed cinema (`1198-St James Ph 2 - Architectural Specification-2026-09-04.txt`, and the same as `.pdf`)

- **Identity.** The same architect, for a different London landowner, revision 001, 4 September 2026. 444 pages. Authority: high.
- **Targets.** BREEAM V6 Outstanding (offices) and Excellent (retail), WELL v2 Gold or Platinum ready, NABERS 5.5 star.
- **Reclaimed content.** Much thinner than D58.
  - The raised floor (FBS-201 / K41/111) is new, medium grade.
  - One clause covers reclaimed natural stone paving (Q25/690): stack on pallets, shrink wrap, clean with mild detergent.
  - Many "Recycled content: submit proposals" lines.
  - One terrazzo of about 50% recycled content, including aggregates reclaimed from building sites.
- **How it informs Tallyard.** The same practice reuses heavily on one job and hardly at all on the next. Reuse depends on the client and on what the donor building holds, not on the architect's template. It also shows the specification states reclaimed handling and storage in the paving section, which the family storage rules should match.

## D60. Stage 3 sustainability report for the D59 scheme (`070HAY-WPL-XXX-XXX-RP-ME-12830_P02.txt`)

- **Identity.** An MEP and sustainability consultancy, issue P02, September 2026. Authority: high for practice.
  - Appendices: BREEAM V6.1 trackers, a WELL tracker, the carbon tracker and waterfall, and the landowner's Development Sustainability Principles (version 4) with its tracker.
- **Carbon.**
  - **Stage 2 upfront carbon (A1 to A5):**
    - 606 kgCO2e/m2 under RICS v1;
    - 655 kgCO2e/m2 with a 10% allowance;
    - 665 kgCO2e/m2 under RICS v2 (19,195 tCO2e).
  - **Life cycle:** 913 to 1,130 kgCO2e/m2.
  - **Carbon waterfall.** Options include "reuse of temporary steelwork" (still to be quantified). Applying every measure would cut the total to about 18,338 tCO2e.
- **Landowner's principles.**
  - In-use embodied carbon (B and C, excluding B6 and B7): at most 275 kgCO2e/m2, or 250 for some uses. Upfront limits are set per project.
  - "100% of materials can be recovered and reused at disassembly".
  - 25% of products (by quantity) with an EPD.
  - Construction waste: 100% diverted from landfill, and 95% reused or recycled.
  - Construction waste below 3.2 t per 100 m2.
  - The pre-demolition audit "should be carried out by a competent person outside the design team", at stages 1 to 2 and before strip-out.
  - Demolition follows a hierarchy:
    1. retain in situ;
    2. reuse on site;
    3. "rehome the remaining products in their original format where possible through intermediary companies working in this area", reporting the destination;
    4. monitor recycling.
- **Pre-deconstruction audit.**
  - A specialist firm built a digital asset register and a pathway for each item:
    - retained;
    - reuse on site;
    - reuse off site;
    - recycling on site;
    - recycling or waste off site.
  - Results by weight:

    | Pathway | Share | Tonnes |
    |---|---|---|
    | Retained | 9% | 2,900 |
    | Recycled on site | 11% | 3,600 |
    | Reused on site | 2% | 300 |
    | Reused off site | 5% | 1,600 |
    | Recycling or waste | 73% | 22,900 |

  - The firm writes deconstruction guidance for the demolition tender and offers "their brokerage team to support in finding buyers for the materials".
- **BREEAM UK NC V6.1 numbering in the trackers:**

  | Credit | Title |
  |---|---|
  | Mat 01 | Life cycle assessment |
  | Mat 02 | EPDs |
  | Mat 03 | Responsible sourcing |
  | Mat 05 | Designing for durability and resilience |
  | Mat 06 | Material efficiency |
  | Wst 01 | Construction waste |
  | Wst 02 | Recycled aggregates |
  | Wst 03 | Operational waste |
  | Wst 05 | Adaptation |
  | Wst 06 | Design for disassembly and adaptability |

  - The trackers define "reused in situ": a material removed from its original position, given no more than minor processing, and reinstalled in a different position in the building or project.
  - Wst 01 benchmarks:
    - non-hazardous construction waste at most 3.2 t (3.4 m3) per 100 m2;
    - diversion of 80% by tonnes (70% by volume) for construction waste;
    - 90% by tonnes (80% by volume) for demolition waste. The tracker labels this row "Non-demolition", which looks like a slip, since BREEAM pairs these figures with demolition waste.
- **How it informs Tallyard.**
  - **Pathways.** Five per item, which match Tallyard's decision tree once "retain" is added (correction 1).
  - **Intermediaries.** A landowner's own brief tells the team to rehome items through intermediaries and report the destination. That is the role Tallyard plays, and it should export destination records (feature 2).
  - **Competition.** The audit firm's brokerage offer is a direct competitor pattern: auditor plus broker. Tallyard's edge would be the open marketplace, the privacy model and the specification output.
  - **BREEAM numbering.** **Under V6, Mat 05 is durability, not material efficiency, which is Mat 06.** Tallyard's `certification.ts` maps "Mat 05 material efficiency" to V7. That is right only if V7 renumbered the issues, which needs the V7 manual.
  - **Owner targets.** The 275 limit for in-use embodied carbon matches the other owner target in the corpus (D41), so it is a common owner metric to show beside the GLA benchmarks.

## Gap status after these files

### Closed or mostly closed

| Gap (report section 6) | Now | By | What is left |
|---|---|---|---|
| CES template spreadsheet and its columns | Closed | D53 | Check the formula defects against the current GLA download |
| UK pre-redevelopment and pre-demolition audit format | Closed | D55, D56, D60 | The BRE code itself |
| Consultant's workflow | Closed in outline | D54 | The partner's own decision tree and frameworks list |
| City of London policy | Named and summarised | D57 | Primary texts of the PAN and SPD |
| ICE V3 factors for common materials | Closed for 11 materials | D56 | Reclaimed-side factors still come from EPDs |
| RICS end-of-life defaults | Closed for 18 materials | D57 | Lifespans (table 20) and the reuse module rules; whether 1,740 kg/t is A1 only |
| Raised floor recertification (trade route) | Mostly closed | D56, D58 | The manufacturer's test regime and fees; the source behind "Not what Tate said"; PSA MOB PF2 |
| Architect's reclaimed specification clauses | Mostly closed | D58, D59 | Whether the partner's own template matches |
| BREEAM numbering | Partly closed (V6) | D60 | The V7 manual |
| Owner targets | Extended | D60 | None |
| Real reuse rates from audits | Extended | D56, D60 | None |

### Still open

**Priority 1**
- GLA primary texts:
  - London Plan SI 7 and D3;
  - the CES LPG text with its Appendix 1 benchmarks;
  - the GLA whole life-cycle carbon guidance and template;
  - the draft London Plan 2026.
- SCI P427 and P440, the BCSA model specification, NSSS, NFDC DRG116, and the BRE audit code.
- RICS WLCA second edition (full text) and IStructE "How to calculate embodied carbon".
- BREEAM NC V7 (Mat and Wst), LEED v5 MR, WELL v2 X01.
- UK cost data:
  - stockholder price lists;
  - test laboratory tariffs;
  - storage and handling;
  - haulage;
  - deconstruction premiums;
  - audit fees;
  - raised floor recertification per panel.

**Priority 2**
- Curtain wall and facade unit reuse, and precast cladding. Still no source; the new audits list windows at 30% reusable and glass partitions at 25%, but give no method.
- UK insurance and warranty products, and the German insurance white paper.
- English waste and product law:
  - waste status;
  - end of waste;
  - exemptions;
  - duty of care;
  - the GB construction products regime for used products;
  - Building Regulations regulation 7;
  - the Building Safety Act.
- UK contracts: Procurement Act 2023, and JCT and NEC reuse clauses.

**Priority 3:** unchanged.
- UK guidance per family.
- CIBSE TM65 and TM66.
- Passport and data standards.
- The London demolition pipeline.
- Competition law for a marketplace.

**Partial copies:** unchanged.
- Corsini 2025.
- The circular buildings toolkit.
- BS 8001.
- The DISRUPT role matrix.
- Two FCRBE companion reports.

### New gaps these files raise

- The LPG Appendix 1 performance benchmarks, which the template points to but does not hold.
- The recycled-content-by-value method needs cost data per material. The commercial tool's cost database is proprietary.
- The manufacturer's own raised floor recertification test and grading rules, as opposed to the acceptance rules in D56.
- The tenth file the user meant to add, if one was missing.

## Value changes these files suggest (not made; for the user to decide)

| Value (file) | Now | Evidence | Suggestion |
|---|---|---|---|
| Raised floor mass (`families.ts`) | 12 kg per 0.36 m2 panel | 9.3 kg per panel, steel skin with chipboard core (D56) | Use about 9.3 kg, or keep 12 and record the range |
| BREEAM material efficiency code (`certification.ts`) | Mat 05 under V7 | V6 numbers it Mat 06; Mat 05 is durability (D60) | Confirm against the V7 manual |
| End-of-life default per family | None | RICS PS v2 table 23 via D57 | Add, so the platform can show the gain over business as usual |
| Service life per family | None | BS 7543 table with overrides (D58); RICS table 20 via D57 | Add, to fill the GLA lifespan column |
| Owner in-use embodied carbon | Not shown | 275 kgCO2e/m2 (D60, D41) | Show beside the GLA benchmarks |
