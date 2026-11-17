# SealForge website

The product website is plain HTML, CSS and small preference scripts. There is no
framework, build step, backend, analytics or package dependency in the published
site. All five pages have complete English and Turkish copies.

## Pages

- `index.html` — the product overview, benefits and signing workflow.
- `details.html` — architecture, security boundaries, API integration and deployment.
- `development.html` — source access, licensing, building and contribution.
- `usage.html` — first use, administration, signing jobs and troubleshooting.
- `brand.html` — the approved identity and its current downloads.

The primary navigation has four destinations; the brand kit remains in the
footer. Every page shares the same local fonts, theme control and responsive
stylesheet. Content and navigation work without JavaScript. With storage blocked,
the theme control still works for the current page.

## Languages

English keeps the existing URLs; Turkish pages are under `tr/`. The top
English/Türkçe links work without JavaScript. With JavaScript, an explicit
`?lang=en|tr` wins, followed by a saved choice; otherwise a direct Turkish URL
stays Turkish, and English entry points negotiate the browser's supported
language (English fallback). Switching preserves the page and URL fragment.
Manual preference is carried through links when storage is blocked.

English HTML is the source. Turkish pages are generated, not runtime-replaced
strings. The private `sealforge-branding` repository owns the strict catalogs
under `tools/branding/locales/tr/`, the shared language script and generation
tools; those sources are also in the deliberately public editable-source ZIP.
After editing English content, update the Turkish catalog and regenerate the
site pages without rebuilding brand downloads:

```bash
python -c 'import sys; from pathlib import Path; sys.path.insert(0, "tools/branding"); import localize; localize.site(Path("/path/to/sealforge-site"))'
```

Run this from the branding repository. Missing translations stop generation.
Keep commands, API fields and `{{tokens}}` unchanged. Both supplied font files
contain Turkish glyphs.

## Source accuracy and access

The product copy is checked against the source at
`3b3d4139c60583293b69f0391ebf40dbd6bf47a6` on the SealForge feature branch,
including its architecture, API, development and operations documentation and
the corresponding implementation. A current source check is required when
changing a behavior, supported format, API field or operating instruction.

The product source carries Apache-2.0, but its GitHub repository is currently
private. Product links are explicitly marked as access-restricted. This public
website and its issue tracker are separate from product-source access. Do not
turn a license statement into a claim that an anonymous clone, installer or
product download is available.

The homepage screenshots use compiled components from the same feature commit
with fictional in-memory data; see `assets/screenshots/README.md`. They do not
demonstrate real signing or hardware. Website browser checks do not start the
application or access a database, signing token or worker.

## Identity assets

`assets/brand/` contains exports from the separate private `sealforge-branding`
repository's `tools/branding/cove.py`. Seal + Forge explains the name.
Manrope 600 carries brand/display text; Inter carries
body copy. Logo lettering is outlined. Do not independently redraw, recolor or
regenerate the website copies.

`assets/downloads/sealforge-downloads.json` is the current download catalogue.
The artwork, complete corporate set, stationery, digital kit and editable-source
ZIPs, brand-guide PDF and letterhead PDF retain their published addresses. They
are identity materials, not application source or installation packages.
Every ZIP includes the relevant English and Turkish outputs. Existing English
PDF links stay valid; Turkish adds `sealforge-brand-guidelines-tr.pdf` and
`sealforge-letterhead-tr.pdf`. Turkish pages link to their localized PDFs,
social image and email signature. Logos/icons are shared across languages.

Keep their manifests, font notices and required font files. Current icon/social
aliases under `assets/img/` are also retained. Website cleanup does not authorize
editing the product repository or regenerating its corporate documents.

## Local checks

Playwright and Chromium are verification tools only. Use an existing installation
and set their paths; do not install them into the published directory.

```bash
node --check assets/js/site.js
node --check assets/js/language.js
node --check tests/site.test.cjs
NODE_PATH=/path/to/playwright/node_modules \
CHROMIUM_PATH=/path/to/chrome \
python tools/test-local.py --evidence /path/to/evidence
# Same environment, focused negotiation/switching check:
python tools/test-local.py --evidence /path/to/language-evidence --test tests/language.test.cjs
# Screenshot, copy and heading-alignment checks:
python tools/test-local.py --evidence /path/to/finalization-evidence --test tests/finalization.test.cjs
```

The helper chooses an available loopback port, serves this repository, runs the
real browser matrix and closes its own server in `finally`. The matrix exercises
all maintained pages at 320, 390, 768, 1440 and 1920 pixels in both themes and
both languages (100 cases). It
checks navigation, required content sections, visible artwork, real loaded
fonts, document/header overflow, text contrast, links and anchors, download
bytes/checksums, no-JavaScript content and blocked-storage behavior. It records
JSON evidence, not screenshots.

To verify the real public deployment without local asset interception:

```bash
SITE_URL=https://semihkiroglu.github.io/sealforge-site/ \
SITE_EVIDENCE=/path/to/live-evidence \
NODE_PATH=/path/to/playwright/node_modules \
CHROMIUM_PATH=/path/to/chrome \
node tests/site.test.cjs
```

## Publication

GitHub Pages publishes `main`. The root `.nojekyll` marker keeps publication purely
static, without generating a default theme stylesheet or processing the HTML.
Push only the intended website changes, verify the
remote commit, require a successful Pages deployment for that exact SHA, then
compare public HTML/assets/downloads with committed bytes and run the HTTPS
browser matrix. An older successful deployment does not verify a new push.

The canonical origin is `https://semihkiroglu.github.io/sealforge-site/`. If a
custom domain is introduced, update page canonical/OG URLs, social metadata and
the email-signature image URL together.
