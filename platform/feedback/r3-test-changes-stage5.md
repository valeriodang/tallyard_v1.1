# Round 3 test changes, stage 5

Each line is one changed assertion, with the spec change behind it. Assertions that were only added are not listed. Spec: `BRIEF.md` section 15.6.

## Matching is built

- `src/store/selectors/views.test.ts`, "builds each role sidebar with badges":
  - **What changed.** The Matching child of a project now reads `soon: false`. It was `soon: true`.
  - **Why.** Design from stock is built on the Matching tab: the architect loads a steel schedule and matches it against stock. Only whole-model BIM matching stays in version 2, and the page says so in its own card.
  - **What still holds.** The tab keeps its label, place and address, and the other children are unchanged.

## Nothing else changed

Every other stage 5 test is new:

- the recovery engine and plan;
- the matcher's cut, offcut and excess options, which leave the seeded schedule's result unchanged with no option set;
- the schedule reader;
- the deal terms engine and the banded seller view;
- portfolio-first and own-lot allocation;
- the privacy additions;
- the screen tests;
- `e2e/r3-stage5.spec.ts`.

The refusal to request your own lot (`RESERVATION_ERRORS.ownLot`) still holds. Allocation is a separate action.
