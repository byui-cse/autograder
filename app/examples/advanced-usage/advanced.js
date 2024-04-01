/**
 * This is an advanced example of Autograder where configuration files and tests
 * are stored in their own files. We can register the tests we need and we can
 * test different assignments or projects based on user input.
 */
import Autograder from '@byui-cse/autograder';
import CssLinterConfig from './linters/css-lint.js';
import CssTests from './tests/css.js';
import HtmlLinterConfig from './linters/html-linter.js';
import HtmlTests from './tests/html.js';
import JsLinterConfig from './linters/js-linter.js';
import JsTests from './tests/js.js';

// Get a new instance of the Autograder.
const ag = new Autograder();

// In this example we assume AG is being run from the command line so get any flags or options.
const args = process.argv.slice(2);

// Based on how AG was called register the appropriate tests:
switch (args[0]) {
    case 'assignment-1':
        ag.registerCssLinterConfig(CssLinterConfig);
        ag.registerTests(CssTests);
        break;
    case 'assignment-2':
        ag.registerHtmlLinterConfig(HtmlLinterConfig);
        ag.registerTests(HtmlTests);
        break;
    case 'assignment-3':
        ag.registerJsLinterConfig(JsLinterConfig);
        ag.registerTests(JsTests);
        break;
    case 'project-1':
        ag.registerCssLinterConfig(CssLinterConfig);
        ag.registerHtmlLinterConfig(HtmlLinterConfig);
        ag.registerJsLinterConfig(JsLinterConfig);
        ag.registerTests(CssTests);
        ag.registerTests(HtmlTests);
        ag.registerTests(JsTests);
        break;
}

// Process a whole directory for against any registered linters and tests:
const reports = await ag.processDirRecursively('dir-to-process');

/**
 * Transform the reports (array report objects) into a HTML report. Title and
 * Description are optional:
 */
const html = ag.getHtmlReport(
    reports,
    'Advanced Example',
    'You can add a short or long description of what this test or assignment is for.'
);

// Save the report to the users computer.
ag.saveHtmlReport(html, 'advanced.html');
