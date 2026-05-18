(function () {
    if (typeof ROOT_PATH === 'undefined') {
        return;
    }

    function isPrefixed(path) {
        return !path || path.startsWith('http:') || path.startsWith('https:') || path.startsWith('//') || path.startsWith('mailto:') || path.startsWith('data:') || path.startsWith('#');
    }

    function normalize(path) {
        if (!path) return path;
        return path.replace(/^[\.\/]+/, '');
    }

    function prefixAttribute(element, attr) {
        const value = element.getAttribute(attr);
        if (!value || isPrefixed(value)) {
            return;
        }
        element.setAttribute(attr, ROOT_PATH + normalize(value));
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[href]').forEach(function (element) {
            prefixAttribute(element, 'href');
        });
        document.querySelectorAll('[src]').forEach(function (element) {
            prefixAttribute(element, 'src');
        });
    });
})();
