# Round 3 test changes, stage 1

Each line is one changed assertion, with the spec change behind it. Assertions that were only added are not listed. Spec: `BRIEF.md` section 15.

## Baseline fix before any round 3 code

- `e2e/r2f-owner.spec.ts`, "both sides see what was asked of the testing company, and no owner is promised on an unlinked building":
  - **What changed.** The preferred date was typed as `2026-10-20` and expected as "Preferred from 20 October 2026". It is now two weeks after the day the test runs, and the expected text is built from the same date.
  - **Why.** `requestTesting` refuses a preferred date before today (`TESTING_ERRORS.pastDate`), and the e2e app runs on the real clock. From 21 October 2026 the request was refused, so the test failed on the unchanged round 2 build.
  - **What still holds.** The test checks the same message, preferred date line, sheet and download.

## The carbon method and values (BRIEF 15.2)

**What changed in the method and values.**
- Reclaimed steel goes from 0.05 to 0.0466 tCO2e per tonne (published declaration).
- Reclaimed brick goes from 0.005 to 0.0027 (published declaration).
- The raised floor panel goes from 12 kg to 9.3 kg (London pre-demolition audit).
- New curtain wall travels the RICS European default: 1,500 km by road and 100 km by sea. It was 120 km by road.
- Nothing else in the formula changed.

**How the new expected values were found.** Each one was recalculated by hand from the published formula, in a scratch script outside the repository, not copied from the app:
- A1 to A3 new = quantity x factor new;
- A4 new = mass x (road km x 0.1065 + sea km x 0.0161) / 1000;
- the same two terms for the reclaimed product at its distance.

The B-series tests come from the demo's worked examples (`brief/07-EXAMPLES.md`). The examples themselves are unchanged; the platform has moved on from them, as round 3 asks.

**Engines** (`src/domain/engines/`)

`carbon.test.ts`:
- B2.1 TH-01 at listing: A1 to A3 reuse 1.2078 becomes 1.1257; avoided 41.0037 becomes 41.0859; percent 96.8 becomes 97.0.
- B2.2 R1 allocation: A1 to A3 reuse 1.2078 becomes 1.1257; avoided 39.3101 becomes 39.3922; percent 96.7 becomes 96.9.
- B2.3 via Tilbury: avoided 39.2947 becomes 39.3768; percent 96.7 becomes 96.9.
- B2.4 via Barking: avoided 39.3384 becomes 39.4205; percent 96.8 becomes 97.0.
- B2.5 direct: avoided 39.4156 becomes 39.4977; percent 97.0 becomes 97.2.
- B2.6 TH-08, curtain wall: A4 new 0.2961 becomes 3.7381 (European transport); avoided 78.0947 becomes 81.5367; percent 92.4 becomes 92.7.
- B2.7 TH-11, raised floor: A4 new 0.4601 becomes 0.3566 and A4 reuse 0.1917 becomes 0.1486, because the mass is 27.9 t, not 36 t; avoided 34.1804 becomes 34.12.
- B2.8 TH-12: A1 to A3 reuse 0.2213 becomes 0.2062; avoided 7.5123 becomes 7.5273; percent 96.8 becomes 97.0.
- B2.12 matcher summary: 79.7105 becomes 79.8849, and the title changes with it.

`mass.test.ts`:
- B1.11 TH-11: 36.000 t becomes 27.900 t, which is 3,000 panels at 9.3 kg. The area of 1,080 m2 is unchanged.
- B1.14 OS-22: 45.600 t becomes 35.340 t, which is 3,800 panels. The area of 1,368 m2 is unchanged.

`priority.test.ts`: the rank order is unchanged.
- The carbon column follows B2: TH-02 84.5903, TH-06 58.8795, TH-01 41.0859, TH-08 81.5367, TH-04 69.1908, TH-05 41.37, TH-03 41.1489, TH-11 34.12, TH-10 10.0167, TH-12 7.5273.
- Scores that move: TH-07 57.817 becomes 57.813; TH-08 50.571 becomes 51.736; TH-11 37.364 becomes 37.318; TH-09 27.588 becomes 27.537; TH-10 24.797 becomes 24.828.
- The steel scores keep their values because the largest carbon value is still steel (TH-02), so their shares do not move.
- The score titles follow.

`matcher.test.ts`: B7.7 summary 79.7105 becomes 79.8849, the same allocation as B2.12.

`specSheet.test.ts`: L-9F4CQQ's avoided carbon line '41.0 tCO2e, 96.8% of new' becomes '41.1 tCO2e, 97.0% of new'.

`billImport.test.ts` B3.3, the donor's potential benefit of off-site reuse (module D):
- brick 7.6544 becomes 7.739 (36.8 t x 0.2103);
- steel 358.956 becomes 359.678 (212.4 t x 1.6934);
- raised floor quantity 864 becomes 1,115 m2, because lighter panels mean more of them per tonne, and its benefit 27.1296 becomes 35.0059;
- total 461.42909 becomes 470.11223.

**Privacy**

`src/domain/privacy/privacy.test.ts` B15.1: TH-01's public avoided carbon 41.0037 becomes 41.0859.

**Store** (`src/store/selectors/`)

- **Seeded deals.** Their mass and carbon were literals and are now worked out by the engine at their confirmed distances (stone 39 km, raised floor 49 km).
  - The stone deal is unchanged at 4.4974.
  - The raised floor deal goes from 45.6 t and 43.3 tCO2e to 35.34 t and 43.2224 tCO2e.
- **Approved not yet reserved.** 100.8227 becomes 101.0247, which is TH-02's 84.5903 plus a steel line's 16.4344.
- **Consequences** of those two changes:
  - secured carbon 47.7974 becomes 47.7199, shown as 47.8 becoming 47.7;
  - the total once reserved 148.6 becomes 148.7.

The files:
- `client-dashboard.test.ts`: secured 47.7974 becomes 47.7199; approved 100.8227 becomes 101.0247.
- `r2f-client-consultant.test.ts`: '47.8 tCO2e' becomes '47.7 tCO2e'; '47.8' becomes '47.7'; approved 100.8227 becomes 101.0247.
- `r2f-look.test.ts`: approved '100.8' becomes '101.0'.
- `sustainability-screens.test.ts`:
  - the approvals strip goes from close to 20.7 to close to 20.8 (20.7249 becomes 20.7664);
  - reservation rows '84.4 tCO2e' become '84.6 tCO2e', and '16.4 tCO2e' is unchanged.
- `sustainability.test.ts`:
  - the goal row '47.8 tCO2e' becomes '47.7 tCO2e', and its share 0.3186 becomes 0.3181;
  - the statement '47.8 tCO2e' becomes '47.7 tCO2e', and '148.6 tCO2e' becomes '148.7 tCO2e';
  - secured 47.7974 becomes 47.7199, twice;
  - the waiting avoided carbon 20.7249 becomes 20.7664;
  - the reservation rows '96.8% less than new' become '97.0% less than new', twice.

**Screens**

- `src/features/home/r2f-look.screen.test.tsx`: the product shot '100.8' becomes '101.0'.
- `src/features/sustainability/r2f.screens.test.tsx`: the carbon meter '47.8' becomes '47.7'.
- `src/features/sustainability/sustainability.screens.test.tsx`: the client metric '47.8' becomes '47.7'.

**End-to-end**

- `e2e/r2f-look.spec.ts`: the product shot '100.8' becomes '101.0'.
