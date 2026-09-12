(function attachOrientationAdapter(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};

    namespace.createOrientationAdapter = function createOrientationAdapter(options) {
        const settings = options || {};
        const environment = settings.environment || global;
        const listeners = new Set();
        const eventType = 'deviceorientation';
        const supported = typeof environment.DeviceOrientationEvent !== 'undefined';
        const requiresPermission = supported && typeof environment.DeviceOrientationEvent.requestPermission === 'function';
        let listening = false;
        let state = {
            availability: supported ? (environment.isSecureContext === false ? 'insecure-context' : 'available') : 'unavailable',
            permission: supported ? (requiresPermission ? 'prompt' : 'unknown') : 'unsupported',
            status: 'idle',
            value: null,
            observedAt: null,
            error: null,
            fallback: 'manual-bearing'
        };

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
                source: 'orientation',
                recoverable: true,
                messageKey: kind === 'permission-denied' ? 'orientation-denied' : 'orientation-unavailable',
                cause
            });
        }

        function onOrientation(event) {
            let heading = Number.isFinite(event.webkitCompassHeading)
                ? event.webkitCompassHeading
                : (Number.isFinite(event.alpha) ? 360 - event.alpha : null);
            if (heading === null) return;
            heading = ((heading % 360) + 360) % 360;
            publish({
                permission: 'granted',
                status: 'active',
                value: {headingDegrees: heading},
                observedAt: new Date().toISOString(),
                error: null
            });
        }

        function beginListening() {
            if (!listening) environment.addEventListener(eventType, onOrientation);
            listening = true;
            return {ok: true, state: publish({permission: 'granted', status: 'active', error: null})};
        }

        async function start(startOptions) {
            const startSettings = startOptions || {};
            if (listening) return {ok: true, state: snapshot()};
            if (state.availability !== 'available') {
                const error = createError('missing-sensor', 'ERR-ORIENTATION-UNAVAILABLE-001');
                return {ok: false, error, state: publish({status: 'error', error})};
            }
            if (requiresPermission && !startSettings.requestPermission) {
                return {ok: false, needsUserAction: true, state: publish({permission: 'prompt', status: 'idle', error: null})};
            }

            publish({status: 'starting', error: null});
            try {
                if (requiresPermission && state.permission !== 'granted') {
                    const permission = await environment.DeviceOrientationEvent.requestPermission();
                    if (permission !== 'granted') {
                        const error = createError('permission-denied', 'ERR-ORIENTATION-DENIED-001');
                        return {ok: false, error, state: publish({permission: 'denied', status: 'error', error})};
                    }
                }
                return beginListening();
            } catch (cause) {
                const denied = cause && (cause.name === 'NotAllowedError' || cause.name === 'SecurityError');
                const error = createError(denied ? 'permission-denied' : 'missing-sensor', denied ? 'ERR-ORIENTATION-DENIED-001' : 'ERR-ORIENTATION-START-001', cause);
                return {ok: false, error, state: publish({permission: denied ? 'denied' : state.permission, status: 'error', error})};
            }
        }

        function stop() {
            if (listening) {
                try { environment.removeEventListener(eventType, onOrientation); } catch (_error) {}
            }
            listening = false;
            return {ok: true, state: publish({status: 'stopped', value: null, observedAt: null})};
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
