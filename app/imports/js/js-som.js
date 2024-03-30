/* eslint-disable no-param-reassign */

import { GetLines, GetValue, WhatIs } from '../helpers.js';

/**
 * The Structured Object Model (SOM) for JS.
 */
class JsSom {

    #struct = {};

    constructor(struct = {}) {
        this.#verifyStructure(struct);
        this.#struct = struct;
    }

    /**
     * Search the SOM and find the first node that matches the requested pattern.
     *
     * @param {string} str The pattern to search for; querySelector like.
     * @returns The object for the first matching node or an empty object.
     */
    find(str) {
        const matches = this.findAll(str);
        if (matches.length > 0) {
            return matches[0];
        }
        return {};
    }

    /**
     * Search the SOM and find all the nodes that match the requested pattern.
     *
     * @param {string} str The pattern to search for; querySelector like.
     * @returns An array of matching node objects or an empty array.
     */
    findAll(str) {
        // The search string is querySelector like so break it into it's parts (levels).
        const regex = new RegExp(`\\s+${str}$|^${str}\\s+|\\s+${str}\\s+|\\s+\\w+${str}\\w+\\s+`, 'i');

        // Setup variables we need to track/update as we traverse the SOM.
        const matches = [];
        const standardized = str.toLowerCase();

        // Start the initial search at the root of the SOM.
        let { som } = this.#struct;

        // See if we can narrow down the search a bit:
        if (standardized.includes('class')) {
            // Use the optimized class SOM.
            som = this.#struct.classes;
        } else if (standardized.includes('function')) {
            // Use the optimized function SOM.
            som = this.#struct.functions;
        } else if (['const', 'let', 'var', 'variable', 'variables'].some((el) => standardized.includes(el))) {
            // Use the optimized variable SOM.
            som = this.#struct.variables;
        }

        this.#findAll(som, regex, matches);
        return matches;
    }

    /**
     * @private
     * Search for all the matches at the provided SOM level.
     *
     * @param {object} som The current SOM to search for matches.
     * @param {RegExp} regex The pattern to check for.
     * @param {Array} matches An array to append matches to.
     */
    #findAll(som, regex, matches) {
        Object.keys(som).forEach((key) => {
            // Append all matches to the match array.
            if (regex.test(key)) {
                matches.push({
                    key,
                    value: som[key]
                });
            }

            // Recursively search (process) child nodes.
            const { children } = som[key];
            if (Object.keys(children).length > 0) {
                this.#findAll(children, regex, matches);
            }
        });
    }

    /**
     * Get the source code that was parsed to create the current SOM.
     */
    get src() {
        return this.#struct.src || '';
    }

    /**
     * Get the SOM object.
     *
     * @returns The SOM object.
     */
    getStructure() {
        return { ...this.#struct };
    }

    /**
     * @private
     * Verify and fix the new SOM structure to avoid any errors with a bad SOM.
     *
     * @param {object} struct The SOM structure that will be used.
     */
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

JsSom.prototype.getLines = GetLines;
JsSom.prototype.getValue = GetValue;

export default JsSom;
