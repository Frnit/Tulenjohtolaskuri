(function attachAppState(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};

    namespace.createAppState = function createAppState(initial) {
        return {
            targets: initial.targets,
            profiles: initial.profiles,
            settings: initial.settings,
            persistence: {
                status: initial.warnings.length ? 'warning' : 'ready',
                warnings: initial.warnings.slice()
            }
        };
    };
})(window);
