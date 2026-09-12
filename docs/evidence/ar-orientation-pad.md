# AR measurement-frame orientation evidence

Change: `CHG-AR-ORIENTATION-PAD-001`

Requirement: `REQ-AR-TARGET-ORIENTATION-001`

The AR view keeps the measurement frame centered and adds a cross-shaped manual
control. Left and right rotate the frame by five degrees per press. Up and down
change elevation by one degree per press. Reset clears both manual corrections.
Rotation is bounded to ±90 degrees and effective elevation to ±89 degrees.

When orientation samples contain beta and gamma values, the adapter derives the
rear camera optical-axis elevation. The displayed elevation is that sensor value
plus the manual correction. Without an orientation sensor, the base is zero and
the same buttons provide the full elevation value.

The AR result remains a line-of-sight distance. Selecting **KÄYTÄ & PALAA** writes
a verified version-1 session envelope containing the distance and elevation. Main
consumes it once, opens the size workflow, fills `knownDist` and `elev`, and removes
both the envelope and the legacy scalar distance. The legacy distance remains in
parallel for compatibility during this change.

Executable evidence:

- `tests/target/browser-adapters.node.test.mjs` checks level, upward and downward
  optical-axis samples.
- `tests/target/ar-orientation-pad.pw.spec.mjs` checks the mobile control layout,
  bounded rotation, manual elevation, unchanged range and end-to-end handoff.
- `tests/target/startup.pw.spec.mjs` checks direct one-time consumption of the
  versioned handoff.

Perspective and foreshortening correction remain in
`REQ-AR-PERSPECTIVE-CORRECTION-001`. That work depends on future image recognition
because the current manual rotation provides no evidence of the target's 3D pose.
