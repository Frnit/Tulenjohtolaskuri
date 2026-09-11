# PWA characterization

These Playwright checks run through the local HTTP test server with service workers
enabled. They record the current baseline and do not claim physical Android or
installed-PWA compatibility.

P2.3 extends the existing precache only with the three local scripts required by
the main page. Cache ownership, lifecycle versioning, AR assets, and update/rollback
behavior remain P2.6 work.
