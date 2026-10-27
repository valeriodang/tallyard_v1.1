# Round 3 test changes, stage 4

Each line is one changed assertion, with the spec change behind it. Assertions that were only added are not listed. Spec: `BRIEF.md` section 15.5.

## The material page gains a quality section

- `src/features/material/material.screen.test.tsx`, "leads with the 3D view, then save and downloads, availability, sustainability, key facts and the specification":
  - **What changed.** The leading headings are now Availability, Sustainability, Key facts, Quality and assurance, Specification. They were the first four, without Quality and assurance.
  - **Why.** Buyers read the assurance tier, processing, warranty, steel codes and hazards right after the key facts.
  - **What still holds.** The order of the other sections is unchanged.

## The public listing gains a key

- `src/domain/privacy/privacy.test.ts`, the test once titled "P1 every seeded projection has exactly the 21 keys and none of the private strings":
  - **What changed.** The title now reads "exactly the public keys (22 since round 3)".
  - **Why.** `PublicListing` gains `quality`, built only from fixed values.
  - **What still holds.** The assertion is unchanged. It still compares each projection's keys with `PUBLIC_LISTING_KEYS`, which now lists 22.
