import WhatIs from '../what-is.js';

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

    find(str) {
        const matches = this.findAll(str);
        if (matches.size === 0) {
            return null;
        }
        return matches.values().next().value;
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
                search = new Map();
                matches.forEach((obj) => {
                    search.set(obj.key, obj.value);
                });
            } else {
                search = som;
            }
        });

        if (search !== som) {
            return search;
        }
        return new Map();
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
                    matches.push({ key, value: node });
                }
            }

            if (node.children) {
                this.#findAll(node.children, element, selectors, matches);
            }
        });
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

export default HtmlSom;
