(function attachCoordinates(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};
    const BAND_LETTERS = 'CDEFGHJKLMNPQRSTUVWX';
    const ROW_LETTERS = 'ABCDEFGHJKLMNPQRSTUV';
    const COLUMN_SETS = ['ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'];
    const BAND_MIN_NORTHING = Object.freeze({
        C: 1100000, D: 2000000, E: 2800000, F: 3700000, G: 4600000,
        H: 5500000, J: 6400000, K: 7300000, L: 8200000, M: 9100000,
        N: 0, P: 800000, Q: 1700000, R: 2600000, S: 3500000,
        T: 4400000, U: 5300000, V: 6200000, W: 7000000, X: 7900000
    });
    const A = 6378137;
    const ECC_SQUARED = 0.0066943799901413165;
    const K0 = 0.9996;

    const toRadians = degrees => degrees * Math.PI / 180;
    const toDegrees = radians => radians * 180 / Math.PI;

    function failure(code) {
        return Object.freeze({ok: false, code});
    }

    function zoneFor(latitude, longitude) {
        let zone = Math.floor((longitude + 180) / 6) + 1;
        if (longitude === 180) zone = 60;
        if (latitude >= 56 && latitude < 64 && longitude >= 3 && longitude < 12) zone = 32;
        if (latitude >= 72 && latitude < 84) {
            if (longitude >= 0 && longitude < 9) zone = 31;
            else if (longitude < 21) zone = 33;
            else if (longitude < 33) zone = 35;
            else if (longitude < 42) zone = 37;
        }
        return zone;
    }

    function wgs84ToUtm(latitude, longitude) {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
            || latitude < -80 || latitude > 84 || longitude < -180 || longitude > 180) return null;

        const zone = zoneFor(latitude, longitude);
        const longitudeOrigin = (zone - 1) * 6 - 180 + 3;
        const latitudeRadians = toRadians(latitude);
        const longitudeRadians = toRadians(longitude);
        const longitudeOriginRadians = toRadians(longitudeOrigin);
        const eccentricPrimeSquared = ECC_SQUARED / (1 - ECC_SQUARED);
        const n = A / Math.sqrt(1 - ECC_SQUARED * Math.sin(latitudeRadians) ** 2);
        const t = Math.tan(latitudeRadians) ** 2;
        const c = eccentricPrimeSquared * Math.cos(latitudeRadians) ** 2;
        const a = Math.cos(latitudeRadians) * (longitudeRadians - longitudeOriginRadians);
        const m = A * (
            (1 - ECC_SQUARED / 4 - 3 * ECC_SQUARED ** 2 / 64 - 5 * ECC_SQUARED ** 3 / 256) * latitudeRadians
            - (3 * ECC_SQUARED / 8 + 3 * ECC_SQUARED ** 2 / 32 + 45 * ECC_SQUARED ** 3 / 1024) * Math.sin(2 * latitudeRadians)
            + (15 * ECC_SQUARED ** 2 / 256 + 45 * ECC_SQUARED ** 3 / 1024) * Math.sin(4 * latitudeRadians)
            - (35 * ECC_SQUARED ** 3 / 3072) * Math.sin(6 * latitudeRadians)
        );
        const easting = K0 * n * (a + (1 - t + c) * a ** 3 / 6
            + (5 - 18 * t + t ** 2 + 72 * c - 58 * eccentricPrimeSquared) * a ** 5 / 120) + 500000;
        let northing = K0 * (m + n * Math.tan(latitudeRadians) * (a ** 2 / 2
            + (5 - t + 9 * c + 4 * c ** 2) * a ** 4 / 24
            + (61 - 58 * t + t ** 2 + 600 * c - 330 * eccentricPrimeSquared) * a ** 6 / 720));
        const northern = latitude >= 0;
        if (!northern) northing += 10000000;
        return Object.freeze({zone, northern, easting, northing});
    }

    function utmToWgs84(zone, northern, easting, northing) {
        if (!Number.isInteger(zone) || zone < 1 || zone > 60 || !Number.isFinite(easting)
            || !Number.isFinite(northing) || easting < 100000 || easting >= 900000
            || northing < 0 || northing > 10000000) return null;

        const x = easting - 500000;
        const y = northern ? northing : northing - 10000000;
        const eccentricPrimeSquared = ECC_SQUARED / (1 - ECC_SQUARED);
        const e1 = (1 - Math.sqrt(1 - ECC_SQUARED)) / (1 + Math.sqrt(1 - ECC_SQUARED));
        const m = y / K0;
        const mu = m / (A * (1 - ECC_SQUARED / 4 - 3 * ECC_SQUARED ** 2 / 64 - 5 * ECC_SQUARED ** 3 / 256));
        const phi1 = mu
            + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
            + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
            + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
            + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
        const n1 = A / Math.sqrt(1 - ECC_SQUARED * Math.sin(phi1) ** 2);
        const t1 = Math.tan(phi1) ** 2;
        const c1 = eccentricPrimeSquared * Math.cos(phi1) ** 2;
        const r1 = A * (1 - ECC_SQUARED) / (1 - ECC_SQUARED * Math.sin(phi1) ** 2) ** 1.5;
        const d = x / (n1 * K0);
        const latitude = phi1 - (n1 * Math.tan(phi1) / r1) * (d ** 2 / 2
            - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * eccentricPrimeSquared) * d ** 4 / 24
            + (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * eccentricPrimeSquared - 3 * c1 ** 2) * d ** 6 / 720);
        const longitudeOrigin = (zone - 1) * 6 - 180 + 3;
        const longitude = longitudeOrigin + toDegrees((d - (1 + 2 * t1 + c1) * d ** 3 / 6
            + (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * eccentricPrimeSquared + 24 * t1 ** 2) * d ** 5 / 120) / Math.cos(phi1));
        return Object.freeze({latitude: toDegrees(latitude), longitude});
    }

    function parseMgrs(value) {
        if (typeof value !== 'string') return failure('MGRS_REQUIRED');
        const compact = value.toUpperCase().replace(/\s+/g, '');
        const match = compact.match(/^(\d{1,2})([C-HJ-NP-X])([A-HJ-NP-Z])([A-HJ-NP-V])(\d{0,10})$/);
        if (!match || match[5].length % 2 !== 0) return failure('MGRS_INVALID_FORMAT');

        const zone = Number(match[1]);
        const band = match[2];
        const column = match[3];
        const row = match[4];
        const digits = match[5];
        if (zone < 1 || zone > 60) return failure('MGRS_INVALID_ZONE');

        const columnSet = COLUMN_SETS[(zone - 1) % 3];
        const columnIndex = columnSet.indexOf(column);
        const rowIndex = ROW_LETTERS.indexOf(row);
        if (columnIndex < 0 || rowIndex < 0) return failure('MGRS_INVALID_GRID');

        const precision = digits.length / 2;
        const cellSize = 10 ** (5 - precision);
        const eastDigits = digits.slice(0, precision);
        const northDigits = digits.slice(precision);
        let easting = (columnIndex + 1) * 100000 + Number(eastDigits || 0) * cellSize;
        const rowOffset = zone % 2 === 0 ? 5 : 0;
        let northing = ((rowIndex - rowOffset + ROW_LETTERS.length) % ROW_LETTERS.length) * 100000;
        while (northing < BAND_MIN_NORTHING[band]) northing += 2000000;
        northing += Number(northDigits || 0) * cellSize;
        easting += cellSize / 2;
        northing += cellSize / 2;

        const grouped = precision
            ? `${zone}${band} ${column}${row} ${eastDigits} ${northDigits}`
            : `${zone}${band} ${column}${row}`;
        return Object.freeze({
            ok: true, zone, band, column, row, precision, precisionMeters: cellSize,
            northern: BAND_LETTERS.indexOf(band) >= BAND_LETTERS.indexOf('N'),
            easting, northing, normalized: grouped
        });
    }

    function mgrsToWgs84(value) {
        const parsed = parseMgrs(value);
        if (!parsed.ok) return parsed;
        const coordinate = utmToWgs84(parsed.zone, parsed.northern, parsed.easting, parsed.northing);
        if (!coordinate) return failure('MGRS_INVALID_COORDINATE');
        const bandIndex = BAND_LETTERS.indexOf(parsed.band);
        const minimumLatitude = -80 + bandIndex * 8;
        const maximumLatitude = parsed.band === 'X' ? 84 : minimumLatitude + 8;
        if (coordinate.latitude < minimumLatitude || coordinate.latitude >= maximumLatitude) {
            return failure('MGRS_GRID_OUTSIDE_BAND');
        }
        return Object.freeze({...parsed, ...coordinate});
    }

    function wgs84ToMgrs(latitude, longitude, precision = 5) {
        if (!Number.isInteger(precision) || precision < 0 || precision > 5) return null;
        const utm = wgs84ToUtm(latitude, longitude);
        if (!utm) return null;
        const bandIndex = Math.min(BAND_LETTERS.length - 1, Math.floor((latitude + 80) / 8));
        const band = BAND_LETTERS[bandIndex];
        const columnSet = COLUMN_SETS[(utm.zone - 1) % 3];
        const columnIndex = Math.floor(utm.easting / 100000) - 1;
        if (columnIndex < 0 || columnIndex >= columnSet.length) return null;
        const rowOffset = utm.zone % 2 === 0 ? 5 : 0;
        const row = ROW_LETTERS[(Math.floor(utm.northing / 100000) + rowOffset) % ROW_LETTERS.length];
        const divisor = 10 ** (5 - precision);
        const east = Math.floor((utm.easting % 100000) / divisor).toString().padStart(precision, '0');
        const north = Math.floor((utm.northing % 100000) / divisor).toString().padStart(precision, '0');
        return precision
            ? `${utm.zone}${band} ${columnSet[columnIndex]}${row} ${east} ${north}`
            : `${utm.zone}${band} ${columnSet[columnIndex]}${row}`;
    }

    namespace.coordinates = Object.freeze({parseMgrs, mgrsToWgs84, wgs84ToMgrs, wgs84ToUtm, utmToWgs84});
})(typeof window !== 'undefined' ? window : globalThis);
