# Round 3 test changes, stage 2

Each line is one changed assertion, with the spec change behind it. Assertions that were only added are not listed. Spec: `BRIEF.md` section 15.3.

## The Audits tab on every building

**What changed.** Every side of a donor building gets an Audits tab:
- the owner and the surveyor, after Inventory, because the pre-deconstruction audit builds on the surveyed items;
- the contractor, after Availability.

**Assertions updated.** The expected tab lists gain `Audits` (or `audits`) in that place. Nothing else in these assertions changed.
- `src/store/selectors/owner-surveyor.selectors.test.ts`:
  - "reads Recovery plan for the owner and follows each side":
    - the owner, surveyor and contractor lists;
    - the index of the Recovery plan tab, read for its href, moves from 2 to 3.
  - "gives the surveyor Capture and the unconfirmed buildings": the tabs of the unconfirmed building.
  - "gives a contractor its Availability tab": the contractor's tabs and Dana's tabs as contractor.
  - "gives the owner Donor buildings with Recovery plan, then New projects and the marketplace once it has one": the donor building's tabs.
- `src/store/selectors/requirements-followup.test.ts`, "badges the Requirements tab and its sidebar item for the owner and the surveyor": `['audits', null]` after the inventory. The Requirements badge is unchanged.

## Notification settings

- `src/store/selectors/views.test.ts`, "groups notifications by day with relative times and per-person read state":
  - **What changed.** The owner's notification settings end with `audit`.
  - **Why.** Completing an audit tells the building's other sides, owners included (BRIEF 15.3).
  - **What still holds.** The order of the earlier kinds is unchanged.

