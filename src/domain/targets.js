(function attachTargetCatalog(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};
    const dimensionLabels = Object.freeze({
        width: 'leveys',
        height: 'korkeus'
    });
    const workflowLabels = Object.freeze({
        distance: 'etäisyyden laskenta',
        ar: 'AR-etäisyyden laskenta'
    });
    const examples = Object.freeze({
        distance: Object.freeze([
            Object.freeze({ n: 'Mies', s: 0.5, dimension: 'width' }),
            Object.freeze({ n: 'Mies', s: 1.8, dimension: 'height' }),
            Object.freeze({ n: 'BTR / PAS', s: 2.9, dimension: 'width' }),
            Object.freeze({ n: 'Kuorma-auto', s: 2.5, dimension: 'width' })
        ]),
        ar: Object.freeze([
            Object.freeze({ n: 'Mies', s: 0.5, dimension: 'width' }),
            Object.freeze({ n: 'Mies', s: 1.8, dimension: 'height' }),
            Object.freeze({ n: 'BTR', s: 2.9, dimension: 'width' }),
            Object.freeze({ n: 'Auto', s: 1.8, dimension: 'width' })
        ])
    });

    function copyExamples(workflow) {
        return (examples[workflow] || []).map(target => ({ ...target }));
    }

    function formatMetres(value) {
        return String(Number(value)).replace('.', ',');
    }

    function label(target, workflow) {
        if (!dimensionLabels[target.dimension]) {
            return workflow === 'ar'
                ? `${target.n} (${target.s}m)`
                : String(target.n);
        }
        const dimension = dimensionLabels[target.dimension] || 'ulottuvuus';
        const use = workflowLabels[workflow] || 'laskenta';
        return `${target.n} — ${dimension} ${formatMetres(target.s)} m (${use})`;
    }

    namespace.targetCatalog = Object.freeze({ copyExamples, label });
})(window);
