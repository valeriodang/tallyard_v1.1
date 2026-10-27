# Round 3 test changes, stage 3

Each line is one changed assertion, with the spec change behind it. Assertions that were only added are not listed. Spec: `BRIEF.md` section 15.4.

## The contractor's tabs and the owner's Destinations tab

**What changed.**
- The deconstruction contractor gets Method and Destinations after Availability.
- A surveying firm appointed contractor gets the same two tabs after its Availability tab.
- The owner gets Destinations, read only, before Requirements.
- A contractor holding title to the arisings also gets Listings and Sharing. That case is covered by new tests only.

**Assertions updated.** The expected tab lists gain these tabs in these places. Nothing else in these assertions changed.
- `src/store/selectors/owner-surveyor.selectors.test.ts`:
  - "reads Recovery plan for the owner and follows each side": the owner list, the surveyor-as-contractor list and the contractor list.
  - "gives a contractor its Availability tab": Fennick's tabs on Tiverne House, and Dana's as contractor.
  - "gives the owner Donor buildings with Recovery plan, then New projects and the marketplace once it has one": the donor building's tabs.
- `src/store/selectors/requirements-followup.test.ts`, "badges the Requirements tab and its sidebar item for the owner and the surveyor": `['destinations', null]` before Requirements. The Requirements badge is unchanged.
