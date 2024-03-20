import { GetLines, GetValue, WhatIs } from '../helpers.js';

/**
 * The Structured Object Model (SOM) for CSS.
 */
class CssSom {

    #regex = {
        checkForSpacesAndCssSymbols: /\s+[>+~*&^$|]*\s*/g,
        findAndReplacePlus: /([^\s\n])\+([^\s\n])/g,
        findAndReplaceStar: /(\*)/g,
        isClassOrId: /[.#]\w+/g
    };

    #struct = {};

    constructor(struct) {
        this.updateStructure(struct);
    }

    get src() {
        return this.#struct.src || '';
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
        const parts = this.#prepSearchString(str.trim()).split(',');

        // Start the initial search at the root of the SOM.
        let search = this.#struct.som;

        // Setup variables we need to track/update as we traverse the SOM.
        const levels = parts.length;
        let matches = [];

        // Search down the SOM until no matches are found or we reach the end of the SOM.
        for (let i = 0; i < levels; i++) {
            // What should we look for on this level of the SOM.
            const part = parts[i].trim();

            // Rest matches ever time we move down a level.
            matches = [];

            // Find all matches.
            this.#findAll(search, part, matches);

            // Do we have any matches at this level?
            if (matches.length > 0) {
                // Yes matches were found. Are we on the last level?
                if (i + 1 >= levels) {
                    // Yes, return the matches we have left.
                    break;
                }

                // No we are not at the last level, move down a level and keep searching for matches.
                search = {};

                // eslint-disable-next-line no-loop-func
                matches.forEach((obj) => {
                    // We build a smaller version of the SOM that represents traversing down a branch.
                    const child = obj[obj.key];
                    Object.keys(child.declaration).forEach((childKey) => {
                        search[childKey] = child.declaration[childKey];
                    });
                });
            } else {
                // No matches found.
                break;
            }
        }

        return matches;
    }

    /**
     * @private
     * Search for all the matches at the provided SOM level.
     *
     * @param {object} som The current SOM to search for matches.
     * @param {string} part The pattern to check for.
     * @param {Array} matches An array to append matches to.
     */
    #findAll(som, part, matches) {
        const regex = this.#makeRegex(part);

        // Make an array of keys that match the pattern (part).
        const keys = Object.keys(som).filter((key) => {
            if (regex.some((rx) => rx.test(key))) {
                return true;
            }
            return false;
        });

        // Append all matches to the match array.
        keys.forEach((key) => {
            matches.push({
                key,
                value: som[key]
            });
        });
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
    #makeRegex(str) {
        // Escape any stars since that is a valid CSS character.
        if (this.#regex.findAndReplaceStar.test(str)) {
            // eslint-disable-next-line no-param-reassign
            str = str.replace(this.#regex.findAndReplaceStar, '\\*');
        }

        // Replace plus with any match: @media+print --> @media.*print
        if (this.#regex.findAndReplacePlus.test(str)) {
            // eslint-disable-next-line no-param-reassign
            str = str.replace(this.#regex.findAndReplacePlus, '$1.*$2');
        }

        // General declaration patterns to match for.
        const regex = [
            new RegExp(`^${str}$|\\s+${str}$|^${str}\\s+|\\s+${str}\\s+`, 'i'),
            new RegExp(`^${str}[,:]|\\s+{str}[,:]`, 'i')
        ];

        // If the user is looking for a key with a specific class or id loosen the matching requirements.
        if (this.#regex.isClassOrId.test(str)) {
            regex.push(new RegExp(`.${str}\\s+|${str}.`, 'i'));
        }

        return regex;
    }

    /**
     * @private
     * Clean the users search to work properly with CSS's declarations (SOM keys).
     *
     * @param {string} str The pattern the user is searching for.
     * @returns {string} A cleaned pattern that takes into account CSS specific intricacies.
     */
    #prepSearchString(str) {
        const symbols = ['>', '+', '~', '*', '&', '^', '$', '|'];
        const matches = str.matchAll(this.#regex.checkForSpacesAndCssSymbols);
        let replacements = 0; // As we add commas we need to shift the index by this amount.
        let result = str;

        // Check every space we found in the string.
        for (const match of matches) {
            // If this match contains a symbol leave it alone and do not add a comma
            const skip = symbols.some((symbol) => {
                if (match[0].includes(symbol)) {
                    return true;
                }
                return false;
            });

            if (skip) {
                continue;
            }

            // Add a comma to the pattern; we will split on these to determine or SOM levels later.
            result = `${result.slice(0, match.index + replacements)}, ${result.slice(match.index + 1 + replacements)}`;
            replacements += 1;
        }

        return result;
    }

    /**
     * Allow the SOM object to be updated or replaced after initialization.
     *
     * @param {object} struct The new SOM object.
     */
    updateStructure(struct = {}) {
        this.#verifyStructure(struct);
        this.#struct = struct;
    }

    /**
     * @private
     * Verify and fix the new SOM structure to avoid any errors with a bad  SOM.
     *
     * @param {object} struct The SOM structure that will be used.
     */
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

CssSom.prototype.getLines = GetLines;
CssSom.prototype.getValue = GetValue;

export default CssSom;
