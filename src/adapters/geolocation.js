(function attachGeolocationAdapter(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};

    function initialState(environment) {
        const supported = Boolean(environment.navigator && environment.navigator.geolocation);
        return {
            availability: supported ? (environment.isSecureContext === false ? 'insecure-context' : 'available') : 'unavailable',
            permission: supported ? 'unknown' : 'unsupported',
            status: 'idle',
            value: null,
            observedAt: null,
            error: null,
            fallback: 'manual-position'
        };
    }

    namespace.createGeolocationAdapter = function createGeolocationAdapter(options) {
        const settings = options || {};
        const environment = settings.environment || global;
        const listeners = new Set();
        let state = initialState(environment);
        let watchId = null;

        function snapshot() {
            return Object.assign({}, state, { value: state.value && Object.assign({}, state.value) });
        }

        function publish(changes) {
            state = Object.assign({}, state, changes);
            const current = snapshot();
            listeners.forEach(listener => listener(current));
            return current;
        }

        function createError(kind, code, cause) {
            return namespace.createAppError({
                kind,
                code,
                source: 'geolocation',
                recoverable: true,
                messageKey: kind === 'permission-denied' ? 'geolocation-denied' : 'geolocation-unavailable',
                cause
            });
        }

        function releaseWatch() {
            if (watchId !== null && environment.navigator && environment.navigator.geolocation) {
                try { environment.navigator.geolocation.clearWatch(watchId); } catch (_error) {}
            }
            watchId = null;
        }

        function stop() {
            releaseWatch();
            return { ok: true, state: publish({status: 'stopped', value: null, observedAt: null}) };
        }

        function start() {
            if (state.status === 'active' || state.status === 'starting') return Promise.resolve({ok: true, state: snapshot()});
            if (state.availability !== 'available') {
                const kind = state.availability === 'insecure-context' ? 'unsupported-browser' : 'missing-sensor';
                const error = createError(kind, 'ERR-GEO-UNAVAILABLE-001');
                return Promise.resolve({ok: false, error, state: publish({status: 'error', error})});
            }

            publish({status: 'starting', error: null});
            try {
                watchId = environment.navigator.geolocation.watchPosition(position => {
                    publish({
                        permission: 'granted',
                        status: 'active',
                        value: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null
                        },
                        observedAt: new Date(position.timestamp || Date.now()).toISOString(),
                        error: null
                    });
                }, cause => {
                    releaseWatch();
                    const denied = cause && cause.code === 1;
                    const kind = denied ? 'permission-denied' : 'missing-sensor';
                    const error = createError(kind, denied ? 'ERR-GEO-DENIED-001' : 'ERR-GEO-READ-001', cause);
                    publish({permission: denied ? 'denied' : state.permission, status: 'error', error});
                }, settings.positionOptions || {enableHighAccuracy: true});
                return Promise.resolve({ok: true, state: snapshot()});
            } catch (cause) {
                const error = createError('missing-sensor', 'ERR-GEO-START-001', cause);
                return Promise.resolve({ok: false, error, state: publish({status: 'error', error})});
            }
        }

        function subscribe(listener) {
            listeners.add(listener);
            listener(snapshot());
            return () => listeners.delete(listener);
        }

        const pagehide = () => stop();
        if (environment.addEventListener) environment.addEventListener('pagehide', pagehide);

        return Object.freeze({
            capability: snapshot,
            start,
            stop,
            subscribe,
            dispose() {
                stop();
                if (environment.removeEventListener) environment.removeEventListener('pagehide', pagehide);
                listeners.clear();
            }
        });
    };
})(window);
