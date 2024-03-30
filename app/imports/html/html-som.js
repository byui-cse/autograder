import { GetLines, GetValue, WhatIs } from '../helpers.js';

/**
 * The Structured Object Model (SOM) for HTML.
 */
class HtmlSom {

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

    /**
     * Search the SOM and find the first node that matches the requested pattern.
     *
     * @param {string} str The pattern to search for; querySelector like.
     * @returns {object} The object for the first matching node or an empty object.
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
     * @returns {array} An array of matching node objects or an empty array.
     */
    findAll(str) {
        // The search string is querySelector like so break it into it's parts (levels).
        const parts = str.trim().split(' ');

        // Start the initial search at the root of the SOM.
        const { som } = this.#struct;
        let search = som;

        // Search down the SOM until no matches are found or we reach the end of the SOM.
        parts.forEach((part) => {
            const { element, selectors } = this.#getSelectorParts(part);
            const matches = [];

            // Find all matches.
            this.#findAll(search, element, selectors, matches);

            // If we found matches treat them as the new SOM.
            if (matches.length > 0) {
                search = matches;
            } else {
                search = som;
            }
        });

        // If search is not equal to the original SOM that means we found match(s).
        if (search !== som) {
            return search;
        }
        return [];
    }

    /**
     * @private
     * Search for all the matches at the provided SOM level.
     *
     * @param {object} som The current SOM to search for matches.
     * @param {string} element The string that represents this element (tag).
     * @param {object} selectors An object or arrays for this elements id, classes, and data attributes.
     * @param {array} matches An array to append matches to.
     */
    #findAll(som, element, selectors, matches) {
        const regex = this.#makeRegex(element);

        som.forEach((node, key) => {

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
     * Get the source code that was parsed to create the current SOM.
     */
    get src() {
        return this.#struct.src || '';
    }

    /**
     * Convert a string representing an html element into the tag (element) itself with attributes
     * removed and recorded in a separate object.
     *
     * @param {string} part The string that makes up the opening tag of an html element.
     * @returns
     */
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

    /**
     * Get the SOM object.
     *
     * @returns {object} The SOM object.
     */
    getStructure() {
        return { ...this.#struct };
    }

    /**
     * @private
     * Build RegExp objects that can find if a string contains our pattern.
     *
     * @param {string} str The search string (pattern) we need want to look for.
     * @returns {array} An array of RegExp objects that can find if a string contains our pattern.
     */
    #makeRegex(str = '.*') {
        const regex = [
            new RegExp(`^${str}$|\\s+${str}$|^${str}\\s+|\\s+${str}\\s+`)
        ];

        return regex;
    }

    /**
     * Allow the SOM object to be updated or replaced after initialization.
     *
     * @param {object} struct The new SOM object.
     */
    updateStructure(struct = new Map()) {
        this.#verifyStructure(struct);
        this.#struct = struct;
    }

    /**
     * @private
     * Verify and fix the new SOM structure to avoid any errors with a bad SOM.
     *
     * @param {object} struct The SOM structure that will be used.
     */
    #verifyStructure(struct) {
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
