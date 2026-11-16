# Round 10 — Glide with a familiar baseline

Three heads, side by side:

1. The current primary head, unchanged.
2. The original Round 9 Glide head detail, unchanged.
3. Glide with the retained head's curved lower closure and a closed rear neckline.

This is a focused refinement, not another set of poses or an identity rollout.
The full Glide figure is the unchanged Round 9 raster; its natural neck is not
interrupted with an artificial horizontal line. The baseline is for the standalone head.

## Exact transfer, not a new generated face

The baseline's two outer Bezier segments and inner horizontal edge are extracted
from the existing primary SVG and uniformly scaled. A short rear-neck connector
removes the body-crop fragment and completes the silhouette. The eye, nose, muzzle
and whisker region remains byte-identical to the original Glide raster alpha.
The edit opacity follows the source raster stroke rather than leaving a dark
vector-cap seam. Light/dark variants share one alpha mask and the unchanged palette.

`study.json` records the exact baseline path, transform, unchanged face region,
output crop and delivered file hashes. `baseline-layer.svg` is only the vector
edit layer: it is not a full vector version of the refined head.

The production logo, corporate packages, application and older round pages are
not replaced. Final whole-logo vector cleanup, small-icon optics and print proof
are outside this demo.
