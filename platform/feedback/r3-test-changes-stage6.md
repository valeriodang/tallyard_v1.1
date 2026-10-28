# Round 3 test changes, stage 6

Each line is one changed assertion, with the spec change behind it. Assertions that were only added are not listed. Spec: `BRIEF.md` section 15.7.

## Stage 6a: the client gains a Procurement tab

The client's procurement pack is a project tab, after Reservations. Three assertions list the client's tabs or sidebar children, and each now has Procurement after Reservations:

- `src/store/selectors/sustainability.test.ts`, "each side gets its tabs; the consultant alone gets targets, certification and the statement": Isla's tabs.
- `src/store/selectors/views.test.ts`, "builds each role sidebar with badges": Isla's Merrowgate Wharf children.
- `src/store/selectors/owner-surveyor.selectors.test.ts`, "gives the owner Donor buildings with Recovery plan, then New projects and the marketplace once it has one": the owner's New project children. The owner is the client of its own project, so it has the client's tabs.

**What still holds.** Every other tab, its order, label and badge is unchanged. The architect's and the consultant's tabs are unchanged.

## Stage 6b: the consultant gains a Statement inputs tab

- `src/store/selectors/sustainability.test.ts`, "each side gets its tabs; the consultant alone gets targets, certification and the statement":
  - **What changed.** Marcus's tabs now have Statement inputs after Circular economy.
  - **Why.** The consultant's statement workspace holds the GLA template's tables behind the statement.
  - **What still holds.** Every other tab, its order, label and badge is unchanged.

**Added, not changed.** `src/test/privacy.platform.test.ts` now also scans the workspace view and the template rows (`cesView`, `cesTemplate`) in every buyer-side and money check. No assertion changed.

## Stage 6c: the certification rebase

BREEAM credits now use the V6.1 numbering of the trackers in the folder, so material efficiency is Mat 06, not Mat 05 (Mat 05 is durability). WELL gains X03, chromated copper arsenate and lead, which maps reclaimed timber. Four assertions change:

- `src/store/selectors/r2f-look-fix.test.ts`, "says what each scheme covers from its summary, not its name again":
  - **What changed.** The BREEAM line reads "Mat 06 rewards material efficiency" for "Mat 05 rewards reusing materials".
  - **Why.** The requirement's summary follows the V6.1 numbering.
  - **What still holds.** The LEED and WELL lines, and the rule that a line never repeats the scheme's name.
- `src/store/selectors/sustainability.test.ts`, "BREEAM lists five credits with four targeted; WELL X01 suggests at risk with TH-02 mapped":
  - **What changed.** The WELL matrix lists X03 between X02 and X07.
  - **Why.** X03 is targeted by default and maps reclaimed timber, so it has a column.
  - **What still holds.** BREEAM's five credits with four targeted, X01's suggestion, its mapped item and the matrix cells.
- `src/store/selectors/sustainability.test.ts`, "an override changes the mapping, and the summaries count targeted credits":
  - **What changed.** WELL counts 4 targeted credits, not 3.
  - **Why.** X03 is targeted by default.
  - **What still holds.** The ratings, the one credit at risk, the other schemes' counts, and the client's lack of access.
- `src/store/selectors/r2f-client-consultant.test.ts`, "leaves out the statement's own measure, names WELL X01 at risk, and asks for a WELL target where WELL is required":
  - **What changed.** The WELL line reads "4 credits targeted, 1 in progress, 1 at risk and 2 not started".
  - **Why.** X03 is targeted and not started: Merrowgate holds no reclaimed timber.
  - **What still holds.** X01 is named at risk, the statement's own measure is left out, and the next steps are unchanged.


## Stage 6d: state version 3 and the "Updated on 28 October" notice

The sandbox moves to version 3, on its own key `tallyard-platform-v3-state`, so a browser holding a round 2 sandbox is told it was updated, as round 2 did for round 1. The notice, the sign-in line and Help name 28 October and the circular economy upgrade. Help, Updated on 28 October lists the round 3 changes and keeps the round 2 list below under "Earlier: Updated on 16 October". The round 2 list keeps its own title, `ROUND_2_TITLE`, so `whatChanged.test.ts` is unchanged.

- `src/store/upgrade.test.ts`:
  - "keeps the data of each version under its own key, and the session under the same key as before":
    - **What changed.** The version is 3, the key `tallyard-platform-v3-state`, the next key v4, and the earlier keys are those of versions 1 and 2.
    - **Why.** Round 3 raises the version.
    - **What still holds.** Each version has its own key; the session key is unchanged; every key starts with the app prefix.
  - "a replaced sandbox wins over a carried one, and a closed notice stays closed":
    - **What changed.** The carried notice reads the 28 October text.
    - **Why.** The notice names the latest update.
    - **What still holds.** Which notice wins, the closed state, and that the carried text never says work went back to sample data.
  - "reads plainly, with no forbidden characters":
    - **What changed.** The replaced notice reads the 28 October text.
    - **Why.** As above.
    - **What still holds.** No forbidden characters in any upgrade copy.
- `src/store/app.upgrade.test.ts`, "replaces a version 1 sandbox..." and "a write of this version from another tab is picked up":
  - **What changed.** This build's key is the v3 key, and the upgrade is recorded under `tallyard-platform-v3-upgraded`.
  - **Why.** The keys carry the version.
  - **What still holds.** An older sandbox is replaced and recorded; a version 1 write changes nothing; a write of this version is read.
- `src/features/help/upgrade.screen.test.tsx`:
  - **What changed.** Five tests read the 28 October notice and sign-in texts. The Help test reads "Updated on 28 October" first, with the matching link and the audits change among the others. It finds the round 2 links (Marketplace, programme) and "Sharing links" in the earlier section.
  - **Why.** The latest update leads and round 2 follows.
  - **What still holds.** The notice on every home, its link, staying closed, the sign-in explanations, and the round 2 links each opening.
- `e2e/r2-upgrade.spec.ts`:
  - **What changed.** The keys are v3, and the texts read 28 October. Help shows 4 round 3 changes for Priya, with the 7 round 2 ones under Earlier. A new test replaces a round 2 sandbox and opens the glossary.
  - **Why.** As above.
  - **What still holds.** Every journey: the replaced sandbox, the dead sign-in, signing up again, the carried sandbox keeping its work, the old tab beside the new one, and the reload offer.

**Added, not changed.** The privacy test also scans `projectIndicators`, `clientIndicators` and `ownerIndicators`.
