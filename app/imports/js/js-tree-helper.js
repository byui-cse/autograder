import { Parser as Acorn } from 'acorn';
import JsSom from './js-som.js';
import { GetLines, WhatIs } from '../helpers.js';

/**
 * Transforms the Acorn JavaScript tree into Autograder's JsSom.
 * @class
 */
class JsTreeHelper {

    /**
     * @private
     * @type {int}
     * How many nodes have been processed.
     */
    #nodeCount = 0;

    /**
     * @private
     * @type {string}
     * The source code for the file being processed.
     */
    #source = '';

    /**
     * @private
     * Determines the proper key for class and function declarations.
     *
     * @param {Node} node The Acorn Node being processed.
     * @returns {string} The key that represents this node.
     */
    #createClassOrFunctionKey(node) {
        const { loc } = node.id;

        let startLine = loc.start.line;
        let endLine = loc.end.line;
        let startColumn = loc.start.column;
        let endColumn = loc.end.column;

        const baseClass = GetLines(this.#source, startLine, endLine, startColumn, endColumn).trim();

        let superClass = '';
        if (node.superClass) {
            superClass += ' extends ';

            startLine = node.superClass.loc.start.line;
            endLine = node.superClass.loc.end.line;
            startColumn = node.superClass.loc.start.column;
            endColumn = node.superClass.loc.end.column;

            superClass += GetLines(this.#source, startLine, endLine, startColumn, endColumn).trim();
        }

        if (node.type.includes('Function')) {
            return `function ${baseClass}${superClass}`;
        }

        return `class ${baseClass}${superClass}`;
    }

    /**
     * @private
     * Determines the proper key for class methods (class functions) and properties (class variables).
     *
     * @param {Node} node The Acorn Node being processed.
     * @returns {string} The key that represents this node.
     */
    #createClassMethodOrPropertyKey(node) {
        const { loc } = node.key;
        const startLine = loc.start.line;
        const endLine = loc.end.line;
        const startColumn = loc.start.column;
        const endColumn = loc.end.column;

        // If kind is missing this is a property.
        const kind = node.kind || 'property';

        let key = `${kind} ${GetLines(this.#source, startLine, endLine, startColumn, endColumn).trim()}`;

        // If the method or property is private or static modify the key accordingly.
        if (key.includes('#')) {
            key = `private ${key}`;
        }

        if (node.static) {
            key = `static ${key}`;
        }
        return key;
    }

    /**
     * @private
     * Determines the proper key for declarations like var, let, and const. If a class or function
     * is being stored in a variable we add the appropriate flag (class|function) to the key as well.
     *
     * @param {Node} node The Acorn Node being processed.
     * @returns {string} The key that represents this node.
     */
    #createDeclarationKey(node) {
        let { loc } = node;
        let startLine = 0;
        let endLine = 0;
        let startColumn = 0;
        let endColumn = 0;

        // var, let, or const.
        let declarations = `${node.kind} `;

        // You can declare more than one variable at once, so handle that edge case.
        node.declarations.forEach((declaration) => {
            // Get the initial key (variable name).
            loc = {
                start: {
                    line: declaration.id.loc.start.line,
                    column: declaration.id.loc.start.column
                },
                end: {
                    line: declaration.id.loc.end.line,
                    column: declaration.id.loc.end.column
                }
            };

            startLine = loc.start.line;
            endLine = loc.end.line;
            startColumn = loc.start.column;
            endColumn = loc.end.column;

            // If this variable is storing a class or function modify the key accordingly.
            if (declaration?.init?.type.includes('Class')) {
                declarations += 'class ';
            } else if (declaration?.init?.type.includes('Function')) {
                declarations += 'function ';
            }

            // Add to the comma separated list of variable declarations (if any).
            declarations += `${GetLines(this.#source, startLine, endLine, startColumn, endColumn).trim()}, `;
        });

        // Remove the trailing space and comma added by this process.
        return declarations.substring(0, declarations.length - 2);
    }

    /**
     * @private
     * Determines the proper key for expression statements.
     *
     * @param {Node} node The Acorn Node being processed.
     * @returns {string} The key that represents this node.
     */
    #createExpressionKey(node) {
        // If this is a Literal node just use its value directly.
        if (node.expression.type === 'Literal') {
            return node.expression.value.replace(/'|"/g, '');
        }

        // All expression statements are being "called" in context.
        let prefix = 'call ';

        // If we have a specific edge case sequence modify the key accordingly.
        if (node.expression.type === 'SequenceExpression') {
            prefix += 'sequence ';
        } else if (node.expression.type === 'BinaryExpression') {
            prefix += 'binary ';
        }

        // Now determine the actual expression.
        let startLine = node.expression.loc.start.line;
        let endLine = node.expression.loc.end.line;
        let startColumn = node.expression.loc.start.column;
        let endColumn = node.expression.loc.end.column;

        if (node.expression.callee) {

            // Is the expression being called part of an object or static method?
            if (node.expression.callee.type === 'MemberExpression') {
                prefix += 'member ';
            }

            startLine = node.expression.callee.loc.start.line;
            endLine = node.expression.callee.loc.end.line;
            startColumn = node.expression.callee.loc.start.column;
            endColumn = node.expression.callee.loc.end.column;
        }

        const key = GetLines(this.#source, startLine, endLine, startColumn, endColumn).trim();

        // If this call is to update a counter modify the key accordingly.
        if (key.includes('++') || key.includes('+=')) {
            prefix += 'incrementer ';
        }
        if (key.includes('--') || key.includes('-=')) {
            prefix += 'decrementer ';
        }

        // Clean up any artifacts: multiple spaces and parentheses from the call.
        return `${prefix}${key.replace(/ {2,}|\n/g, '').replace(/\(|\)/g, '')}`;
    }

    /**
     * @private
     * Determines the proper key for more common statements.
     *
     * @param {Node} node he Acorn Node being processed.
     * @returns {string} The key that represents this node.
     */
    #createStatementKey(node) {
        switch (node.type) {
            case 'BlockStatement':
                return 'block statement';
            case 'BreakStatement':
                return 'break statement';
            case 'ContinueStatement':
                return 'continue statement';
            case 'DebuggerStatement':
                return 'debugger statement';
            case 'DoWhileStatement':
                return 'do while loop';
            case 'EmptyStatement':
                return 'empty statement';
            case 'ExpressionStatement':
                /**
                 * This is variable declaration and should never come up here. The private method
                 * #createExpressionKey handles the complexities of those keys.
                 */
                return 'expression statement';
            case 'ForInStatement':
                return 'for in loop';
            case 'ForOfStatement':
                return 'for of loop';
            case 'ForStatement':
                return 'for loop';
            case 'IfStatement':
                return 'if statement';
            case 'LabeledStatement':
                return 'labeled statement';
            case 'ReturnStatement':
                return 'return statement';
            case 'SwitchStatement':
                return 'switch case statement';
            case 'ThrowStatement':
                return 'throw statement';
            case 'TryStatement':
                if (node.finalizer) {
                    return 'try catch finally statement';
                }
                return 'try catch statement';
            case 'WhileStatement':
                return 'while loop';
            case 'WithStatement':
                return 'with statement';
        }
        // Please open an issue if you ever see this.
        return 'Unknown Statement';
    }

    /**
     * @private
     * Determine the string (key) that represents this node.
     *
     * @param {Node} node The Acorn Node being processed.
     * @returns {string} The key that represents this node.
     */
    #getNodeKey(node) {
        const { loc } = node;
        const startLine = loc.start.line;
        const endLine = loc.end.line;
        const startColumn = loc.start.column;
        const endColumn = loc.end.column;

        if (node.type === 'StaticBlock') {
            return 'static block';
        }

        if (node.id) {
            // Class declarations.
            return this.#createClassOrFunctionKey(node);
        }
        if (node.expression) {
            // Any expression statements.
            return this.#createExpressionKey(node);
        }

        if (node.declarations) {
            // Variable declarations.
            return this.#createDeclarationKey(node);
        }

        if (node.type.includes('Statement')) {
            // All other general statements.
            return this.#createStatementKey(node);
        }

        if (node.key) {
            // Class properties or methods.
            return this.#createClassMethodOrPropertyKey(node);
        }

        // Generic catch all for anything else.
        return GetLines(this.#source, startLine, endLine, startColumn, endColumn).trim();
    }

    /**
     * Parses a JavaScript snippet or source code into the JsSom object for use with Autograder.
     *
     * @param {string} jsStr The JavaScript source code to process.
     * @returns {JsSom|Object} A working JsSom or an object with error information.
     */
    parse(jsStr = '') {
        let nodes = '';

        // Attempt to create a AST tree of the JavaScript source using Acorn.
        try {
            nodes = Acorn.parse(jsStr, {
                ecmaVersion: 'latest',
                allowImportExportEverywhere: true,
                locations: true // Line and column numbers.
            });
        } catch (err) {
            return {
                error: true,
                message: err.toString(),
                position: err.loc,
                stack: err.stack
            };
        }

        // Hang on to the source code; we'll need to cut out sections in various methods.
        this.#source = jsStr;

        // Start building the JsSom object.
        const struct = {
            classes: {},
            error: false,
            functions: {},
            som: {},
            src: jsStr,
            variables: {}
        };

        // Process all the Acorn nodes into our JsSom structure.
        if (nodes) {
            this.#processNodes(nodes, struct.som, struct);
        }

        // Return to the user a proper JsSom.
        return new JsSom(struct);
    }

    /**
     * Add a node to the som (JsDom) and recursively process any of this nodes children.
     *
     * @param {Node} node The Acorn Node being processed.
     * @param {Object} som The JsDom like object being built up.
     * @param {Object} struct The rest of the structure object that will be used to create a JsSom.
     */
    #processNode(node, som, struct) {
        if (!node.type) {
            return;
        }

        // Skip over class bodies so we can skip an unnecessary level in the JsSom tree.
        if (node.type === 'ClassBody') {
            if (node.body) {
                if (WhatIs(node.body) === 'array') {
                    node.body.forEach((child) => {
                        this.#processNodes(child, som, struct);
                    });
                } else {
                    this.#processNodes(node.body, som, struct);
                }
            }
            return;
        }

        // Increment the global node counter.
        this.#nodeCount += 1;

        // Create a temporary object for the JsSom structure we need to make for deeper levels.
        const children = {};

        const key = `${this.#getNodeKey(node)} N<${this.#nodeCount}>`;
        if (!key) {
            // Please open an issue if you ever see this.
            // eslint-disable-next-line no-console
            console.error(`Unaccounted for node type: ${node.type}`);
        }

        // If this node has a body process it; this is the children, deeper level of the tree.
        if (node.body) {
            if (WhatIs(node.body) === 'array') {
                node.body.forEach((child) => {
                    this.#processNodes(child, children, struct);
                });
            } else {
                this.#processNodes(node.body, children, struct);
            }
        }

        // Add this node to the som which will make up the JsSom tree later.
        const { loc } = node;
        // eslint-disable-next-line no-param-reassign
        som[key] = {
            children,
            node,
            loc
        };

        /**
         * Record classes, functions, and variables in aggregated lists so we can jump quickly to
         * them in the JsSom when performing searches.
         */
        if (key.includes('class ')) {
            // eslint-disable-next-line no-param-reassign
            struct.classes[key] = som[key];
        }
        if (key.includes('function ')) {
            // eslint-disable-next-line no-param-reassign
            struct.functions[key] = som[key];
        }
        if (['const ', 'let ', 'var '].some((el) => key.includes(el))) {
            // eslint-disable-next-line no-param-reassign
            struct.variables[key] = som[key];
        }
    }

    /**
     * Recursively process the Acorn nodes and transform them into the JsDom tree.
     *
     * @param {Node} node The Acorn Node being processed.
     * @param {Object} som The JsDom like object being built up.
     * @param {Object} struct The rest of the structure object that will be used to create a JsSom.
     */
    #processNodes(node, som, struct) {
        if (node.type !== 'Program') {
            this.#processNode(node, som, struct);
        } else if (Array.isArray(node.body)) {
            node.body.forEach((nestedNode) => {
                this.#processNodes(nestedNode, som, struct);
            });
        } else {
            this.#processNodes(node.body, som, struct);
        }
    }

}

export default new JsTreeHelper();
