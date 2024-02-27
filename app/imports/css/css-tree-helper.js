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

    #getNodeValue(node) {
        // console.log(node);

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

    #getDeclarationValue(decl) {
        let value = '';

        if (!decl.value.children) {
            return;
        }

        let current = decl.value.children.head;

        // console.log(decl);
        while (current != null) {
            // console.log(current);
            if (current.data.type === 'Function') {
                value += this.#getFunctionValue(current);
            } else {
                value += this.#getNodeValue(current);
            }
            current = current.next;
        }

        value = value.trim().replace(this.#regex.spaceAfterOpenParen, '(');
        value = value.replace(this.#regex.extraSpaces, ' ').replace(this.#regex.spaceBeforeComma, ',');
        // console.log('getDeclarationValue', value);

        let { line } = decl.loc.start;
        if (decl.loc.end.line !== line) {
            line += `-${decl.loc.end.line}`;
        }

        let { column } = decl.loc.start;
        if (decl.loc.end.column !== column) {
            column += `-${decl.loc.end.column}`;
        }

        const declaration = {
            declaration: value,
            loc: {
                line,
                col: column
            }
        };

        return declaration;
    }

    #getKeyFramePrelude(node) {
        if (node?.type === 'Raw') {
            return ` ${node.value}`;
        }

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

    #getRulePrelude(node) {
        let selector = '';
        // console.log(node);
        let current = node?.children?.head || node?.data?.children?.head || null;
        while (current != null) {
            // console.log(current);
            if (current?.children?.head) {
                selector += this.#getRulePrelude(current);
            } else if (current?.data?.children) {
                selector += `, ${this.#getRulePrelude(current)}`;
            } else {
                switch (current.data.type) {
                    case 'ClassSelector':
                        selector += `.${current.data.name}`;
                        break;
                    case 'Combinator':
                        selector += ` ${current.data.name} `;
                        break;
                    case 'IdSelector':
                        selector += `#${current.data.name}`;
                        break;
                    case 'Percentage':
                        selector += `${current.data.value}%`;
                        break;
                    case 'PseudoClassSelector':
                        selector += `:${current.data.name}`;
                        break;
                    case 'PseudoElementSelector':
                        selector += `::${current.data.name}`;
                        break;
                    default:
                        selector += current.data.name;
                }
            }
            current = current.next;
        }

        return selector;
    }

    parse(cssStr = '') {
        const ast = CssTree.parse(cssStr, { positions: true });

        const ruleMap = {};

        let nodeCount = 1;

        CssTree.walk(ast, (node) => {
            if (node.type === 'Atrule') {
                this.#processAtRule(ruleMap, node, nodeCount);
            } else if (node.type === 'Rule') {
                this.#processRule(ruleMap, node, nodeCount);
            }
            nodeCount += 1;
        });

        const struct = {
            som: ruleMap,
            src: cssStr
        };

        // console.log(ruleMap);
        // console.log(cssStr);

        return new CssSom(struct);
    }

    #processAtRule(ruleMap, node, nodeCount) {
        if (node.processed) {
            return;
        }
        // eslint-disable-next-line no-param-reassign
        node.processed = true;

        let property = `@${node.name}${this.#getKeyFramePrelude(node.prelude)}`;
        property = property
            .trimEnd()
            .replace(this.#regex.commaBeforeAnd, ' and')
            .replace(this.#regex.commaAtEnd, '')
            .replace(this.#regex.extraSpaces, ' ');

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

        let { line } = node.loc.start;
        if (node.loc.end.line !== line) {
            line += `-${node.loc.end.line}`;
        }

        let { column } = node.loc.start;
        if (node.loc.end.column !== column) {
            column += `-${node.loc.end.column}`;
        }

        const declaration = {
            declaration: declarationObj,
            loc: {
                line,
                col: column
            }
        };

        // eslint-disable-next-line no-param-reassign
        ruleMap[`${property} N<${nodeCount}>`] = declaration;
    }

    #processRule(ruleMap, node, nodeCount) {
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

        let { line } = node.loc.start;
        if (node.loc.end.line !== line) {
            line += `-${node.loc.end.line}`;
        }

        let { column } = node.loc.start;
        if (node.loc.end.column !== column) {
            column += `-${node.loc.end.column}`;
        }

        const declaration = {
            declaration: declarationObj,
            loc: {
                line,
                col: column
            }
        };

        // console.log(declarations);

        // eslint-disable-next-line no-param-reassign
        ruleMap[`${prelude} N<${nodeCount}>`] = declaration;
    }

}

export default new CssTreeHelper();
