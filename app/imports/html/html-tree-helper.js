import * as HtmlParser from 'parse5';
import HtmlSom from './html-som.js';

/**
 * Transforms the Parse5 tree into Autograder's CssSom.
 * @class
 */
class HtmlTreeHelper {

    /**
     * Uses Parse5 to parse a string of HTML into a AST like tree / linked list.
     *
     * @param {string} htmlStr A string of HTML code.
     * @returns {HtmlSom} The SOM for this provides HTML.
     */
    parse(htmlStr = '') {
        const dom = HtmlParser.parse(htmlStr, { sourceCodeLocationInfo: true });

        const struct = {
            som: null,
            src: htmlStr
        };

        struct.som = this.#walk(dom.childNodes, struct);

        return new HtmlSom(struct);
    }

    /**
     * Walk the "DOM" returned by Parse5 and convert it into our HTML SOM.
     *
     * @param {array} nodes An array of all child Nodes at the current level in the "DOM" tree.
     * @param {object} struct An object that represents the HTML SOM we are building.
     * @param {int} nodeCount How many nodes have been processed; used as a unique id number for keys.
     * @returns
     */
    #walk(nodes, struct, nodeCount = 0) {
        const maps = new Map();

        nodes.forEach((node) => {
            // Ignore nodes with no official tag name; usually comments and text elements.
            if (!node.tagName) {
                return;
            }

            // eslint-disable-next-line no-param-reassign
            nodeCount += 1;

            // Build this nodes attribute string but also keep a separate map of the attribute key value pairs.
            const attrsMap = new Map();
            let attributes = '';
            if (node.attrs) {
                node.attrs.forEach((attrObj) => {
                    attrsMap.set(attrObj.name, attrObj.value);
                    attributes += `${attrObj.name}="${attrObj.value}" `;
                });
            }
            attributes = ` ${attributes}`;

            // Recurse down the "DOM" (tree) and process child nodes.
            let children = null;
            if (node.childNodes) {
                children = this.#walk(node.childNodes, struct, nodeCount);
            }

            // Convert Parse5's location object into the Autograder style.
            let loc = {};
            try {
                loc = {
                    start: {
                        line: node.sourceCodeLocation?.startLine || 0,
                        column: node.sourceCodeLocation?.startCol || 0
                    },
                    end: {
                        line: node.sourceCodeLocation?.endLine || 0,
                        column: node.sourceCodeLocation?.endCol || 0
                    }
                };
            } catch (e) {
                // TODO: In an upcoming release this should be removed leave for now to catch edge cases.
                console.log(node);
            }

            // TODO: Should we remove this or re-enable it?
            // Remove unnecessary location data from the structure we are keeping in memory.
            // delete node.sourceCodeLocation;

            // Record the completed node to the map for the level we are currently processing.
            const key = `${node.tagName}${attributes.trimEnd()} N<${nodeCount}>`;
            maps.set(key, {
                attrsMap, children, node, loc
            });
        });

        return maps;
    }

}

export default new HtmlTreeHelper();
