/**
 * This is a self-contained (single file) test for a hypothetical HTML assignment.
 */

import Autograder from '@byui-cse/autograder';

// Build the HTML linter rules; HTMLHint configuration.
const htmlConfig = {
    rules: {
        'tagname-lowercase': true,
        'attr-lowercase': true,
        'attr-value-double-quotes': true,
        'doctype-first': true,
        'tag-pair': true,
        'spec-char-escape': true,
        'id-unique': true,
        'src-not-empty': true,
        'attr-no-duplication': true,
        'title-require': true,
        'alt-require': true,
        'doctype-html5': true,
        'id-class-value': 'dash',
        'style-disabled': true,
        'inline-style-disabled': true,
        'inline-script-disabled': true,
        'space-tab-mixed-disabled': 'space',
        'id-class-ad-disabled': true,
        'href-abs-or-rel': 'abs',
        'attr-unsafe-chars': true,
        'head-script-disabled': true
    }
};

// Get a new instance of Autograder and register the linter settings at the same time.
const ag = new Autograder({
    linter: {
        htmlConfig
    }
});

/**
 * You could also do the following instead:
 *
 * const ag = new Autograder()
 * ag.registerHtmlLinterConfig(htmlConfig);
 */

// Create and register a HTML test.
const verifyHeadExists = (som, reportObj, reporter) => {
    const head = som.find('head');

    if (head) {
        // We want to show how many lines the head tag takes up so build that first.
        let { line } = head.value.loc.start;
        if (head.value.loc.end.line !== line) {
            line = `${line}-${head.value.loc.end.line}`;
        }

        let { col } = head.value.loc.start;
        if (head.value.loc.end.col !== col) {
            col = `${col}-${head.value.loc.end.col}`;
        }

        // Show a notice message providing encouragement for following this rule.
        const notice = reporter.makeReport(
            'Good job your file includes a head tag.',
            'must-include-head-tag',
            line,
            col
        );
        reportObj.notice.push(notice);
        return;
    }

    // Show an error messages because the page is missing a head tag.
    const error = reporter.makeReport(
        'Your file must contain a head tag.',
        'must-include-head-tag'
    );
    reportObj.error.push(error);
};
ag.registerHtmlTest(verifyHeadExists);

// Process a whole directory for HTML files.
const reports = await ag.processDirRecursively('dir-to-process');

// Transform the reports (array report objects) into a HTML report. Title and Description are optional:
const html = ag.getHtmlReport(
    reports,
    'HTML Assignment',
    'You can add a short or long description of what this test or assignment is for; anything can go here really.'
);

// Save the report to the users computer.
ag.saveHtmlReport(html, 'assignment-2-report.html');
