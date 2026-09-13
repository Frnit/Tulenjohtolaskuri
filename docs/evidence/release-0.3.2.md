# Release 0.3.2

Release candidate source: `f43800d9bab7a3e69261708eef973c51925b8094` (`release/0.3.2`).

Rollback source: `82b6938d8fcf44b6f0808fd6b93c9603fa84d0cd`
(the accepted 0.3.1 application source).

Release `0.3.2` publishes the accepted bounded UI and camera-diagnostics
maintenance. The published build identifier is `0.3.2-build.1`; it advances
the service-worker cache identity so installed clients receive an explicit
update prompt.

The release includes:

- neutral position-input guidance that distinguishes format help from stored
  user data without changing coordinate handling;
- visible direction-unit labels with their existing value mappings;
- a separate AR camera-check view showing permission state and browser-reported
  active video resolution and frame rate when available;
- accessible camera diagnostics modal focus and Escape handling; and
- AR version/status placement in the controls area with responsive landscape
  overflow handling.

Camera diagnostics report browser metadata only. Physical sensor size and
field of view remain unavailable, and no diagnostic value feeds range,
coordinate, orientation or location calculations.

The release candidate passed the complete local evidence suite:

- `pnpm run test:node:characterization`
- `pnpm run test:node:defects`
- `pnpm run test:target`
- `pnpm run test:browser:characterization`
- `pnpm run test:browser:defects`
- `pnpm run test:browser:target`
- `pnpm run test:pwa`
