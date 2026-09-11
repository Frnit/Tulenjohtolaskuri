# Accepted target behaviour

Tests in this directory require an accepted product requirement, approved defect
fix, or test-harness invariant. These are the only tests that assert intended
target behaviour.

The Node wrapper fails when a requested class discovers no tests. Only a deliberately
empty class may opt in with `--allow-empty`; the repository's Node defect stage is the
current intentional exception.
