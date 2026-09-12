(function attachAppErrors(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};
    const kinds = new Set([
        'validation',
        'missing-sensor',
        'permission-denied',
        'corrupt-data',
        'unsupported-browser',
        'domain-error',
        'internal-defect'
    ]);

    namespace.createAppError = function createAppError(options) {
        const source = options || {};
        return Object.freeze({
            kind: kinds.has(source.kind) ? source.kind : 'internal-defect',
            code: source.code || 'ERR-UNEXPECTED-001',
            source: source.source || 'application',
            recoverable: source.recoverable !== false,
            field: source.field || null,
            messageKey: source.messageKey || 'unexpected-error',
            cause: source.cause || null
        });
    };

    namespace.isRecoverable = function isRecoverable(error) {
        return Boolean(error && error.recoverable);
    };
})(window);
