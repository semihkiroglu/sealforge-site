# SealForge website

The product website is plain HTML, CSS and a small theme script. There is no
framework, build step, backend, analytics or package dependency in the published
site. All public copy is English.

## Pages

- `index.html` — the product overview, benefits and signing workflow.
- `details.html` — architecture, security boundaries, API integration and deployment.
- `development.html` — source access, licensing, building and contribution.
- `usage.html` — first use, administration, signing jobs and troubleshooting.
- `brand.html` — the approved Cove identity and its current downloads.

The primary navigation has four destinations; the brand kit remains in the
footer. Every page shares the same local fonts, theme control and responsive
stylesheet. Content and navigation work without JavaScript. With storage blocked,
the theme control still works for the current page.

## Source accuracy and access

The product copy is checked against the source at
`b63fdf27dce10999c2071dcb0ec55a4bf778ab1e` in the SealForge product repository,
including its architecture, API, development and operations documentation and
the corresponding implementation. A current source check is required when
changing a behavior, supported format, API field or operating instruction.

The product source carries Apache-2.0, but its GitHub repository is currently
private. Product links are explicitly marked as access-restricted. This public
website and its issue tracker are separate from product-source access. Do not
turn a license statement into a claim that an anonymous clone, installer or
product download is available.

The application UI is still being finalized. The maintained pages contain no
outdated interface previews or invented product screenshots. Website browser
checks do not start the application or access a database, signing token or worker.

## Identity assets

`assets/brand/` contains the canonical Cove exports from the product's
`tools/branding/cove.py`. Manrope 600 carries brand/display text; Inter carries
body copy. Logo lettering is outlined. Do not independently redraw, recolor or
regenerate the website copies.

`assets/downloads/sealforge-downloads.json` is the current download catalogue.
The artwork, complete corporate set, stationery, digital kit and editable-source
ZIPs, brand-guide PDF and letterhead PDF retain their published addresses. They
are identity materials, not application source or installation packages.

Keep their manifests, font notices and required font files. Current icon/social
aliases under `assets/img/` are also retained. Website cleanup does not authorize
editing the product repository or regenerating its corporate documents.

## Local checks

Playwright and Chromium are verification tools only. Use an existing installation
and set their paths; do not install them into the published directory.

```bash
node --check assets/js/site.js
node --check tests/site.test.cjs
NODE_PATH=/path/to/playwright/node_modules \
CHROMIUM_PATH=/path/to/chrome \
python tools/test-local.py --evidence /path/to/evidence
```

The helper chooses an available loopback port, serves this repository, runs the
real browser matrix and closes its own server in `finally`. The matrix exercises
all maintained pages at 320, 390, 768, 1440 and 1920 pixels in both themes. It
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
