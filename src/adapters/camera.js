(function attachCameraAdapter(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};

    namespace.createCameraAdapter = function createCameraAdapter(options) {
        const settings = options || {};
        const environment = settings.environment || global;
        const video = settings.video || null;
        const listeners = new Set();
        const supported = Boolean(environment.navigator && environment.navigator.mediaDevices && environment.navigator.mediaDevices.getUserMedia);
        let stream = null;
        let startToken = 0;
        let state = {
            availability: supported ? (environment.isSecureContext === false ? 'insecure-context' : 'available') : 'unavailable',
            permission: supported ? 'unknown' : 'unsupported',
            status: 'idle',
            value: null,
            diagnostics: {
                resolution: {width: null, height: null},
                frameRate: null
            },
            observedAt: null,
            error: null,
            fallback: 'manual-workflow'
        };

        function snapshot() {
            return Object.assign({}, state);
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
                source: 'camera',
                recoverable: true,
                messageKey: kind === 'permission-denied' ? 'camera-denied' : 'camera-unavailable',
                cause
            });
        }

        function release(mediaStream) {
            if (!mediaStream || !mediaStream.getTracks) return;
            mediaStream.getTracks().forEach(track => {
                try { track.stop(); } catch (_error) {}
            });
        }

        function finitePositive(value) {
            return Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
        }

        function readDiagnostics() {
            const track = stream && typeof stream.getVideoTracks === 'function'
                ? stream.getVideoTracks()[0]
                : null;
            let settings = {};
            if (track && typeof track.getSettings === 'function') {
                try { settings = track.getSettings() || {}; } catch (_error) {}
            }
            const width = finitePositive(settings.width) || finitePositive(video && video.videoWidth);
            const height = finitePositive(settings.height) || finitePositive(video && video.videoHeight);
            return {
                resolution: {width, height},
                frameRate: finitePositive(settings.frameRate)
            };
        }

        function refreshDiagnostics() {
            return publish({diagnostics: stream ? readDiagnostics() : {
                resolution: {width: null, height: null},
                frameRate: null
            }});
        }

        async function start() {
            if (stream) return {ok: true, state: snapshot()};
            if (state.status === 'starting') return {ok: true, state: snapshot()};
            if (state.availability !== 'available') {
                const error = createError('missing-sensor', 'ERR-CAMERA-UNAVAILABLE-001');
                return {ok: false, error, state: publish({status: 'error', error})};
            }

            const token = ++startToken;
            publish({status: 'starting', error: null});
            try {
                const acquired = await environment.navigator.mediaDevices.getUserMedia(
                    settings.constraints || {video: {facingMode: 'environment'}}
                );
                if (token !== startToken) {
                    release(acquired);
                    return {ok: false, state: snapshot()};
                }
                stream = acquired;
                if (video) video.srcObject = stream;
                return {
                    ok: true,
                    state: publish({permission: 'granted', status: 'active', diagnostics: readDiagnostics(), observedAt: new Date().toISOString(), error: null})
                };
            } catch (cause) {
                release(stream);
                stream = null;
                if (video) {
                    try { video.srcObject = null; } catch (_error) {}
                }
                const denied = cause && (cause.name === 'NotAllowedError' || cause.name === 'SecurityError');
                const error = createError(denied ? 'permission-denied' : 'missing-sensor', denied ? 'ERR-CAMERA-DENIED-001' : 'ERR-CAMERA-START-001', cause);
                return {ok: false, error, state: publish({permission: denied ? 'denied' : state.permission, status: 'error', diagnostics: {resolution: {width: null, height: null}, frameRate: null}, error})};
            }
        }

        function stop() {
            startToken += 1;
            release(stream);
            stream = null;
            if (video) {
                try { video.srcObject = null; } catch (_error) {}
            }
            return {ok: true, state: publish({status: 'stopped', diagnostics: {resolution: {width: null, height: null}, frameRate: null}, observedAt: null})};
        }

        async function freeze(frozen) {
            if (!video || !stream) return {ok: false, state: snapshot()};
            try {
                if (frozen) video.pause();
                else await video.play();
                return {ok: true, frozen: Boolean(frozen), state: snapshot()};
            } catch (cause) {
                const error = createError('missing-sensor', 'ERR-CAMERA-FREEZE-001', cause);
                return {ok: false, error, state: publish({status: 'error', error})};
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
            freeze,
            refreshDiagnostics,
            subscribe,
            dispose() {
                stop();
                if (environment.removeEventListener) environment.removeEventListener('pagehide', pagehide);
                listeners.clear();
            }
        });
    };
})(window);
