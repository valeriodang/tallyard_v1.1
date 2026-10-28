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
