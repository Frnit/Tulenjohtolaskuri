# Storage contract

P2.3 introduces one browser-storage boundary for the application. The main and AR
pages use the storage adapter and persistence repository instead of calling Web
Storage operations directly.

## Owned keys

| Key | Storage | Content |
| --- | --- | --- |
| `tjl.meta` | LocalStorage | Storage schema and completed legacy migrations |
| `tjl.targets` | LocalStorage | Versioned target collection |
| `tjl.profiles` | LocalStorage | Versioned sensor profiles |
| `tjl.settings` | LocalStorage | Versioned UI and AR settings |
| `tjl.handoff` | SessionStorage | Reserved for the P2.8 AR handoff contract |

Persistent v1 records use this envelope:

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-09-11T00:00:00.000Z",
  "data": {}
}
```

The repository validates the envelope and its record-specific `data` before making
the value available to AppState. An invalid record produces a warning for that key;
other records and workflows continue to load. A record with a schema newer than the
supported version is left unchanged and is not treated as v1.

## Legacy migration

The first v1 load recognizes `tj_targets`, `tj_profs_v2`, and `tj_ar_fov`. Each key
is parsed, validated, converted in memory, written to its corresponding `tjl.*` key,
read back, and validated again. Migration is idempotent and independent per record.
Legacy source keys remain unchanged for rollback and later cleanup decisions.

`tj_incoming_dist` remains the compatibility handoff until P2.8 defines its
versioned, consume-once SessionStorage envelope. P2.3 routes its reads and writes
through the same adapter without changing its accepted behavior.

Corrupt legacy values are not overwritten. If a migration write, read, or quota
check fails, valid legacy data remains usable for the current session and the page
shows a key-specific warning.

The compatibility policy is v1 plus the current legacy format. Future schemas must
support the current and previous version unless a later product decision extends
that window. Automatic downgrade migration is not performed.

## Reset ownership

Reset removes the registered `tjl.*` records and the four application-owned legacy
keys. It does not call `localStorage.clear()` and does not remove unrelated data in
the same origin. A removal failure is reported and does not turn into a successful
reload.
