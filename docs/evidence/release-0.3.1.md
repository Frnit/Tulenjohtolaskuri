# Release 0.3.1

Release source: `82b6938d8fcf44b6f0808fd6b93c9603fa84d0cd` (`next`).

Rollback source: `e7eaa48e146f28e1da0bc81cc186595ecb7b1707`
(the current `0.3.0` production release on `main`).

Release `0.3.1` promotes the accepted AR orientation and elevation controls
present at the release source. The published build identifier is
`0.3.1-build.1`; it advances from the previous release and every integration
build so installed clients receive a distinct cache and an explicit update
prompt.

The release includes:

- bounded manual rotation of the centered AR measurement frame;
- orientation-based rear-camera elevation with manual correction and fallback;
- versioned distance and elevation handoff from AR to the main workflow; and
- the complete `0.3.0` offline Core and accepted application behavior.

The release promotion changes only release metadata, its acceptance assertion
and this evidence record. The application behavior is the accepted `next`
source identified above.
