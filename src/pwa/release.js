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
    const swBuildId = '0.3.0-build.1';
    const release = Object.freeze({
        releaseVersion: '0.3.0',
        commitSha: '8c4ab22048662aef5605f4dd79705ab36fd1328f',
        appVersion: '0.3.0',
        swBuildId,
        cacheName: `tjl-core-${swBuildId}`,
        assetManifestVersion: '3',
        storageSchemaVersion: 1,
        rollbackTarget: '5a5f78daa400e4dee6252c236735b8a037e46289',
        assets
    });

    global.TJL_RELEASE = release;
    const namespace = global.TJL = global.TJL || {};
    namespace.release = release;
})(typeof self !== 'undefined' ? self : window);
