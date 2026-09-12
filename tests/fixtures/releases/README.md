# Release fixtures

P2.6 creates disposable release roots during the Playwright run. Each root uses
the production worker and PWA client with deterministic V1, V2, failed-update
and rollback metadata. This keeps generated cache content out of Git while the
checked-in test defines the complete fixture contract.
