# Round 8 — centered line, closed paper joins

Two localized fixes over Round 7; the character and palette are retained.

- The added copper line is centered on the **actual press-base bounds**, not
  estimated coordinates. It remains a separate line below the petrol press.
- The paper edge reaches both outside rails of the stem. A filled stem occluder
  hides the line inside the stamp, so there is no gap or crossbar.
- The press retains its petrol ink and opaque source pixels. Antialiased edge
  coverage may change where the completed paper line meets the stem.
- Native-mask regressions reproduce Round 7's offset and gap, then verify the
  correction and preserve the hollow stem. See `refinement.json` for measurements.
- Light/dark mark, detail, lockup and one-ink exports share the correction.

No new palette, application fixture, production integration or final kit.
The application palette context remains in Round 6. This is raster preview art,
not a final vector master, finished tiny icon or trademark-clearance result.
