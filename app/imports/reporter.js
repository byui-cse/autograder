import Fs from 'fs';
import Path, { sep } from 'path';
import Print from './print.js';
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
            let loc = '';
            if (error.line !== 0) {
                loc += `<span>Line:</span> ${error.line}`;

                if (error.col !== 0) {
                    loc += `&nbsp;&nbsp;&nbsp;&nbsp;<span>Column:</span> ${error.col}`;
                }
            }

            html += `<div class="report error">
                <div class="rule">${error.rule}</div>
                <div class="location">${loc}</div>
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
            let loc = '';
            if (notice.line !== 0) {
                loc += `<span>Line:</span> ${notice.line}`;

                if (notice.col !== 0) {
                    loc += `&nbsp;&nbsp;&nbsp;&nbsp;<span>Column:</span> ${notice.col}`;
                }
            }

            html += `<div class="report notice">
                <div class="rule">${notice.rule}</div>
                <div class="location">${loc}</div>
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
            let loc = '';
            if (warning.line !== 0) {
                loc += `<span>Line:</span> ${warning.line}`;

                if (warning.col !== 0) {
                    loc += `&nbsp;&nbsp;&nbsp;&nbsp;<span>Column:</span> ${warning.col}`;
                }
            }

            html += `<div class="report warning">
                <div class="rule">${warning.rule}</div>
                <div class="location">${loc}</div>
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

    makeHtmlReport(reports, title = '', description = '') {
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
            return this.#makeTemplateReplacements(template, replacements, title, description);
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

        return this.#makeTemplateReplacements(template, replacements, title, description);
    }

    #makeTemplateReplacements(template, replacements, title, description) {
        let output = template;

        let titleAndDescription = '';
        if (title) {
            titleAndDescription += `<h1 id="main-title">${title}</h1>`;
        }
        if (description) {
            titleAndDescription += `<div id="main-description">${description}</div>`;
        }
        output = output.replace('{{TITLE_AND_DESCRIPTION}}', titleAndDescription);

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

    printReportToConsole(reports, title = '', description = '') {
        if (title) {
            Print.info(`\n[ ${title} ]`);
        }

        if (description) {
            Print.info(`${description}\n`);
        }

        reports.forEach((report) => {
            Print.info(`${report.ext}: ${report.file}`);
            Print.info(`${'='.repeat(report.ext.length + report.file.length + 2)}\n`);

            if (report.notice.length > 0) {
                let plural = '';
                if (report.notice.length > 1) {
                    plural = 's';
                }
                Print.notice(`Notice${plural}:\n`);

                report.notice.forEach((notice) => {
                    Print.notice(`${notice.rule} (Line: ${notice.line}, Column: ${notice.col})`);
                    Print.notice(`> ${notice.text}\n`);
                });
            }

            if (report.warning.length > 0) {
                let plural = '';
                if (report.warning.length > 1) {
                    plural = 's';
                }
                Print.warn(`Warning${plural}:\n`);

                report.warning.forEach((warning) => {
                    Print.warn(`${warning.rule} (Line: ${warning.line}, Column: ${warning.col})`);
                    Print.warn(`> ${warning.text}\n`);
                });
            }

            if (report.error.length > 0) {
                let plural = '';
                if (report.error.length > 1) {
                    plural = 's';
                }
                Print.error(`Error${plural}:\n`);

                report.error.forEach((error) => {
                    Print.error(`${error.rule} (Line: ${error.line}, Column: ${error.col})`);
                    Print.error(`> ${error.text}\n`);
                });
            }
        });
    }

}

export default new Reporter();
