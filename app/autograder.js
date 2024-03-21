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

import config from './examples/autograde.config.js';

class Autograder {

    #linter;

    #supportedFileTypes = ['css', 'html', 'js'];

    #tests = {
        css: [],
        html: [],
        js: []
    };

    constructor() {
        config(this);
        // TODO: Look for or load settings?
        this.#linter = new Linter();
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

    getHtmlReport(reports) {
        return Reporter.makeHtmlReport(reports);
    }

    async processFileByUrl(url) {
        const urlObj = new URL(url);
        const ext = Path.extname(urlObj.pathname).replace('.', '') || 'html';

        if (!this.#supportedFileTypes.includes(ext)) {
            // TODO: Return empty report object?
            return false;
        }

        const response = await this.#fetchUrl(url);
        const source = response.toString();

        // Get linter reports.
        let linterReport = Reporter.getReportsObject();

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
        combinedReport.ext = Path.extname(url).substring(1);
        combinedReport.file = url;
        combinedReport.name = Path.basename(url);
        combinedReport.src = source;

        return combinedReport;
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

    registerHtmlTest(callback) {
        if (WhatIs(callback) !== 'function') {
            return;
        }
        this.#tests.html.push(callback);
    }

    registerJsTest(callback) {
        if (WhatIs(callback) !== 'function') {
            return;
        }
        this.#tests.js.push(callback);
    }

}

export default Autograder;
