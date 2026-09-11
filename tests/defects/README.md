# Known baseline defect evidence

Tests in this directory make exact assertions about independently identified
baseline failures. A passing test means `KNOWN BASELINE DEFECT REPRODUCED`, not
that the behaviour is accepted.

Each browser reproducer asserts the complete allowed `pageerror` set. A missing
expected error or any additional error is an unexpected failure.

When a defect is fixed, its reproducer must fail and be replaced or moved by an
accepted target-behaviour regression test linked to the approved change.
