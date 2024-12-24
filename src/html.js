// @ts-check

/** @type {[string, string][]} */
const _entities = [
    ["&", "amp"],
    ["<", "lt"],
    [">", "gt"],
    ['"', "quot"],
    ["'", "apos"],
    // prefer #39 due to XML compatibility
    ["'", "#39"],
    ["\xa0", "nbsp"],
]

const rawToEntity = new Map(_entities);
const entityToRaw = new Map(_entities.map(([k, v]) => [v, k]));
const rawEntities = new RegExp(`[${[...rawToEntity.keys()].join('')}]`, 'g');

/** @param {string} entity */
function unescapeEntity(entity) {
    entity = entity.toLowerCase();

    const raw = entityToRaw.get(entity);
    if (raw != null) return raw;

    if (entity.startsWith('#')) {
        const [offset, radix] = entity[1] === 'x' ? [2, 16] : [1, 10];
        return String.fromCharCode(parseInt(entity.slice(offset), radix));
    }
    return entity;
}

/** @param {string} html */
export function htmlToPlainText(html) {
    const bodyStart = html.indexOf('<body');
    if (bodyStart !== -1) {
        html = html.slice(bodyStart);
    }
    html = html.replaceAll(/<style[\s\w\W]+<\/style>/g, '');

    // we use `[ \t\r\n]` instead of `\s` to preserve non-breaking spaces
    return html
        .replaceAll(/[ \t\r\n]+/g, ' ')
        .replaceAll(/[ \t\r\n]*<br[^>]*>[ \t\r\n]*/gi, '\n')
        .replaceAll(/[ \t\r\n]*<\/?(?:p|div|h[1-6]|th|td)[^>]*>[ \t\r\n]*/gi, '\n\n')
        .replaceAll(/<[^>]*>/g, '')
        .replaceAll(/(\n *){3,}/g, '\n\n')
        .replaceAll(/ {2,}/g, ' ')
        .replaceAll(/^[ \t\r\n]+|[ \t\r\n]+$/g, '')
        .replaceAll(/&(#?\w+);/g, (_, x) => unescapeEntity(x));
}

/** @param {string} text */
export function plainTextToHtml(text) {
    return text
        .replaceAll(rawEntities, (m) => `&${rawToEntity.get(m)};`)
        .replaceAll(/\r?\n/g, '<br />');
}
