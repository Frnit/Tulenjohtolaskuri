# Own-position coordinate input

Change identifier: `CHG-POSITION-INPUT-001`.

`REQ-POSITION-INPUT-001` adds MGRS as an alternative to the existing WGS84
own-position input. WGS84 remains the default and GPS selection returns the UI
to WGS84. MGRS parsing and conversion are local runtime code, so the workflow
does not require a network service.

The accepted MGRS form contains a UTM zone from 1 to 60, a latitude band from C
to X (without I or O), a valid 100 km grid square and zero to five equally sized
easting and northing digit groups. The conversion uses the centre of the stated
grid square. Invalid input remains local to the position field and clears the
derived target coordinate.

The supported latitude range is the UTM part of MGRS, 80°S through 84°N. Polar
UPS grid zones are outside this change.

Acceptance evidence:

- `tests/target/coordinates.node.test.mjs` checks published GeographicLib
  MGRS/UTM vectors, validation and round-trip accuracy;
- `tests/target/position-input.pw.spec.mjs` checks MGRS selection, accepted and
  rejected input, retained WGS84 behavior and GPS fallback;
- `tests/pwa/current-release.pw.spec.mjs` verifies the new module is available
  in the complete offline Core.

The conversion vectors and centre-of-square rule come from GeographicLib's
[GeoCoords examples](https://geographiclib.sourceforge.io/2009-03/classGeographicLib_1_1GeoCoords.html)
and [MGRS API documentation](https://geographiclib.sourceforge.io/2009-03/classGeographicLib_1_1MGRS.html).
