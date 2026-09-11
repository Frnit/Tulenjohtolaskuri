# Release fixtures

P2.1 uses the checked-out baseline as the only served release. Future PWA work
may add self-contained `v1` and `v2` fixture roots here for waiting-worker,
failed-precache, open-tab, and rollback scenarios. The test server accepts a
different `--root` without requiring another server dependency.
