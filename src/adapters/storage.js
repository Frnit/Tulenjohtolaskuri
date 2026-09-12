(function attachStorageAdapter(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};

    function storageError(operation, key, error) {
        return {
            operation,
            key,
            name: error && error.name ? error.name : 'Error',
            message: error && error.message ? error.message : String(error)
        };
    }

    namespace.createStorageAdapter = function createStorageAdapter(storageSource) {
        function storage() {
            return typeof storageSource === 'function' ? storageSource() : storageSource;
        }

        return {
            get(key) {
                try {
                    return { ok: true, value: storage().getItem(key) };
                } catch (error) {
                    return { ok: false, error: storageError('read', key, error) };
                }
            },

            set(key, value) {
                try {
                    storage().setItem(key, String(value));
                    return { ok: true };
                } catch (error) {
                    return { ok: false, error: storageError('write', key, error) };
                }
            },

            remove(key) {
                try {
                    storage().removeItem(key);
                    return { ok: true };
                } catch (error) {
                    return { ok: false, error: storageError('remove', key, error) };
                }
            },

            available() {
                const probe = 'tjl.__storage_probe__';
                const write = this.set(probe, '1');
                if (!write.ok) return write;
                return this.remove(probe);
            }
        };
    };
})(window);
