# SealForge workshop refinement

This is a temporary public design study, not the production brand kit.

## Direction

Keep the Round 3 seal character, key and signed-file story. Refine the working
flipper into a small maker's-stamp gesture. Reinforce **Forge** as a signing
workshop, not as forgery or a literal furnace. The restrained copper tool and
imprint connect the action to its result. The suggested headline is
**Your signing workshop.**

## Palettes

- **Coast & Copper** is the recommended study: muted petrol, restrained copper
  and warmer neutral surfaces.
- **Iris & Copper** stays closer to the Round 3 indigo family.
- `palette-study.json` contains proposed light/dark tokens. They are not active
  application configuration. Copper is a brand accent, not a warning/error color.
- Every palette variant uses the same alpha geometry. `artwork-manifest.json`
  records SHA-256 for the PNG artwork.

## Preview

- `index.html`: interactive palette and theme study, small sizes and usage scale.
- `concepts.png`: the two-palette presentation board.
- `refinement.png`: neutral before/after comparison with Round 3.
- `logo-*.png`, `symbol-*.png`, `tile-*.png`: raster study exports.

The latest-concepts entry mirrors this study. The previous `round-3/` page,
production landing pages, production assets and application are unchanged.
No database, signing service, account or mail sender is involved.

## Verification

```bash
NODE_PATH=/path/to/playwright/node_modules \
SITE_URL=http://127.0.0.1:4186/ \
CHROMIUM_PATH=/path/to/chrome \
node tests/concepts-round4.test.cjs
```

The test exercises both preview routes, four viewport widths, both palettes and
both modes, asset loading, palette/theme transitions, contrast, links and a
JavaScript-disabled fallback. It also verifies that the production theme storage
key is untouched. This is not a signing-application or mail-client test.

## Remaining work

The artwork is raster concept material. A canonical vector master, optically
simplified micro-icon, final asset-kit integration and trademark-similarity checks
are not part of this study. At 32 px the full scene loses tool/signature detail.
The email-scale preview has not been exercised in real mail clients. No final
palette selection or application-wide rollout is implied.
