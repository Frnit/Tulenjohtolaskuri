# Phase 2 software-evidence traceability

Baseline for every row: `797d77ff72d28c5a1e88b82e4155c2d0de93dbd2`.

Passing characterization or defect evidence means that the named baseline behavior
was reproduced. It does not approve that behavior as a product requirement.

| ID | Class | Source evidence | Executable evidence | Current baseline result | Future use |
| --- | --- | --- | --- | --- | --- |
| `BASE-001` | Baseline | Audited commit and source hashes | `tests/characterization/baseline-source.node.test.mjs` | Exact production files are recoverable from the audited commit | Establish recoverability; verify each future HEAD separately by diff/blob comparison |
| `CHAR-START-001` | Historical characterization | Phase 0 startup finding | Baseline commit and repository history | Targets initialized before profile initialization raised `updateSel is not defined` | Superseded by `CHG-P2-2-STARTUP-001`; retain as historical evidence |
| `DEF-START-001` | Resolved defect | Phase 0 startup defect | `CHG-P2-2-STARTUP-001`, `tests/target/startup.pw.spec.mjs` | Profile population and incoming AR value consumption are no longer blocked | Guarded by `ACC-START-001` and `ACC-HANDOFF-001` |
| `ACC-START-001` | Accepted target | `CHG-P2-2-STARTUP-001` | `tests/target/startup.pw.spec.mjs` | Targets and saved profiles initialize without page errors | Guard main-page startup |
| `ACC-HANDOFF-001` | Accepted target | `CHG-P2-2-STARTUP-001` | `tests/target/startup.pw.spec.mjs` | Incoming AR distance is consumed once and selects the size workflow | Preserve the legacy handoff until P2.8 replaces its contract |
| `CHAR-STORAGE-CORRUPT-001` | Historical characterization | Phase 0 storage finding | `CHG-P2-3-PERSISTENCE-001`, `tests/target/persistence.pw.spec.mjs` | Malformed target or profile JSON previously stopped part of startup | Superseded by corruption-isolation target evidence |
| `CHAR-STORAGE-EMPTY-001` | Historical characterization | Phase 0 storage finding | `CHG-P2-3-PERSISTENCE-001`, `tests/target/persistence.pw.spec.mjs` | Empty targets were accepted by main but caused an AR dereference error | Superseded by the supported empty-collection target state |
| `ACC-PERSISTENCE-LEGACY-001` | Accepted target | P2.3 migration contract | `tests/target/persistence.pw.spec.mjs` | Valid legacy records migrate independently to verified v1 envelopes and remain intact | Preserve legacy compatibility until approved cleanup |
| `ACC-PERSISTENCE-V1-001` | Accepted target | P2.3 storage contract | `tests/target/persistence.pw.spec.mjs` | Valid v1 records load before legacy records | Guard schema v1 reads |
| `ACC-PERSISTENCE-CORRUPT-001` | Accepted target | P2.3 isolation contract | `tests/target/persistence.pw.spec.mjs` | Corrupt current or legacy records are preserved, warned, and isolated from other records | Prevent one record from blocking startup |
| `ACC-PERSISTENCE-READ-001` | Accepted target | P2.3 adapter contract | `tests/target/persistence.pw.spec.mjs` | A failed record read produces a warning while other records load | Guard blocked or unavailable storage behavior |
| `ACC-PERSISTENCE-EMPTY-001` | Accepted target | P2.3 empty-state contract | `tests/target/persistence.pw.spec.mjs` | AR represents an empty target collection without a page error | Guard the supported empty state |
| `ACC-PERSISTENCE-QUOTA-001` | Accepted target | P2.3 migration contract | `tests/target/persistence.pw.spec.mjs` | Valid legacy data remains usable when a verified migration write cannot complete | Preserve data under quota or write failure |
| `ACC-PERSISTENCE-SCHEMA-001` | Accepted target | P2.3 schema contract | `tests/target/persistence.pw.spec.mjs` | Unknown newer schemas remain untouched and produce a warning | Prevent accidental downgrade or overwrite |
| `ACC-PERSISTENCE-WRITE-001` | Accepted target | P2.3 write contract | `tests/target/persistence.pw.spec.mjs` | A new v1 record is read back and validated before AppState adopts it | Guard new persistent writes |
| `ACC-PERSISTENCE-BOUNDARY-001` | Accepted target | P2.3 architecture contract | `tests/target/persistence-source.node.test.mjs` | Main and AR storage operations cross the adapter/repository boundary | Prevent direct Web Storage coupling from returning |
| `HARNESS-STORAGE-FAULTS-001` | Accepted harness capability | Phase 1 testability requirement | `tests/browser/storage-harness.pw.spec.mjs` | Harness deterministically changes an existing value to missing and supplies read-error, write-error and quota-error cases | Exercise approved P2.3 behavior |
| `CHAR-UI-VIEW-001` | Characterization | Phase 1 workflow inventory | `tests/characterization/view-switch.pw.spec.mjs` | Current tab, input-view and result-group visibility is recorded | Preserve workflows without freezing visual layout |
| `DEF-UI-VIEW-001` | Known defect | Phase 0 UI finding | `tests/defects/view-switch.pw.spec.mjs` | Size calculation consumes optics fields that are hidden with the distance view | Convert after an approved UI fix |
| `CHAR-HANDOFF-001` | Historical characterization | Phase 0 AR/main finding | Baseline commit and repository history | AR wrote scalar `tj_incoming_dist`; main startup failed before consuming it | Superseded by `ACC-HANDOFF-001`; input for the future P2.8 handoff envelope |
| `CHAR-RESET-001` | Historical characterization | Phase 0 storage finding | `CHG-P2-3-PERSISTENCE-001` | Reset previously cleared every key in the origin LocalStorage namespace | Superseded by `ACC-PERSISTENCE-RESET-001` |
| `ACC-PERSISTENCE-RESET-001` | Accepted target | P2.3 owned-key contract | `tests/target/persistence.pw.spec.mjs`, `tests/target/persistence-source.node.test.mjs` | Reset removes application-owned current, legacy, and handoff keys while preserving unrelated origin data | Guard ownership and scoped removal |
| `SEC-RENDER-001` | Known security defect | Phase 0 rendering finding | `tests/defects/safe-rendering.pw.spec.mjs` | A harmless user-defined markup marker becomes an element through `innerHTML` | Convert after an approved safe-rendering fix |
| `CHAR-PWA-001` | Characterization | Phase 0 service-worker finding | `tests/characterization/baseline-source.node.test.mjs`, `tests/pwa/current-baseline.pw.spec.mjs` | The audited baseline has three precache entries; current P2.3 also precaches its three local runtime scripts and keeps the offline index reload passing; AR and icon remain absent | Extend with versioned release fixtures in P2.6 |
| `CHAR-PWA-OWNERSHIP-001` | Characterization | Phase 0 cache-ownership finding | `tests/pwa/current-baseline.pw.spec.mjs` | Global `caches.match` can return a response placed in another cache | Input for future cache ownership rules |
| `HARNESS-NODE-DISCOVERY-001` | Accepted harness capability | P2.1 fail-closed requirement | `tests/target/runner-fail-closed.node.test.mjs` | Empty Node discovery fails unless the caller explicitly supplies `--allow-empty` | Prevent missing tests from producing a green stage |
| `HARNESS-SERVER-PATHS-001` | Accepted harness capability | P2.1 test-server safety requirement | `tests/target/test-server.node.test.mjs` | Intended application files are served; dot-prefixed, encoded-dot, traversal and malformed paths are denied | Keep repository internals outside browser reach |
| `REQ-OFFLINE-CORE-001` | Accepted target alias for Phase 1 `REQ-003` | Phase 1 `REQ-003`: no required cloud, CDN or runtime network service | `tests/target/harness-invariants.node.test.mjs` | Partial check: production HTML has no absolute external runtime script or stylesheet URL | Extend before claiming complete offline behavior |
| `REQ-WORKFLOW-001` | Accepted target alias for Phase 1 `REQ-008` | Phase 1 `REQ-008`: preserve the two reciprocal workflows | `tests/target/workflow.pw.spec.mjs` | Both main workflows can be selected | Retain without asserting historical pixel layout |

Future changes should add the approved `CHG` or `ADR` identifier and the resulting
`ACC` test to the relevant row. When a defect is fixed, its positive defect-signature
test must fail until it is replaced by an accepted target regression test.
