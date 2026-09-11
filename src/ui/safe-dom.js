(function attachSafeDom(global) {
    'use strict';

    const namespace = global.TJL = global.TJL || {};

    function resolve(elementOrId) {
        return typeof elementOrId === 'string'
            ? document.getElementById(elementOrId)
            : elementOrId;
    }

    function setText(elementOrId, value) {
        const element = resolve(elementOrId);
        if (element) element.textContent = value == null ? '' : String(value);
        return element;
    }

    function empty(elementOrId) {
        const element = resolve(elementOrId);
        if (element) element.replaceChildren();
        return element;
    }

    function appendOption(selectOrId, options) {
        const select = resolve(selectOrId);
        const option = document.createElement('option');
        option.value = options.value == null ? '' : String(options.value);
        option.textContent = options.text == null ? '' : String(options.text);
        option.disabled = Boolean(options.disabled);
        option.selected = Boolean(options.selected);
        select.appendChild(option);
        return option;
    }

    function appendTargetItem(listOrId, target, index, onDelete) {
        const list = resolve(listOrId);
        const item = document.createElement('li');
        const name = document.createElement('span');
        const button = document.createElement('button');

        item.className = 'target-item';
        name.textContent = target.n == null ? '' : String(target.n);
        button.type = 'button';
        button.textContent = 'X';
        button.setAttribute('aria-label', `Poista ${name.textContent}`);
        button.addEventListener('click', () => onDelete(index));
        item.append(name, button);
        list.appendChild(item);
        return item;
    }

    namespace.safeDom = Object.freeze({ setText, empty, appendOption, appendTargetItem });
})(window);
