# Example size labels

Change identifier: `CHG-EXAMPLE-SIZE-LABELS-001`.

`REQ-EXAMPLE-SIZE-LABELS-001` keeps the existing example measurements while
making each assumption visible at the point of selection. A label now states:

- the example target;
- whether the value is a width or height;
- the value in metres; and
- whether the value feeds the main distance calculation or the AR distance
  calculation.

Targets without dimension metadata retain their previous display and storage
shape. The PWA build and asset-manifest identifiers were advanced because the
offline Core gained `src/domain/targets.js` and changed both HTML entry points.

Acceptance evidence: `tests/target/example-size-labels.pw.spec.mjs`.
