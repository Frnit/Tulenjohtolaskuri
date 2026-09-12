(function attachPersistenceRepository(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};
    const SCHEMA_VERSION = 1;
    const KEYS = Object.freeze({
        meta: 'tjl.meta',
        targets: 'tjl.targets',
        profiles: 'tjl.profiles',
        settings: 'tjl.settings',
        handoff: 'tjl.handoff'
    });
    const LEGACY_KEYS = Object.freeze({
        targets: 'tj_targets',
        profiles: 'tj_profs_v2',
        arFov: 'tj_ar_fov',
        incomingDistance: 'tj_incoming_dist'
    });

    function isRecord(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function validTarget(target) {
        return isRecord(target) &&
            typeof target.n === 'string' && target.n.trim().length > 0 &&
            Number.isFinite(Number(target.s)) && Number(target.s) > 0;
    }

    function validTargets(value) {
        return Array.isArray(value) && value.every(validTarget);
    }

    function validProfile(profile) {
        return isRecord(profile) &&
            Number.isFinite(Number(profile.f)) && Number(profile.f) > 0 &&
            Number.isFinite(Number(profile.r)) && Number(profile.r) > 0 &&
            ['deg', 'mil', 'piiru', 'mrad'].includes(profile.u);
    }

    function validProfiles(value) {
        return isRecord(value) && Object.values(value).every(validProfile);
    }

    function validSettings(value) {
        if (!isRecord(value)) return false;
        if (!Object.prototype.hasOwnProperty.call(value, 'arFov')) return true;
        return Number.isFinite(Number(value.arFov)) && Number(value.arFov) > 0;
    }

    function validMeta(value) {
        return isRecord(value) &&
            value.storageSchemaVersion === SCHEMA_VERSION &&
            Array.isArray(value.migratedLegacyKeys) &&
            value.migratedLegacyKeys.every(key => typeof key === 'string');
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function envelope(data, now) {
        return {
            schemaVersion: SCHEMA_VERSION,
            updatedAt: now().toISOString(),
            data: clone(data)
        };
    }

    namespace.createPersistenceRepository = function createPersistenceRepository(options) {
        const local = options.local;
        const session = options.session;
        const now = options.now || (() => new Date());
        const warnings = [];
        const migratedLegacyKeys = [];

        function warn(code, key, message, detail) {
            warnings.push({ code, key, message, detail: detail || null });
        }

        function parse(raw, key) {
            try {
                return { ok: true, value: JSON.parse(raw) };
            } catch (error) {
                warn('CORRUPT_JSON', key, 'Tallennettu tieto on vioittunut eikä sitä muutettu.', error.message);
                return { ok: false };
            }
        }

        function read(adapter, key) {
            const result = adapter.get(key);
            if (!result.ok) {
                warn('STORAGE_READ_FAILED', key, 'Tallennettua tietoa ei voitu lukea.', result.error);
            }
            return result;
        }

        function writeVerified(key, data, validate) {
            const serialized = JSON.stringify(envelope(data, now));
            const written = local.set(key, serialized);
            if (!written.ok) {
                warn('STORAGE_WRITE_FAILED', key, 'Tietoa ei voitu tallentaa.', written.error);
                return { ok: false, warnings: warnings.slice() };
            }

            const readBack = local.get(key);
            if (!readBack.ok) {
                warn('STORAGE_VERIFY_FAILED', key, 'Tallennuksen varmistus epäonnistui.', readBack.error);
                return { ok: false, warnings: warnings.slice() };
            }

            const parsed = parse(readBack.value, key);
            if (!parsed.ok || !validEnvelope(parsed.value, validate)) {
                warn('STORAGE_VERIFY_FAILED', key, 'Tallennettu tieto ei läpäissyt varmennusta.');
                return { ok: false, warnings: warnings.slice() };
            }
            return { ok: true, warnings: warnings.slice() };
        }

        function validEnvelope(value, validate) {
            return isRecord(value) &&
                value.schemaVersion === SCHEMA_VERSION &&
                typeof value.updatedAt === 'string' &&
                Number.isFinite(Date.parse(value.updatedAt)) &&
                validate(value.data);
        }

        function readCurrent(key, validate) {
            const stored = read(local, key);
            if (!stored.ok || stored.value === null) return { status: 'missing' };

            const parsed = parse(stored.value, key);
            if (!parsed.ok) return { status: 'invalid' };
            if (isRecord(parsed.value) && Number(parsed.value.schemaVersion) > SCHEMA_VERSION) {
                warn('UNSUPPORTED_SCHEMA', key, 'Tallennettu tieto on tätä sovellusversiota uudempi eikä sitä muutettu.');
                return { status: 'unsupported' };
            }
            if (!validEnvelope(parsed.value, validate)) {
                warn('INVALID_RECORD', key, 'Tallennettu tieto ei vastaa tuettua rakennetta eikä sitä muutettu.');
                return { status: 'invalid' };
            }
            return { status: 'ready', value: clone(parsed.value.data) };
        }

        function readLegacyJson(key, validate) {
            const stored = read(local, key);
            if (!stored.ok || stored.value === null) return { status: 'missing' };
            const parsed = parse(stored.value, key);
            if (!parsed.ok) return { status: 'invalid' };
            if (!validate(parsed.value)) {
                warn('INVALID_LEGACY_RECORD', key, 'Vanha tallennettu tieto ei vastaa tuettua rakennetta eikä sitä muutettu.');
                return { status: 'invalid' };
            }
            return { status: 'ready', value: clone(parsed.value) };
        }

        function migrateJson(kind, fallback, validate) {
            const current = readCurrent(KEYS[kind], validate);
            if (current.status === 'ready') return current.value;
            if (current.status !== 'missing') return clone(fallback);

            const legacy = readLegacyJson(LEGACY_KEYS[kind], validate);
            if (legacy.status !== 'ready') return clone(fallback);

            if (writeVerified(KEYS[kind], legacy.value, validate).ok) {
                migratedLegacyKeys.push(LEGACY_KEYS[kind]);
            }
            return legacy.value;
        }

        function loadSettings() {
            const current = readCurrent(KEYS.settings, validSettings);
            if (current.status === 'ready') return current.value;
            if (current.status !== 'missing') return {};

            const stored = read(local, LEGACY_KEYS.arFov);
            if (!stored.ok || stored.value === null) return {};
            const arFov = Number(stored.value);
            if (!Number.isFinite(arFov) || arFov <= 0) {
                warn('INVALID_LEGACY_RECORD', LEGACY_KEYS.arFov, 'Vanha AR-kalibrointi ei ole kelvollinen eikä sitä muutettu.');
                return {};
            }
            const settings = { arFov };
            if (writeVerified(KEYS.settings, settings, validSettings).ok) {
                migratedLegacyKeys.push(LEGACY_KEYS.arFov);
            }
            return settings;
        }

        function updateMigrationMeta() {
            if (!migratedLegacyKeys.length) return;
            const current = readCurrent(KEYS.meta, validMeta);
            if (current.status !== 'missing' && current.status !== 'ready') return;
            const previous = current.status === 'ready' ? current.value.migratedLegacyKeys : [];
            writeVerified(KEYS.meta, {
                storageSchemaVersion: SCHEMA_VERSION,
                migratedLegacyKeys: Array.from(new Set(previous.concat(migratedLegacyKeys)))
            }, validMeta);
        }

        function loadAll(defaults) {
            warnings.length = 0;
            migratedLegacyKeys.length = 0;
            const result = {
                targets: migrateJson('targets', defaults.targets, validTargets),
                profiles: migrateJson('profiles', {}, validProfiles),
                settings: loadSettings(),
                warnings
            };
            updateMigrationMeta();
            return result;
        }

        function resetAdapter(adapter, keys) {
            for (const key of keys) {
                const result = adapter.remove(key);
                if (!result.ok) warn('STORAGE_RESET_FAILED', key, 'Tallennettua tietoa ei voitu poistaa.', result.error);
            }
        }

        return {
            keys: KEYS,
            legacyKeys: LEGACY_KEYS,
            loadAll,
            saveTargets(data) {
                return validTargets(data)
                    ? writeVerified(KEYS.targets, data, validTargets)
                    : { ok: false, warnings: warnings.slice() };
            },
            saveProfiles(data) {
                return validProfiles(data)
                    ? writeVerified(KEYS.profiles, data, validProfiles)
                    : { ok: false, warnings: warnings.slice() };
            },
            saveSettings(data) {
                return validSettings(data)
                    ? writeVerified(KEYS.settings, data, validSettings)
                    : { ok: false, warnings: warnings.slice() };
            },
            readLegacyIncomingDistance() {
                const result = read(local, LEGACY_KEYS.incomingDistance);
                return result.ok ? result.value : null;
            },
            removeLegacyIncomingDistance() {
                const result = local.remove(LEGACY_KEYS.incomingDistance);
                if (!result.ok) warn('STORAGE_REMOVE_FAILED', LEGACY_KEYS.incomingDistance, 'AR-siirtotietoa ei voitu poistaa.', result.error);
                return result;
            },
            writeLegacyIncomingDistance(value) {
                const result = local.set(LEGACY_KEYS.incomingDistance, value);
                if (!result.ok) warn('STORAGE_WRITE_FAILED', LEGACY_KEYS.incomingDistance, 'AR-siirtotietoa ei voitu tallentaa.', result.error);
                return result;
            },
            resetOwned() {
                warnings.length = 0;
                resetAdapter(local, [
                    KEYS.meta,
                    KEYS.targets,
                    KEYS.profiles,
                    KEYS.settings,
                    LEGACY_KEYS.targets,
                    LEGACY_KEYS.profiles,
                    LEGACY_KEYS.arFov,
                    LEGACY_KEYS.incomingDistance
                ]);
                resetAdapter(session, [KEYS.handoff]);
                return { ok: warnings.length === 0, warnings: warnings.slice() };
            },
            warnings() {
                return warnings.slice();
            }
        };
    };
})(window);
