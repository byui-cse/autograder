import * as CssTree from 'css-tree';
import CssSom from './css-som.js';

class CssTreeHelper {

    #regex = {
        commaAndSpaceAtStart: /^\s*,\s*/g,
        commaAtEnd: /,$/g,
        commaBeforeAnd: /, +and/g,
        extraSpaces: / {2,}/g,
        spaceAfterOpenParen: /\( +/g,
        spaceBeforeComma: /\s+,/g
    };

    /**
     * @private
     * Transform a CSS Tree function node into a querySelector like string.
     *
     * @param {object} node The CSS Tree object for this node.
     * @returns {string} The querySelector like representation of this node.
     */
    #getFunctionValue(node) {
        let value = ` ${node.data.name}(`;

        let current = node.data.children.head;
        while (current != null) {
            if (current.data.type === 'Function') {
                value += this.#getFunctionValue(current);
            } else {
                value += this.#getNodeValue(current);
            }
            current = current.next;
        }

        return `${value.trimEnd()})`;
    }

    /**
     * @private
     * Transform a CSS Tree generic node into a querySelector like string.
     *
     * @param {object} node The CSS Tree object for this node.
     * @returns {string} The querySelector like representation of this node.
     */
    #getNodeValue(node) {
        let value = ` ${node.data?.value || node.data?.name || ''}`;
        switch (node.data?.type) {
            case 'Dimension':
                value += node.data?.unit || '';
                break;
            case 'Hash':
                value = `#${value.trimStart()}`;
                break;
            case 'Percentage':
                value += '%';
                break;
            case 'Identifier':
            case 'Operator':
                value += ' ';
                break;
        }
        return value;
    }

    /**
     * @private
     * Transform a CSS Tree declaration node into a querySelector like string.
     *
     * @param {object} node The CSS Tree object for this node.
     * @returns {string} The querySelector like representation of this node.
     */
    #getDeclarationValue(decl) {
        let value = '';

        // If there are no children objects making up this node use its value directly.
        if (!decl.value.children) {
            return value;
        }

        // Start building up the querySelector like string from the children objects.
        let current = decl.value.children.head;
        while (current != null) {
            if (current.data.type === 'Function') {
                value += this.#getFunctionValue(current);
            } else {
                value += this.#getNodeValue(current);
            }
            current = current.next;
        }

        // Clean out unnecessary formatting.
        value = value.trim().replace(this.#regex.spaceAfterOpenParen, '(');
        value = value.replace(this.#regex.extraSpaces, ' ').replace(this.#regex.spaceBeforeComma, ',');

        // eslint-disable-next-line no-param-reassign
        delete decl.loc.source;
        // eslint-disable-next-line no-param-reassign
        delete decl.loc.start.offset;
        // eslint-disable-next-line no-param-reassign
        delete decl.loc.end.offset;

        // Return our own SOM style node.
        return {
            declaration: value,
            loc: decl.loc
        };
    }

    /**
     * @private
     * Transform a CSS Tree key frame node into a querySelector like string.
     *
     * @param {object} node The CSS Tree object for this node.
     * @returns {string} The querySelector like representation of this node.
     */
    #getKeyFramePrelude(node) {
        // If this node is simple, use its raw value.
        if (node?.type === 'Raw') {
            return ` ${node.value}`;
        }

        // Complex node, determine the correct type.
        let property = '';
        let current = node?.children.head;
        while (current != null) {
            const { data } = current;
            switch (data.type) {
                case 'MediaFeature':
                    // eslint-disable-next-line no-case-declarations
                    const val = data.value;
                    property += ` (${data.name}: ${val?.name || val?.value || ''}${val?.unit || ''}),`;
                    break;
                case 'MediaQuery':
                case 'MediaQueryList':
                    property += this.#getKeyFramePrelude(data);
                    break;
                default:
                    property += ` ${data.name} `;
            }
            current = current.next;
        }
        return property;
    }

    /**
     * @private
     * Transform a CSS Tree prelude node into a querySelector like string.
     *
     * @param {object} node The CSS Tree object for this node.
     * @returns {string} The querySelector like representation of this node.
     */
    #getRulePrelude(node) {
        let selector = '';

        // Find a valid node to start traversing its linked list.
        let current = node?.children?.head || node?.data?.children?.head || null;
        while (current != null) {
            // Recursively build the querySelector like string for this node.
            if (current?.children?.head) {
                selector += this.#getRulePrelude(current);
            } else if (current?.data?.children) {
                selector += `, ${this.#getRulePrelude(current)}`;
            } else {
                const curNode = current.data;
                switch (curNode.type) {
                    case 'AttributeSelector':
                        // console.log(curNode);
                        selector += `[${curNode.name.name}${curNode.matcher}"${curNode.value?.value}"]`;
                        break;
                    case 'ClassSelector':
                        selector += `.${curNode.name}`;
                        break;
                    case 'Combinator':
                        selector += ` ${curNode.name} `;
                        break;
                    case 'IdSelector':
                        selector += `#${curNode.name}`;
                        break;
                    case 'Percentage':
                        selector += `${curNode.value}%`;
                        break;
                    case 'PseudoClassSelector':
                        selector += `:${curNode.name}`;
                        break;
                    case 'PseudoElementSelector':
                        selector += `::${curNode.name}`;
                        break;
                    default:
                        selector += current.data.name;
                }
            }
            current = current.next;
        }

        return selector.replace(/ {2,}/g, ' ');
    }

    /**
     * Uses CSS Tree to parse a string of CSS into a AST like tree / linked list.
     *
     * @param {string} cssStr A string of CSS code.
     * @returns {CssSom} The SOM for this provides CSS.
     */
    parse(cssStr = '') {
        // Get the CSS Tree
        const ast = CssTree.parse(cssStr, { positions: true });

        // Start building the CSS SOM.
        const ruleObj = {};

        // Walk the CSS Tree and build our CSS SOM.
        let nodeCount = 1;
        CssTree.walk(ast, (node) => {
            if (node.type === 'Atrule') {
                this.#processAtRule(ruleObj, node, nodeCount);
            } else if (node.type === 'Rule') {
                this.#processRule(ruleObj, node, nodeCount);
            }
            nodeCount += 1;
        });

        return new CssSom({
            som: ruleObj,
            src: cssStr
        });
    }

    /**
     * @private
     * Transform a CSS Tree at (@) node into a querySelector like string.
     *
     * @param {object} ruleObj The CSS SOM.
     * @param {object} node The current CSS Tree node being processed.
     * @param {int} nodeCount The current node count used to give each node a unique id.
     */
    #processAtRule(ruleObj, node, nodeCount) {
        // Because we process recursively we need to stop recursion from becoming circular.
        if (node.processed) {
            return;
        }
        // eslint-disable-next-line no-param-reassign
        node.processed = true;

        // Build the querySelector like media rule.
        let property = `@${node.name}${this.#getKeyFramePrelude(node.prelude)}`;
        property = property
            .trimEnd()
            .replace(this.#regex.commaBeforeAnd, ' and')
            .replace(this.#regex.commaAtEnd, '')
            .replace(this.#regex.extraSpaces, ' ');

        // Process the body (children) of this media rule.
        const declarationObj = {};
        let current = node?.block?.children?.head;
        while (current != null) {
            if (current.data.type === 'Atrule') {
                this.#processAtRule(declarationObj, current.data, nodeCount + 1);
            } else if (current.data.type === 'Rule') {
                this.#processRule(declarationObj, current.data, nodeCount + 1);
            }
            current = current.next;
        }

        // eslint-disable-next-line no-param-reassign
        delete node.loc.source;
        // eslint-disable-next-line no-param-reassign
        delete node.loc.start.offset;
        // eslint-disable-next-line no-param-reassign
        delete node.loc.end.offset;

        const declaration = {
            declaration: declarationObj,
            loc: node.loc
        };

        // eslint-disable-next-line no-param-reassign
        ruleObj[`${property} N<${nodeCount}>`] = declaration;
    }

    /**
     * @private
     * Transform a CSS Tree at node into a querySelector like string.
     *
     * @param {object} ruleObj The CSS SOM.
     * @param {object} node The current CSS Tree node being processed.
     * @param {int} nodeCount The current node count used to give each node a unique id.
     */
    #processRule(ruleObj, node, nodeCount) {
        // Because we process recursively we need to stop recursion from becoming circular.
        if (node.processed) {
            return;
        }
        // eslint-disable-next-line no-param-reassign
        node.processed = true;

        const prelude = this.#getRulePrelude(node.prelude)
            .replace(this.#regex.commaAndSpaceAtStart, '')
            .trim();

        const declarationObj = node.block.children.map((decl) => ({
            loc: decl.loc,
            property: decl.property,
            value: decl.value
        })).reduce((acc, decl) => {
            acc[decl.property] = this.#getDeclarationValue(decl);
            return acc;
        }, {});

        // eslint-disable-next-line no-param-reassign
        delete node.loc.source;
        // eslint-disable-next-line no-param-reassign
        delete node.loc.start.offset;
        // eslint-disable-next-line no-param-reassign
        delete node.loc.end.offset;

        const declaration = {
            declaration: declarationObj,
            loc: node.loc
        };

        // eslint-disable-next-line no-param-reassign
        ruleObj[`${prelude} N<${nodeCount}>`] = declaration;
    }

}

export default new CssTreeHelper();
