import { GetLines, GetValue, WhatIs } from '../helpers.js';

class HtmlSom {

    // #keys = {};

    #regex = {
        classes: /(\.[\w-]+)/g,
        data: /(\[([^\]]+).*?\])/g,
        id: /(#[\w-]+)/,
        quotes: /'|"/g
    };

    #struct = {};

    constructor(struct) {
        this.updateStructure(struct);
    }

    get src() {
        return this.#struct.src || '';
    }

    find(str) {
        const matches = this.findAll(str);
        if (matches.length > 0) {
            return matches[0];
        }
        return {};
    }

    findAll(str) {
        const parts = str.trim().split(' ');

        const { som } = this.#struct;
        let search = som;

        parts.forEach((part) => {
            const { element, selectors } = this.#getSelectorParts(part);
            const matches = [];

            this.#findAll(search, element, selectors, matches);

            if (matches.length > 0) {
                // search = new Map();
                search = matches;
            } else {
                search = som;
            }
        });

        if (search !== som) {
            return search;
        }
        // return new Map();
        return [];
    }

    #findAll(map, element, selectors, matches) {
        const regex = this.#makeRegex(element);

        map.forEach((node, key) => {

            if (regex.some((rx) => rx.test(key))) {

                let record = true;

                // Check classes.
                if (selectors.classes.length > 0) {
                    const check = node.attrsMap.get('class') || '';
                    selectors.classes.forEach((className) => {
                        if (!check.includes(className)) {
                            record = false;
                        }
                    });
                }

                // Check data.
                if (selectors.data.length > 0) {
                    selectors.data.forEach((dataObj) => {
                        if (!node.attrsMap.has(dataObj.key)) {
                            record = false;
                            return;
                        }

                        if (dataObj.value) {
                            if (!node.attrsMap.get(dataObj.key).includes(dataObj.value)) {
                                record = false;
                            }
                        }
                    });
                }

                // Check ids.
                if (selectors.id) {
                    const check = node.attrsMap.get('id') || '';
                    if (!check.includes(selectors.id)) {
                        record = false;
                    }
                }

                if (record) {
                    matches.push({
                        key,
                        value: node
                    });
                }
            }

            if (node.children) {
                this.#findAll(node.children, element, selectors, matches);
            }
        });
    }

    /**
     * Get a portion of the original source file.
     *
     * @param {string} source - The source file to pull lines from.
     * @param {int} lineStart - The line to start at.
     * @param {int} lineEnd - The line to end at.
     * @param {int} colStart - The column to start at; send 0 for bodies and blocks.
     * @param {int} colEnd - The column to end at; send 0 for bodies and blocks.
     * @returns {string} The portion of the source file requested.
     */
    getLine(source, lineStart, lineEnd, colStart = 0, colEnd = 0) {
        return GetLines(source, lineStart, lineEnd, colStart, colEnd);
    }

    #getSelectorParts(part) {
        let element = part;
        const selectors = {
            classes: [],
            data: [],
            id: null
        };

        // Check for any classes.
        let matches = part.matchAll(this.#regex.classes) || [];
        for (const match of matches) {
            element = element.replace(match[0], '');
            selectors.classes.push(match[1].substring(1));
        }

        // Check for any data blocks.
        matches = part.matchAll(this.#regex.data) || [];
        for (const match of matches) {
            const parts = match[2].split('=');
            const key = parts[0];
            let value = parts[1] || null;
            if (value) {
                value = value.replace(this.#regex.quotes, '');
            }
            element = element.replace(match[0], '');
            selectors.data.push({ key, value });
        }

        // Check for an id.
        matches = part.match(this.#regex.id) || [];
        if (matches.length > 0) {
            element = element.replace(matches[0], '');
            selectors.id = matches[0].substring(1);
        }

        return { element, selectors };
    }

    getStructure() {
        return { ...this.#struct };
    }

    #makeRegex(str = '.*') {
        const regex = [
            new RegExp(`^${str}$|\\s+${str}$|^${str}\\s+|\\s+${str}\\s+`)
        ];

        return regex;
    }

    updateStructure(struct = new Map()) {
        this.#verifyStructure(struct);
        this.#struct = struct;
        // this.#keys = {
        //     classes: struct.classes.keys(),
        //     data: struct.data.keys(),
        //     ids: struct.ids.keys()
        // };
    }

    #verifyStructure(struct) {
        // if (!('classes' in struct) || WhatIs(struct.classes) !== 'map') {
        //     // eslint-disable-next-line no-param-reassign
        //     struct.classes = new Map();
        // }

        // if (!('data' in struct) || WhatIs(struct.data) !== 'map') {
        //     // eslint-disable-next-line no-param-reassign
        //     struct.data = new Map();
        // }

        if (!('som' in struct) || WhatIs(struct.som) !== 'map') {
            // eslint-disable-next-line no-param-reassign
            struct.som = new Map();
        }

        if (!('src' in struct) || WhatIs(struct.src) !== 'string') {
            // eslint-disable-next-line no-param-reassign
            struct.src = '';
        }
    }

}

HtmlSom.prototype.getLines = GetLines;
HtmlSom.prototype.getValue = GetValue;

export default HtmlSom;
