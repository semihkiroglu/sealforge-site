# Round 6 — A's integrity, a lighter touch

Pre-final exploration only. No new kit or production theme/brand change.

## One geometry, two stamp treatments

The selected natural-profile A composition is retained: visibly held key, working
flipper, press and signed file. The press and document are smaller and the outline
is lighter. The **quiet tool** is recommended: petrol integrates the press into
the character, and only the resulting imprint is copper. The copper-tool option
uses exactly the same alpha geometry for a controlled comparison.

The small icon is the actual face from the main drawing; only the neck is closed.
No alternate head/tool/paper scene is introduced. `refinement.png` compares Round 5
A and the new drawing. Artwork is still raster, not a final vector master or
finished 16 px favicon.

## Palette recommendation

Coast & Copper with neutral surfaces:

- Light: page `#F7F8F5`, card `#FFFFFF`, ink `#203033`, muted `#56666A`,
  primary `#316B73`, imprint `#9F542E`.
- Dark: page `#151B1D`, card `#1C2426`, ink `#EEF5F3`, muted `#A7BCBB`,
  primary `#87C2C6`, imprint `#E5AD7D`.
- Dark primary buttons need charcoal text, not white. Copper is not a replacement
  for semantic warning/error colors.
- Interactive input outlines use `#7A8A8C` / `#7E8F94`, separate from decorative
  dividers. Filled semantic chips retain green/red hue families with readable
  label colors; see the `semantic` section in `palette.json`.
- All eight current component captures pass the normal-text scan; filled chips
  and 3:1 input boundaries are also checked separately. Six hover states pass.
  These are sampled-component checks, not whole-application WCAG certification.
- `palette.json` contains proposed tokens. `contrast.json` records recomputed
  normal-text color pairs using sRGB relative luminance and a 4.5:1 threshold.

## Application context

The application images are browser captures of actual compiled Razor components
with isolated preview CSS and fixture authentication/data services. Read
`application-evidence.json` for the verified source scope and test boundary. They
are not a deployed production theme, real job activity, login/MFA verification or
physical-token signing evidence. No PostgreSQL access is part of this study.

## Check

```bash
NODE_PATH=/path/to/playwright/node_modules \
SITE_URL=https://semihkiroglu.github.io/sealforge-site/ \
node tests/concepts-round6.test.cjs
```

The preview supports light/dark and quiet/copper-tool comparisons without changing
the production theme storage key. The previous rounds and production assets stay
unchanged. Trademark clearance, final vector cleanup and tiny-pixel optical work
are not claimed.
