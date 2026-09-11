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
