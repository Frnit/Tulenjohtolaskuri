# Known baseline defect evidence

Tests in this directory make exact assertions about independently identified
baseline failures. A passing test means `KNOWN BASELINE DEFECT REPRODUCED`, not
that the behaviour is accepted.

When a defect is fixed, its reproducer must fail and be replaced or moved by an
accepted target-behaviour regression test linked to the approved change.

