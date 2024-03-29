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

    saveHtmlReport(html, destination) {
        if (WhatIs(html) !== 'string') {
            return false;
        }

        // Extract the directory path from the destination
        const dirPath = Path.dirname(destination);

        // Create the directory if it doesn't exist
        Fs.mkdirSync(dirPath, { recursive: true });

        // Write the HTML content to the destination file
        Fs.writeFileSync(destination, html, 'utf8');
        return true;
    }

    getHtmlReport(reports, title = '', description = '') {
        return Reporter.makeHtmlReport(reports, title, description);
    }

    printReportToConsole(reports, title = '', description = '') {
        Reporter.printReportToConsole(reports, title, description);
    }

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

    registerCssTest(callback) {
        if (WhatIs(callback) !== 'function') {
            return;
        }
        this.#tests.css.push(callback);
    }

    registerCssLinterRules(obj = {}) {
        this.#linter.registerCssRules(obj);
    }

    registerHtmlTest(callback) {
        if (WhatIs(callback) !== 'function') {
            return;
        }
        this.#tests.html.push(callback);
    }

    registerHtmlLinterRules(obj = {}) {
        this.#linter.registerHtmlRules(obj);
    }

    registerJsTest(callback) {
        if (WhatIs(callback) !== 'function') {
            return;
        }
        this.#tests.js.push(callback);
    }

    registerJsLinterRules(obj = {}) {
        this.#linter.registerJsRules(obj);
    }

}

export default Autograder;
