# PWA acceptance evidence

These Playwright checks run through the local HTTP test server with service workers
enabled. They verify the accepted P2.6 install, offline, update, open-tab,
failed-update, rollback and cache-ownership contracts. They do not claim physical
Android or installed-PWA compatibility.

The historical PWA behavior remains recorded by the immutable baseline source
test. The tests in this directory now assert the accepted target behavior.
