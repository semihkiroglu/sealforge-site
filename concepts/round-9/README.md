# Round 9 — A more natural line

Isolated raster identity study. The production head, application, welcome page,
corporate templates and download packages are deliberately unchanged.

## Direction

The existing seal head remains the primary logo. These three secondary studies
explore different head angles and their matching complete seal: a leaner body,
no anthropomorphic arms, no signing props, and a few restrained anatomical lines.
The automotive-animal reference concerns flowing, economical contours, not a copy
of another brand's animal, posture or identity.

- **A / Glide:** right profile; the clearest link to the original face. Preferred
  starting point for large-format illustration; its long silhouette needs width.
- **B / Turn:** three-quarter head; more depth and muzzle detail. The face is less
  literal to the current profile and needs judgment at final drawing time.
- **C / Lookout:** near-frontal head; quieter expression. More suitable for a
  portrait focal point, but its character departs further from the current mark.

Each head detail is cropped from its own complete figure, not generated separately.
The crops are head studies, not finished closed-contour icons. Both composition
formats preserve image aspect ratio and continue to use the existing primary head.

## Colour and evidence

`palette.json` contains the existing canonical light/dark tokens without changes.
`assets/primary-head-*.svg` are byte-identical copies of the existing head assets.
Each candidate uses one alpha mask for light and dark, tinted with the actual
canonical petrol/mint RGB values. Copper stays in the layout accents.
`study.json` records source hashes, crop bounds and delivered-file hashes.

The candidate drawings are AI-assisted raster concepts, not final SVG artwork,
production-ready small icons, print proofs, or trademark-clearance evidence.
No corporate kit regeneration or application rollout is authorized by this demo.

Open `index.html`, choose a head, compare horizontal/vertical layouts and toggle
the study tone. The controls do not read or write the product's theme storage.
With JavaScript disabled, all three paired-figure links and the default study work.

Browser contract: `tests/concepts-round9.test.cjs`, run with the existing
`tools/test-local.py --test tests/concepts-round9.test.cjs --evidence <path>`.
