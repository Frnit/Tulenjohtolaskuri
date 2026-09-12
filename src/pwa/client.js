(function attachPwaClient(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};

    namespace.createPwaClient = function createPwaClient(options) {
        const settings = options || {};
        const environment = settings.environment || global;
        const navigatorObject = environment.navigator || {};
        const serviceWorker = navigatorObject.serviceWorker;
        const currentRelease = settings.release || global.TJL_RELEASE;
        const listeners = new Set();
        let registration = null;
        let broadcast = null;
        let lifecycleBound = false;
        let reloadForUpdate = false;
        let state = {
            status: serviceWorker ? 'checking' : 'unsupported',
            offlineReady: false,
            currentVersion: currentRelease.appVersion,
            availableVersion: null,
            error: null
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

        async function hasCompleteCurrentCache() {
            if (!serviceWorker || !serviceWorker.controller || !environment.caches) return false;
            const names = await environment.caches.keys();
            if (!names.includes(currentRelease.cacheName)) return false;
            const cache = await environment.caches.open(currentRelease.cacheName);
            const matches = await Promise.all(currentRelease.assets.map(asset => cache.match(asset)));
            return matches.every(Boolean);
        }

        async function refreshReadiness() {
            try {
                const offlineReady = await hasCompleteCurrentCache();
                return publish({
                    status: offlineReady ? 'ready' : 'online-only',
                    offlineReady,
                    error: null
                });
            } catch (_error) {
                return publish({status: 'error', offlineReady: false, error: 'offline-check-failed'});
            }
        }

        function announceUpdate(release) {
            const availableVersion = release && release.appVersion
                ? release.appVersion
                : (state.availableVersion || 'uusi versio');
            publish({status: 'update-ready', availableVersion, error: null});
        }

        function monitorWorker(worker) {
            if (!worker) return;
            const handleState = () => {
                if (worker.state === 'installed') {
                    if (serviceWorker.controller) announceUpdate(null);
                    else refreshReadiness();
                } else if (worker.state === 'redundant') {
                    publish({
                        status: serviceWorker.controller ? 'update-error' : 'error',
                        offlineReady: Boolean(serviceWorker.controller),
                        error: 'update-install-failed'
                    });
                }
            };
            worker.addEventListener('statechange', handleState);
            handleState();
        }

        function handleMessage(event) {
            const message = event.data || {};
            if (message.type === 'TJL_UPDATE_READY' && serviceWorker.controller) announceUpdate(message.release);
            if (message.type === 'TJL_UPDATE_ACTIVATING') {
                reloadForUpdate = true;
                publish({status: 'applying-update', availableVersion: message.release && message.release.appVersion});
            }
            if (message.type === 'TJL_RELEASE_ACTIVE' && !reloadForUpdate) refreshReadiness();
        }

        function bindLifecycle() {
            if (lifecycleBound) return;
            lifecycleBound = true;
            serviceWorker.addEventListener('message', handleMessage);
            serviceWorker.addEventListener('controllerchange', () => {
                if (reloadForUpdate && environment.location && environment.location.reload) {
                    environment.location.reload();
                    return;
                }
                refreshReadiness();
            });
            if (typeof environment.BroadcastChannel === 'function') {
                broadcast = new environment.BroadcastChannel('tjl-pwa-updates');
                broadcast.addEventListener('message', handleMessage);
            }
        }

        async function register() {
            if (!serviceWorker) return {ok: false, state: snapshot()};
            bindLifecycle();
            try {
                registration = await serviceWorker.register(settings.workerUrl || './sw.js', {updateViaCache: 'none'});
                registration.addEventListener('updatefound', () => monitorWorker(registration.installing));
                monitorWorker(registration.installing);
                await serviceWorker.ready;
                if (registration.waiting && serviceWorker.controller) announceUpdate(null);
                else await refreshReadiness();
                return {ok: true, state: snapshot()};
            } catch (_error) {
                return {ok: false, state: publish({status: 'error', offlineReady: false, error: 'registration-failed'})};
            }
        }

        async function check() {
            if (!registration) return register();
            publish({status: 'checking', error: null});
            try {
                await registration.update();
                if (registration.waiting) announceUpdate(null);
                else await refreshReadiness();
                return {ok: true, state: snapshot()};
            } catch (_error) {
                return {ok: false, state: publish({status: 'update-error', error: 'update-check-failed'})};
            }
        }

        function activateWaiting() {
            if (!registration || !registration.waiting) return {ok: false, state: snapshot()};
            reloadForUpdate = true;
            publish({status: 'applying-update', error: null});
            if (broadcast) broadcast.postMessage({type: 'TJL_UPDATE_ACTIVATING'});
            registration.waiting.postMessage({type: 'TJL_ACTIVATE_UPDATE'});
            return {ok: true, state: snapshot()};
        }

        return Object.freeze({
            register,
            check,
            activateWaiting,
            capability: snapshot,
            subscribe(listener) {
                listeners.add(listener);
                listener(snapshot());
                return () => listeners.delete(listener);
            },
            dispose() {
                if (broadcast) broadcast.close();
                listeners.clear();
            }
        });
    };

    namespace.bindPwaStatus = function bindPwaStatus(client, options) {
        const statusElement = options.statusElement;
        const updateButton = options.updateButton;
        const render = state => {
            const labels = {
                checking: 'OFFLINE: TARKISTETAAN',
                ready: `OFFLINE: VALMIS · ${state.currentVersion}`,
                'online-only': 'OFFLINE: EI VALMIS',
                unsupported: 'OFFLINE: EI TUETTU',
                'update-ready': `PÄIVITYS ${state.availableVersion || ''} VALMIS`,
                'applying-update': 'PÄIVITYS OTETAAN KÄYTTÖÖN',
                'update-error': 'PÄIVITYS EPÄONNISTUI · NYKYINEN VERSIO KÄYTÖSSÄ',
                error: 'OFFLINE: ASENNUS EPÄONNISTUI'
            };
            statusElement.textContent = labels[state.status] || labels.checking;
            updateButton.hidden = state.status !== 'update-ready';
        };
        const unsubscribe = client.subscribe(render);
        const activate = () => client.activateWaiting();
        updateButton.addEventListener('click', activate);
        return () => {
            unsubscribe();
            updateButton.removeEventListener('click', activate);
        };
    };
})(window);
