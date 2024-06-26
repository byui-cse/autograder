import Fs from 'fs';
import Path from 'path';
import Stylelint from 'stylelint';
import { ESLint } from 'eslint';
import { HTMLHint } from 'htmlhint';
import Reporter from './reporter.js';
import GetRootPaths from '../paths.js';
import { WhatIs } from './helpers.js';

const { APPDIR } = GetRootPaths();

/**
 * Class representing a reporter for linting CSS, HTML, and JS files.
 */
class Linter {

    #rules = {
        css: {
            rules: {}
        },
        js: {
            env: {
                browser: true
            },
            parserOptions: {
                ecmaVersion: 'latest'
            },
            rules: {}
        },
        html: {
            rules: {}
        }
    };

    #useDefaultRules = false;

    /**
     * Creates an instance of Reporter.
     *
     * @param {object} options A configuration with any combination of the following:
     *                         - Custom StyleLint configuration and rules.
     *                         - Custom HTMLHint rules.
     *                         - Custom ESLint configuration and rules.
     */
    constructor(options = {}, useDefaultLintRules = false) {
        this.#useDefaultRules = useDefaultLintRules;

        if (!options.cssConfig) {
            // eslint-disable-next-line no-param-reassign
            options.cssConfig = {};
        }
        if (!options.htmlConfig) {
            // eslint-disable-next-line no-param-reassign
            options.htmlConfig = {};
        }
        if (!options.jsConfig) {
            // eslint-disable-next-line no-param-reassign
            options.jsConfig = {};
        }
        this.#loadCssConfig(options.cssConfig);
        this.#loadHtmlConfig(options.htmlConfig);
        this.#loadJsConfig(options.jsConfig);
    }

    /**
     * @private
     * Private method to load a JSON configuration file.
     *
     * @param {string} config Path to the configuration file.
     * @returns {object} Parsed JSON configuration object.
     */
    #loadConfigFile(config) {
        let json = {
            rules: {}
        };

        if (!Fs.existsSync(config)) {
            return json;
        }

        const text = Fs.readFileSync(config, { encoding: 'utf8' });

        try {
            json = JSON.parse(text);
        } catch (e) { /* empty */ }

        return json;
    }

    /**
     * @private
     * Private method to load StyleLint rules from either a user supplied object or a configuration file.
     *
     * @param {object} config Custom StyleLint configuration and rules.
     */
    #loadCssConfig(config) {
        if (this.#verifyRuleObject(config)) {
            this.#rules.css = config;
            return;
        }

        if (!this.#useDefaultRules) {
            return;
        }

        const json = Path.join(APPDIR, 'configs', 'css-lint.json');
        this.#rules.css = this.#loadConfigFile(json);
    }

    /**
     * @private
     * Private method to load HTMLHint rules from either a user supplied object or a configuration file.
     *
     * @param {object} config Custom HTMLHint rules.
     */
    #loadHtmlConfig(config) {
        if (this.#verifyRuleObject(config)) {
            this.#rules.html = config;
            return;
        }

        if (!this.#useDefaultRules) {
            return;
        }

        const json = Path.join(APPDIR, 'configs', 'html-linter.json');
        this.#rules.html = this.#loadConfigFile(json);
    }

    /**
     * @private
     * Private method to load ESLint configuration from either a user supplied object or a configuration file.
     *
     * @param {object} config Custom ESLint configuration.
     */
    #loadJsConfig(config) {
        const forceBasicRequiredSettings = (configObj) => {
            if (!configObj.env) {
                // eslint-disable-next-line no-param-reassign
                configObj.env = {
                    browser: true
                };
            }
            if (!configObj.parserOptions) {
                // eslint-disable-next-line no-param-reassign
                configObj.parserOptions = {
                    ecmaVersion: 'latest'
                };
            }
        };

        if (this.#verifyRuleObject(config)) {
            forceBasicRequiredSettings(config);
            this.#rules.js = config;
            return;
        }

        if (!this.#useDefaultRules) {
            return;
        }

        const json = Path.join(APPDIR, 'configs', 'js-linter.json');
        const defaultConfig = this.#loadConfigFile(json);
        forceBasicRequiredSettings(config);
        this.#rules.js = defaultConfig;
    }

    /**
     * Asynchronously lints CSS code and generates a report.
     *
     * @param {string} css CSS code to be linted.
     * @param {object} rules Custom CSS linting rules.
     * @returns {Promise<object>} A promise resolving to the linting report object.
     */
    async lintCSS(css, rules = {}) {
        if (!this.#verifyRuleObject(rules)) {
            // eslint-disable-next-line no-param-reassign
            rules = this.#rules.css;
        }

        const report = Reporter.getReportsObject();
        let reportItems = '';

        try {
            reportItems = await Stylelint.lint({
                config: rules,
                code: css,
                fix: false // Report issues without fixing
            });
            reportItems = JSON.parse(reportItems.report);
        } catch (error) {
            const results = Reporter.makeReport(error, 'css-linter');
            report.error.push(results);
            return report;
        }

        /**
         * NOTE: reportItems is an array that should always contain 1 report but
         * just in case someone up the supply chain changes things it doesn't hurt
         * to loop through "all" items.
         */
        reportItems.forEach((finding) => {
            finding.warnings.forEach((item) => {
                let col = item.column;
                if (col !== item.endColumn) {
                    col += `-${item.endColumn}`;
                }
                let { line } = item;
                if (line !== item.endLine) {
                    line += `-${item.endLine}`;
                }
                const { rule } = item;
                let { text } = item;
                text = text.replace(` (${item.rule})`, '.');

                const results = Reporter.makeReport(text, rule, line, col);

                switch (item.severity) {
                    case 'error':
                        report.error.push(results);
                        break;
                    case 'warning':
                        report.warning.push(results);
                        break;
                    default:
                        report.notice.push(results);
                }
            });
        });

        return report;
    }

    /**
     * Asynchronously lints HTML code and generates a report.
     *
     * @param {string} html HTML code to be linted.
     * @param {object} config HTMLHint rules.
     * @returns {Promise<object>} A promise resolving to the linting report object.
     */
    async lintHTML(html, config = {}) {
        if (!this.#verifyRuleObject(config)) {
            // eslint-disable-next-line no-param-reassign
            config = this.#rules.html;
        }

        const report = Reporter.getReportsObject();

        HTMLHint.verify(html, config.rules).forEach((item) => {
            // NOTE: If we ever use item.message or item.raw we must also replace the < and > symbols.
            const { col } = item;
            const { line } = item;
            const rule = item.rule.id;
            const text = item.rule.description.replace(/</g, '&lt;').replace(/>/g, '&gt;');

            const results = Reporter.makeReport(text, rule, line, col);

            switch (item.type) {
                case 'error':
                    report.error.push(results);
                    break;
                case 'warning':
                    report.warning.push(results);
                    break;
                default:
                    report.notice.push(results);
            }
        });

        return report;
    }

    /**
     * Asynchronously lints JS code and generates a report.
     *
     * @param {string} js JS code to be linted.
     * @param {object} config Custom ESLint configuration and rules.
     * @returns {Promise<object>} A promise resolving to the linting report object.
     */
    async lintJS(js, config = {}) {
        if (!this.#verifyRuleObject(config)) {
            // eslint-disable-next-line no-param-reassign
            config = this.#rules.js;
        }

        const report = Reporter.getReportsObject();

        // Disable import/require warnings which will always fail in this context.
        // eslint-disable-next-line no-param-reassign
        config.rules['import/no-unresolved'] = 'off';
        // eslint-disable-next-line no-param-reassign
        config.rules['import/no-commonjs'] = 'off';

        // Create an ESLint instance
        const eslint = new ESLint({
            baseConfig: config,
            cache: false,
            fix: false,
            overrideConfig: config,
            useEslintrc: false
        });

        let reportItems;

        try {
            reportItems = await eslint.lintText(js);
        } catch (error) {
            const results = Reporter.makeReport(error, 'js-linter');

            report.error.push(results);
            return report;
        }

        /**
         * NOTE: reportItems is an array that should always contain 1 report but
         * just in case someone up the supply chain changes things it doesn't hurt
         * to loop through "all" items.
         */
        reportItems.forEach((finding) => {
            finding.messages.forEach((item) => {
                let col = item.column;
                if (col !== item?.endColumn) {
                    col += `-${item.endColumn}`;
                }
                let { line } = item;
                if (line !== item?.endLine) {
                    line += `-${item.endLine}`;
                }
                const rule = item.ruleId;
                const text = item.message;

                const results = Reporter.makeReport(text, rule, line, col);

                switch (item.severity) {
                    case 2:
                        report.error.push(results);
                        break;
                    case 1:
                        report.warning.push(results);
                        break;
                    default:
                        report.notice.push(results);
                }
            });
        });

        report.src = js;
        return report;
    }

    /**
     * Register Stylelint configurations and rules with the Linter.
     *
     * @param {object} obj A Stylelint configuration object for linting CSS code.
     */
    registerCssConfig(obj = {}) {
        if (WhatIs(obj) !== 'object') {
            return;
        }

        Object.keys(obj).forEach((key) => {
            this.#rules.css[key] = obj[key];
        });
    }

    /**
     * Register HTMLHint configurations and rules with the Linter.
     *
     * @param {object} obj A Parse5 configuration object for linting HTML code.
     */
    registerHtmlConfig(obj = {}) {
        if (WhatIs(obj) !== 'object') {
            return;
        }

        Object.keys(obj).forEach((key) => {
            this.#rules.html[key] = obj[key];
        });
    }

    /**
     * Register ESLint configurations and rules with the Linter.
     *
     * @param {object} obj A Stylelint configuration object for linting JS code.
     */
    registerJsConfig(obj = {}) {
        if (WhatIs(obj) !== 'object') {
            return;
        }

        Object.keys(obj).forEach((key) => {
            this.#rules.js[key] = obj[key];
        });
    }

    /**
     * @private
     * Private method to verify if an object is a valid rule object.
     *
     * @param {object} obj Object to be verified.
     * @returns {boolean} True if the object is a valid rule object, otherwise false.
     */
    #verifyRuleObject(obj) {
        if (WhatIs(obj) !== 'object') {
            return false;
        }
        if (Object.keys(obj).length === 0) {
            return false;
        }
        if (!('rules' in obj)) {
            return false;
        }
        return true;
    }

}

export default Linter;
