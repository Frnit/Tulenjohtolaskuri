(function attachAppState(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};

    function emptySensorState(fallback) {
        return {
            availability: 'unknown',
            permission: 'unknown',
            status: 'idle',
            value: null,
            observedAt: null,
            error: null,
            fallback: fallback
        };
    }

    namespace.createAppState = function createAppState(initial) {
        return {
            stateVersion: 1,
            targets: initial.targets,
            profiles: initial.profiles,
            settings: initial.settings,
            sensors: {
                camera: emptySensorState('manual-workflow'),
                geolocation: emptySensorState('manual-position'),
                orientation: emptySensorState('manual-bearing')
            },
            inputRevision: 0,
            result: {
                status: 'empty',
                basedOnRevision: null,
                calculatedAt: null,
                value: null,
                error: null
            },
            ui: { notices: [] },
            persistence: {
                status: initial.warnings.length ? 'warning' : 'ready',
                warnings: initial.warnings.slice()
            }
        };
    };

    namespace.beginInputRevision = function beginInputRevision(state) {
        state.inputRevision += 1;
        if (state.result.status === 'fresh') state.result.status = 'stale';
        return state.inputRevision;
    };

    namespace.acceptResult = function acceptResult(state, revision, value) {
        if (revision !== state.inputRevision) return false;
        state.result = {
            status: value == null ? 'empty' : 'fresh',
            basedOnRevision: value == null ? null : revision,
            calculatedAt: value == null ? null : new Date().toISOString(),
            value: value,
            error: null
        };
        return true;
    };

    namespace.rejectResult = function rejectResult(state, revision, error) {
        if (revision !== state.inputRevision) return false;
        state.result = {
            status: 'error',
            basedOnRevision: revision,
            calculatedAt: null,
            value: null,
            error: error
        };
        return true;
    };
})(window);
