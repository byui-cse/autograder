class Reporter {

    /**
     * Construct the standard report object with a src property and error, warning, and notice arrays.
     *
     * @returns {object} Report object.
     */
    getReportsObject() {
        return {
            src: '',
            error: [],
            notice: [],
            warning: []
        };
    }

    /**
     * Construct a report item that can be added to the reports object.
     *
     * @param {string} text - Description or message associated with the rule violation.
     * @param {string} rule [rule=''] - Rule identifier.
     * @param {string} line [line=0] - Line number or range where the violation occurred.
     * @param {string} col [col=0] - Column number or range where the violation occurred.
     * @returns {object} Report item object.
     */
    makeReport(text, rule = '', line = 0, col = 0) {
        return {
            col, line, rule, text
        };
    }

    /**
     * Deep merge two objects together keeping unique keys from each object.
     *
     * @param {object} mergeIntoObj - The object to merge another object into.
     * @param {object} mergeAndPrioritizeObj - The object to merge into mergeIntoObject. This object
     * has priority when collisions occur.
     * @returns
     */
    deepMerge(mergeIntoObj, mergeAndPrioritizeObj) {

        const isPlainObject = (value) => value && typeof value === 'object' && value.constructor === Object;

        // Recursively merge plain objects and arrays.
        const merge = (a, b) => {
            for (const key in b) {
                if (isPlainObject(a[key]) && isPlainObject(b[key])) {
                    merge(a[key], b[key]);
                } else {
                    // eslint-disable-next-line no-param-reassign
                    a[key] = b[key];
                }
            }
        };

        // Clone first object to target.
        const merged = { ...mergeIntoObj };

        // Merge objects recursively.
        merge(merged, mergeAndPrioritizeObj);

        return merged;
    }

}

export default new Reporter();
