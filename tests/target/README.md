# Accepted target behaviour

Tests in this directory require an accepted product requirement, approved defect
fix, or test-harness invariant. These are the only tests that assert intended
target behaviour.

The Node wrapper fails when a requested class discovers no tests. Only a deliberately
empty class may opt in with `--allow-empty`; the repository's Node defect stage is the
current intentional exception.

P2.3 persistence targets verify versioned records, independent legacy migration,
corruption and storage-failure isolation, empty collections, owned-key reset, and
the application storage boundary.

P2.4 UI targets verify that stored user text remains text, obsolete calculation
outputs are removed when their inputs become unavailable, and a recoverable UI
failure does not stop unrelated controls.

P2.5 browser-adapter targets verify missing and denied sensor fallbacks, explicit
orientation permission, camera freeze versus release, and resource cleanup on
`pagehide`.

P2.6 PWA targets verify release-metadata consistency, explicit waiting-worker
activation, complete offline-Core installation, cache ownership, manifest scope
and visible update/offline status. Browser lifecycle scenarios remain in
`tests/pwa` so they run once in the dedicated single-worker PWA stage.

`REQ-EXAMPLE-SIZE-LABELS-001` verifies that every built-in target example names
its measured dimension, metre value and the calculation workflow that consumes
that value on both the main and AR pages.

`ACC-POSITION-INPUT-001` verifies the WGS84/MGRS own-position contract with
published conversion vectors and browser workflow coverage.

`ACC-AR-ORIENTATION-001`, `ACC-AR-ELEVATION-001` and `ACC-AR-HANDOFF-002`
verify the bounded two-axis AR control, sensor-based elevation with manual
correction, and one-time transfer of both line-of-sight distance and elevation
to the main size workflow.
