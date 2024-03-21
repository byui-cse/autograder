import Fs from 'fs';
import Path from 'path';
import RootPaths from '../paths.js';
import { WhatIs } from './helpers.js';

const { APPDIR } = RootPaths();

class Reporter {

    #reportTemplate;

    #icon = {
        // eslint-disable-next-line max-len
        close: '<svg class="icon" clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m21 4c0-.478-.379-1-1-1h-16c-.62 0-1 .519-1 1v16c0 .621.52 1 1 1h16c.478 0 1-.379 1-1zm-16.5.5h15v15h-15zm11.75 6.752h-8.5c-.414 0-.75.336-.75.75s.336.75.75.75h8.5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75z" fill-rule="nonzero"/></svg>',
        // eslint-disable-next-line max-len
        open: '<svg  class="icon" clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m21 3.998c0-.478-.379-1-1-1h-16c-.62 0-1 .519-1 1v16c0 .621.52 1 1 1h16c.478 0 1-.379 1-1zm-16.5.5h15v15h-15zm6.75 6.752h-3.5c-.414 0-.75.336-.75.75s.336.75.75.75h3.5v3.5c0 .414.336.75.75.75s.75-.336.75-.75v-3.5h3.5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-3.5v-3.5c0-.414-.336-.75-.75-.75s-.75.336-.75.75z" fill-rule="nonzero"/></svg>'
    };

    constructor() {
        this.#reportTemplate = Fs.readFileSync(Path.join(APPDIR, 'imports', 'template', 'report.html')).toString();
    }

    generateUniqueId() {
        return `_${Math.random().toString(36).slice(2, 11)}`;
    }

    #getErrorHtml(errors) {
        if (!errors || errors.length === 0) {
            return '';
        }

        let plural = '';
        if (errors.length > 1) {
            plural = 's';
        }
        let html = `<div class="report-title">Error${plural}</div>`;
        errors.forEach((error) => {
            html += `<div class="report error">
                <div class="rule">${error.rule}</div>
                <div class="message">${error.text}</div>
            </div>`;
        });
        return html;
    }

    #getNoticeHtml(notices) {
        if (!notices || notices.length === 0) {
            return '';
        }

        let plural = '';
        if (notices.length > 1) {
            plural = 's';
        }
        let html = `<div class="report-title">Notice${plural}</div>`;
        notices.forEach((notice) => {
            html += `<div class="report notice">
                <div class="rule">${notice.rule}</div>
                <div class="message">${notice.text}</div>
            </div>`;
        });
        return html;
    }

    #getWarningHtml(warnings) {
        if (!warnings || warnings.length === 0) {
            return '';
        }

        let plural = '';
        if (warnings.length > 1) {
            plural = 's';
        }
        let html = `<div class="report-title">Warning${plural}</div>`;
        warnings.forEach((warning) => {
            html += `<div class="report warning">
                <div class="rule">${warning.rule}</div>
                <div class="message">${warning.text}</div>
            </div>`;
        });
        return html;
    }

    /**
     * Construct the standard report object that includes error, warning, and notice arrays.
     *
     * @returns {object} Report object.
     */
    getReportsObject() {
        return {
            ext: '',
            file: '',
            name: '',
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

    makeHtmlReport(reports) {
        const template = this.#reportTemplate;

        const replacements = {
            body: '',
            files: [],
            filesPlural: false,
            totalErrors: 0,
            totalNotices: 0,
            totalWarnings: 0
        };

        if (WhatIs(reports) !== 'array') {
            return this.#makeTemplateReplacements(template, replacements);
        }

        if (reports.length > 1) {
            replacements.filesPlural = true;
        }

        let body = '';

        reports.forEach((report, index) => {
            replacements.files.push(report.file);

            const sanitizedSrc = report.src.replace(/</g, '&lt;').replace(/>/g, '&gt;');

            const uid = this.generateUniqueId();

            body += `<section>
                <h1 id="${index + 1}">${index + 1}: ${report.file}</h1>
                <div class="toggle">
                    <input type="checkbox" id="${uid}" class="toggle-checkbox" />
                    <label for="${uid}" class="title">
                        Source Code
                        <span class="open">${this.#icon.open}</span>
                        <span class="close">${this.#icon.close}</span>
                    </label>
                    <div class="content">
                        <pre><code class="${report.ext}">${sanitizedSrc}</code></pre>
                    </div>
                </div>`;

            if (report.notice.length > 0) {
                replacements.totalNotices += report.notice.length;
                body += this.#getNoticeHtml(report.notice);
            }

            if (report.warning.length > 0) {
                replacements.totalWarnings += report.warning.length;
                body += this.#getWarningHtml(report.warning);
            }

            if (report.error.length > 0) {
                replacements.totalErrors += report.error.length;
                body += this.#getErrorHtml(report.error);
            }

            body += '</section>';
        });

        replacements.body = body;

        return this.#makeTemplateReplacements(template, replacements);
    }

    #makeTemplateReplacements(template, replacements) {
        let output = template;

        let fileList = '';
        replacements.files.forEach((file, index) => {
            fileList += `<li><a href="#${index + 1}">${file}</a></li>`;
        });
        output = output.replace('{{FILES_LIST}}', fileList);

        let plural = '';
        if (replacements.filesPlural) {
            plural = 's';
        }
        output = output.replace('{{FILES_PLURAL}}', plural);

        output = output.replace('{{BODY}}', replacements.body);
        output = output.replace('{{TOTAL_NOTICES}}', replacements.totalNotices);
        output = output.replace('{{TOTAL_WARNINGS}}', replacements.totalWarnings);
        output = output.replace('{{TOTAL_ERRORS}}', replacements.totalErrors);

        return output;
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
