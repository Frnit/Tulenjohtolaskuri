# Release 0.3.0

Release source: `8c4ab22048662aef5605f4dd79705ab36fd1328f` (`next`).

Rollback source: `5a5f78daa400e4dee6252c236735b8a037e46289`
(the current P2.1–P2.2 production release on `main`).

Release `0.3.0` promotes the Phase 2.1–2.6 changes and the accepted product
requirements present at the release source. The published build identifier is
`0.3.0-build.1`; it advances from every integration build so installed clients
receive a distinct cache and an explicit update prompt.

The release includes:

- the fail-closed automated evidence harness;
- corrected startup and AR-to-main distance handoff;
- guarded, versioned persistence and safe UI rendering;
- browser sensor adapters with manual fallbacks and deterministic cleanup;
- the versioned offline-Core update and rollback lifecycle;
- explicit built-in target dimensions; and
- WGS84 and validated MGRS own-position input.

The release promotion changes only release metadata, its acceptance assertion
and this evidence record. The application behavior is the accepted `next`
source identified above.
