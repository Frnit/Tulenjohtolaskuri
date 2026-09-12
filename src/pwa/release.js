(function attachReleaseMetadata(global) {
    'use strict';

    const assets = Object.freeze([
        './',
        './index.html',
        './ar.html',
        './manifest.json',
        './icon.png',
        './readme.txt',
        './docs/pwa-offline.md',
        './src/pwa/release.js',
        './src/pwa/client.js',
        './src/adapters/storage.js',
        './src/adapters/geolocation.js',
        './src/adapters/orientation.js',
        './src/adapters/camera.js',
        './src/persistence/repository.js',
        './src/app/errors.js',
        './src/app/state.js',
        './src/domain/targets.js',
        './src/domain/coordinates.js',
        './src/ui/safe-dom.js'
    ]);
    const swBuildId = '0.3.0-rc.1-build.3';
    const release = Object.freeze({
        releaseVersion: '0.3.0-rc.1',
        commitSha: null,
        appVersion: '0.3.0-rc.1',
        swBuildId,
        cacheName: `tjl-core-${swBuildId}`,
        assetManifestVersion: '3',
        storageSchemaVersion: 1,
        rollbackTarget: null,
        assets
    });

    global.TJL_RELEASE = release;
    const namespace = global.TJL = global.TJL || {};
    namespace.release = release;
})(typeof self !== 'undefined' ? self : window);
