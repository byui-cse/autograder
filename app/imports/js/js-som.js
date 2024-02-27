/* eslint-disable no-param-reassign */

import WhatIs from '../what-is.js';

class JsSom {

    #struct = {};

    constructor(struct = {}) {
        this.#verifyStructure(struct);
        this.#struct = struct;
    }

    find(str) {
        const matches = this.findAll(str);
        if (matches.length > 0) {
            return matches[0];
        }
        return null;
    }

    findAll(str) {
        const matches = [];
        const regex = new RegExp(`\\s+${str}$|^${str}\\s+|\\s+${str}\\s+|\\s+\\w+${str}\\w+\\s+`, 'i');
        const standardized = str.toLowerCase();
        let { som } = this.#struct;
        if (standardized.includes('class')) {
            // console.log('CLASS');
            som = this.#struct.classes;
        } else if (standardized.includes('function')) {
            // console.log('FUNCTION');
            som = this.#struct.functions;
        } else if (['const', 'let', 'var', 'variable', 'variables'].some((el) => standardized.includes(el))) {
            // console.log('VARIABLES');
            som = this.#struct.variables;
        }

        this.#findAll(som, regex, matches);

        return matches;
    }

    #findAll(som, regex, matches) {
        Object.keys(som).forEach((key) => {
            if (regex.test(key)) {
                const match = {};
                match[key] = som[key];
                matches.push(match);
            }

            const { children } = som[key];
            if (Object.keys(children).length > 0) {
                this.#findAll(children, regex, matches);
            }
        });
    }

    getStructure() {
        return { ...this.#struct };
    }

    getValue(somNode = null) {
        if (!somNode) {
            return '';
        }

        const keys = Object.keys(somNode);
        if (keys.length < 1) {
            return '';
        }

        const node = somNode[keys[0]];

        return this.#struct.getLines(
            this.#struct.src,
            node.loc.start.line,
            node.loc.end.line,
            0,
            0
        );
    }

    #verifyStructure(struct) {
        if (!('som' in struct) || WhatIs(struct.som) !== 'object') {
            struct.som = {};
        }

        if (!('src' in struct) || WhatIs(struct.src) !== 'string') {
            struct.src = '';
        }

        if (!('classes' in struct) || WhatIs(struct.classes) !== 'object') {
            struct.classes = {};
        }

        if (!('functions' in struct) || WhatIs(struct.functions) !== 'object') {
            struct.functions = {};
        }

        if (!('variables' in struct) || WhatIs(struct.variables) !== 'object') {
            struct.variables = {};
        }
    }

}

export default JsSom;
