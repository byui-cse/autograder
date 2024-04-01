import Fs from 'fs';
import Path from 'path';
import http from 'http';
import https from 'https';
import { URL } from 'url';

import CssTreeHelper from './imports/css/css-tree-helper.js';
import HtmlTreeHelper from './imports/html/html-tree-helper.js';
import JsTreeHelper from './imports/js/js-tree-helper.js';
import Linter from './imports/linter.js';
import Reporter from './imports/reporter.js';
import { WhatIs } from './imports/helpers.js';

class Autograder {

    #linter;

    #options = {};

    #supportedFileTypes = ['css', 'html', 'js'];

    #tests = {
        css: [],
        html: [],
        js: []
    };

    constructor(options = {}) {
        if (!('disableLinting' in options)) {
            // eslint-disable-next-line no-param-reassign
            options.disableLinting = false;
        }

        if (!('useDefaultLintRules' in options)) {
            // eslint-disable-next-line no-param-reassign
            options.useDefaultLintRules = false;
        }

        this.#linter = new Linter(options?.linter, options.useDefaultLintRules);

        this.#options = options;
    }

    /**
     * @private
     * Fetch the requested file from the internet.
     *
     * @param {string} url The url to fetch and process.
     * @param {object} options A request objects to use the the client.request call.
     * @returns A promise that will resolve to the source code of the file at url or an error object.
     */
    async #fetchUrl(url, options = {}) {
        // Normalize URL and handle both HTTP and HTTPS
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol.slice(0, -1).toLowerCase(); // Remove trailing ":"
        const client = protocol === 'https' ? https : http;
        // console.log(client);

        // Merge default options with user-provided options
        const defaultOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (protocol === 'https' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Cache-Tag': 'original-source',
                'Surrogate-Control': 'no-store',
                'X-Original-Source': 'true',
                'cdn-original-source': 'true',
                Expires: '0',
                Pragma: 'no-cache'
            }
        };

        // Merge the users request options with our default and required options.
        const mergedOptions = { ...defaultOptions, ...options };

        // Make the request and return a promise
        return new Promise((resolve, reject) => {
            const req = client.request(mergedOptions, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const data = Buffer.concat(chunks);
                    resolve(data); // Resolve the promise with the data
                });
            });

            req.on('error', (error) => {
                reject(error); // Reject the promise with the error
            });

            req.end();
        });
    }

    /**
     * Transform report objects into a single HTML report.
     *
     * @param {array} reports An array of report objects.
     * @param {string} title Optional title for the HTML reports.
     * @param {string} description Optional description for the HTML reports.
     * @returns The source code for the HTML report.
     */
    getHtmlReport(reports, title = '', description = '') {
        return Reporter.makeHtmlReport(reports, title, description);
    }

    /**
     * Transform report objects into colorful console statements.
     *
     * @param {array} reports An array of report objects.
     * @param {string} title Optional title for the HTML reports.
     * @param {string} description Optional description for the HTML reports.
     */
    printReportToConsole(reports, title = '', description = '') {
        Reporter.printReportToConsole(reports, title, description);
    }

    /**
     * Search a directory recursively and process all supported file types.
     *
     * @param {string} dir The absolute or relative path to a directory on the device/server to process.
     * @param {array} extensions An array of file types to process; will be limited to our builtin support files.
     * @returns {array} An array of report options.
     */
    async processDirRecursively(dir, extensions = this.#supportedFileTypes) {
        // Clean the user supplied file extensions.
        const safeExtensions = [];
        extensions.forEach((ext) => {
            // eslint-disable-next-line no-param-reassign
            ext = ext.toLowerCase();
            if (this.#supportedFileTypes.includes(ext)) {
                safeExtensions.push(ext);
            }
        });

        // Make sure the user provided at least one supported file extension.
        if (safeExtensions.length < 1) {
            const errorReport = Reporter.getReportsObject();
            // eslint-disable-next-line max-len
            errorReport.notice.push(Reporter.makeReport('No valid file extension(s) provided.', 'no-extensions'));
            return errorReport;
        }

        const reports = [];

        const processDirectory = async (currentDir) => {
            const entries = Fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = Path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    // Recursively process the directory synchronously
                    // eslint-disable-next-line no-await-in-loop
                    await processDirectory(fullPath);
                } else {
                    const fileExtension = Path.extname(entry.name).slice(1);
                    if (safeExtensions.includes(fileExtension)) {
                        // eslint-disable-next-line no-await-in-loop
                        reports.push(await this.processFile(fullPath));
                    }
                }
            }
        };

        await processDirectory(dir);
        return reports;
    }

    /**
     * @private
     * Run the appropriate linter and tests on the provided files source code.
     *
     * @param {string} ext The type (extension) of file being processed.
     * @param {string} file The filepath or url of the file being processed.
     * @param {string} source The source code of the file being processed.
     * @returns {object} A report object for this file.
     */
    async #processFile(ext, file, source) {
        // Get linter reports.
        let linterReport = Reporter.getReportsObject();

        if (!this.#options.disableLinting) {
            switch (ext) {
                case 'css':
                    linterReport = await this.#linter.lintCSS(source);
                    break;
                case 'html':
                    linterReport = await this.#linter.lintHTML(source);
                    break;
                case 'js':
                    linterReport = await this.#linter.lintJS(source);
                    break;
            }
        }

        // Get code reports.
        const codeReport = Reporter.getReportsObject();
        let som = {};

        switch (ext) {
            case 'css':
                som = CssTreeHelper.parse(source);
                this.#tests.css.forEach((callback) => {
                    callback(som, codeReport, Reporter);
                });
                break;
            case 'html':
                som = HtmlTreeHelper.parse(source);
                this.#tests.html.forEach((callback) => {
                    callback(som, codeReport, Reporter);
                });
                break;
            case 'js':
                som = JsTreeHelper.parse(source);
                this.#tests.js.forEach((callback) => {
                    callback(som, codeReport, Reporter);
                });
                break;
        }

        const combinedReport = Reporter.getReportsObject();
        combinedReport.error = [...linterReport.error, ...codeReport.error];
        combinedReport.notice = [...linterReport.notice, ...codeReport.notice];
        combinedReport.warning = [...linterReport.warning, ...codeReport.warning];
        combinedReport.ext = Path.extname(file).substring(1);
        combinedReport.file = file;
        combinedReport.name = Path.basename(file);
        combinedReport.src = source;

        return combinedReport;
    }

    /**
     * Run the appropriate linter and tests on the provided file.
     *
     * @param {string} absolutePath The absolute path to a file to process.
     * @returns {object} A report object for this file.
     */
    async processFile(absolutePath) {
        const ext = Path.extname(absolutePath).replace('.', '');
        const errorReport = Reporter.getReportsObject();

        if (!this.#supportedFileTypes.includes(ext)) {
            // eslint-disable-next-line max-len
            errorReport.notice.push(Reporter.makeReport(`Unsupported file type, no tests run: ${ext}`, 'unsupported-file-type'));
            return errorReport;
        }

        if (!Fs.existsSync(absolutePath)) {
            // eslint-disable-next-line max-len
            errorReport.notice.push(Reporter.makeReport('File not found.', 'file-not-found'));
            return errorReport;
        }

        let response;

        try {
            response = Fs.readFileSync(absolutePath);
        } catch (error) {
            // eslint-disable-next-line max-len
            errorReport.notice.push(Reporter.makeReport(`Error: ${error}`, 'processing-error'));
            return errorReport;
        }
        const source = response.toString();
        const report = await this.#processFile(ext, absolutePath, source);
        return report;
    }

    /**
     * Run the appropriate linter and tests on the provided url.
     *
     * @param {string} url The complete URL to a file to be processed.
     * @returns {object} A report object for this file.
     */
    async processFileByUrl(url) {
        const urlObj = new URL(url);
        const ext = Path.extname(urlObj.pathname).replace('.', '') || 'html';
        const errorReport = Reporter.getReportsObject();

        if (!this.#supportedFileTypes.includes(ext)) {
            // eslint-disable-next-line max-len
            errorReport.notice.push(Reporter.makeReport(`Unsupported file type, no tests run: ${ext}`, 'unsupported-file-type'));
            return errorReport;
        }

        let response;

        try {
            response = await this.#fetchUrl(url);
        } catch (error) {
            // eslint-disable-next-line max-len
            errorReport.notice.push(Reporter.makeReport(`Error: ${error}`, 'processing-error'));
            return errorReport;
        }
        const source = response.toString();
        const report = await this.#processFile(ext, url, source);
        return report;
    }

    /**
     * Register a CSS test with the Autograder.
     *
     * @param {Function} callback The callback function for this test.
     */
    registerCssTest(callback) {
        if (WhatIs(callback) !== 'function') {
            return;
        }
        this.#tests.css.push(callback);
    }

    /**
     * Register configurations and rules for the CSS linter.
     *
     * @param {Object} obj The CSS linting configuration object; stylelint.
     */
    registerCssLinterConfig(obj = {}) {
        this.#linter.registerCssConfig(obj);
    }

    /**
     * Register a HTML test with the Autograder.
     *
     * @param {Function} callback The callback function for this test.
     */
    registerHtmlTest(callback) {
        if (WhatIs(callback) !== 'function') {
            return;
        }
        this.#tests.html.push(callback);
    }

    /**
     * Register configurations and rules for the HTML linter.
     *
     * @param {Object} obj The HTML linting configuration object; HTMLHint.
     */
    registerHtmlLinterConfig(obj = {}) {
        this.#linter.registerHtmlConfig(obj);
    }

    /**
     * Register a JS test with the Autograder.
     *
     * @param {Function} callback The callback function for this test.
     */
    registerJsTest(callback) {
        if (WhatIs(callback) !== 'function') {
            return;
        }
        this.#tests.js.push(callback);
    }

    /**
     * Register configurations and rules for the JS linter.
     *
     * @param {Object} obj The JS linting configuration object; ESLint.
     */
    registerJsLinterConfig(obj = {}) {
        this.#linter.registerJsConfig(obj);
    }

    /**
     * Mass register various tests using testing objects that following this format:
     *
     * {
     *     type: 'html',
     *     tests: [testCallbackFunctionName1, testCallbackFunctionName2, testCallbackFunctionName3]
     * };
     *
     * @param {object} testObj An AG testing object that registers multiple texts by language type.
     * @returns
     */
    registerTests(testObj) {
        if (WhatIs(testObj) !== 'object') {
            return;
        }

        if (!testObj.type || !testObj.tests) {
            return;
        }

        if (WhatIs(testObj.tests) !== 'array') {
            return;
        }

        switch (testObj.type.trim().toUpperCase()) {
            case 'CSS':
                testObj.tests.forEach((test) => {
                    this.registerCssTest(test);
                });
                break;
            case 'HTML':
                testObj.tests.forEach((test) => {
                    this.registerHtmlTest(test);
                });
                break;
            case 'JS':
                testObj.tests.forEach((test) => {
                    this.registerJsTest(test);
                });
                break;
        }
    }

    /**
     * Save a file (source code) to a designated destination on the device/server.
     *
     * @param {string} htmlReport Save the HTML report (or any other string) to the provided destination.
     * @param {string} destination The absolute path to the destination (filename included) to save this data to.
     * @returns {boolean} True if everything appears to be good, false if not.
     */
    saveHtmlReport(htmlReport, destination) {
        if (WhatIs(htmlReport) !== 'string') {
            return false;
        }

        // Extract the directory path from the destination
        const dirPath = Path.dirname(destination);

        // Create the directory if it doesn't exist
        Fs.mkdirSync(dirPath, { recursive: true });

        // Write the HTML content to the destination file
        Fs.writeFileSync(destination, htmlReport, 'utf8');
        return true;
    }

}

export default Autograder;
