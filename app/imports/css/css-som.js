import WhatIs from '../what-is.js';

class CssSom {

    #keys = [];

    #struct = {};

    constructor(struct) {
        this.updateStructure(struct);
    }

    find(str) {
        const regex = this.#makeRegex(str);

        const index = this.#keys.findIndex((key) => {
            if (regex.some((rx) => rx.test(key))) {
                return true;
            }
            return false;
        });

        if (index < 0) {
            return null;
        }
        const key = this.#keys[index];

        const match = {};
        match[key] = this.#struct.som[key];

        return match;
    }

    findAll(str) {
        const regex = this.#makeRegex(str);

        const keys = this.#keys.filter((key) => {
            if (regex.some((rx) => rx.test(key))) {
                return true;
            }
            return false;
        });

        const matches = [];

        keys.forEach((key) => {
            const obj = {};
            obj[key] = this.#struct.som[key];
            matches.push(obj);
        });

        return matches;
    }

    getStructure() {
        return { ...this.#struct };
    }

    #makeRegex(str) {
        // TODO: Improve process to allow partial regex patterns and to escape escapes

        const regex = [
            new RegExp(`^${str}$|\\s+${str}$|^${str}\\s+|\\s+${str}\\s+`),
            new RegExp(`^${str}[,:]|\\s+{str}[,:]`)
        ];

        // TODO: Improve so .* does not match .

        if (str.includes('.') || str.includes('#')) {
            regex.push(new RegExp(`.${str}\\s+|${str}.`));
        }

        return regex;
    }

    updateStructure(struct = {}) {
        this.#verifyStructure(struct);
        this.#struct = struct;
        this.#keys = Object.keys(struct.som);
    }

    #verifyStructure(struct) {
        if (!('som' in struct) || WhatIs(struct.som) !== 'object') {
            // eslint-disable-next-line no-param-reassign
            struct.som = {};
        }

        if (!('src' in struct) || WhatIs(struct.src) !== 'string') {
            // eslint-disable-next-line no-param-reassign
            struct.src = '';
        }
    }

}

export default CssSom;
