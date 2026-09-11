# P2.1 software-evidence traceability

Baseline for every row: `797d77ff72d28c5a1e88b82e4155c2d0de93dbd2`.

Passing characterization or defect evidence means that the named baseline behavior
was reproduced. It does not approve that behavior as a product requirement.

| ID | Class | Source evidence | Executable evidence | Current baseline result | Future use |
| --- | --- | --- | --- | --- | --- |
| `BASE-001` | Baseline | Audited commit and source hashes | `tests/characterization/baseline-source.node.test.mjs` | Exact production files are recoverable from the audited commit | Guard every controlled change |
| `CHAR-START-001` | Characterization | Phase 0 startup finding | `tests/characterization/startup.pw.spec.mjs` | Targets initialize, profile initialization raises `updateSel is not defined`, and calculation is not reached | Compare startup changes |
| `DEF-START-001` | Known defect | Phase 0 startup defect | `tests/defects/startup.pw.spec.mjs` | Profile population and incoming AR value consumption are blocked | Convert to a target regression test after an approved fix |
| `CHAR-STORAGE-CORRUPT-001` | Characterization | Phase 0 storage finding | `tests/characterization/storage.pw.spec.mjs` | Malformed target or profile JSON raises a parse error at its current evaluation point | Input for P2.3 storage requirements |
| `CHAR-STORAGE-EMPTY-001` | Characterization | Phase 0 storage finding | `tests/characterization/storage.pw.spec.mjs` | Main renders only its placeholder; AR has no selection and raises while reading it | Input for P2.3 storage requirements |
| `CHAR-STORAGE-FAULTS-001` | Accepted harness capability | Phase 1 testability requirement | `tests/browser/storage-harness.pw.spec.mjs` | Harness deterministically supplies missing, read-error, write-error and quota-error cases | Exercise approved P2.3 behavior |
| `CHAR-UI-VIEW-001` | Characterization | Phase 1 workflow inventory | `tests/characterization/view-switch.pw.spec.mjs` | Current tab, input-view and result-group visibility is recorded | Preserve workflows without freezing visual layout |
| `DEF-UI-VIEW-001` | Known defect | Phase 0 UI finding | `tests/defects/view-switch.pw.spec.mjs` | Size calculation consumes optics fields that are hidden with the distance view | Convert after an approved UI fix |
| `CHAR-HANDOFF-001` | Characterization | Phase 0 AR/main finding | `tests/characterization/handoff.pw.spec.mjs` | AR writes scalar `tj_incoming_dist`; main startup fails before consuming or deleting it | Input for the future handoff envelope |
| `CHAR-RESET-001` | Characterization | Phase 0 storage finding | `tests/characterization/reset.pw.spec.mjs` | Reset clears every key in the origin LocalStorage namespace | Input for scoped reset design |
| `SEC-RENDER-001` | Known security defect | Phase 0 rendering finding | `tests/defects/safe-rendering.pw.spec.mjs` | A harmless user-defined markup marker becomes an element through `innerHTML` | Convert after an approved safe-rendering fix |
| `CHAR-PWA-001` | Characterization | Phase 0 service-worker finding | `tests/characterization/baseline-source.node.test.mjs`, `tests/pwa/current-baseline.pw.spec.mjs` | Cache name, three precache entries, registration and offline index reload are reproduced; AR and icon are absent | Extend with versioned release fixtures |
| `CHAR-PWA-OWNERSHIP-001` | Characterization | Phase 0 cache-ownership finding | `tests/pwa/current-baseline.pw.spec.mjs` | Global `caches.match` can return a response placed in another cache | Input for future cache ownership rules |
| `REQ-OFFLINE-CORE-001` | Accepted target | Product-owner offline-Core constraint | `tests/target/harness-invariants.node.test.mjs` | Production HTML has no external runtime script or stylesheet dependency | Retain for later changes |
| `REQ-WORKFLOW-001` | Accepted target | Phase 1 accepted two-workflow requirement | `tests/target/workflow.pw.spec.mjs` | Both main workflows can be selected | Retain without asserting historical pixel layout |

Future changes should add the approved `CHG` or `ADR` identifier and the resulting
`ACC` test to the relevant row. When a defect is fixed, its positive defect-signature
test must fail until it is replaced by an accepted target regression test.
