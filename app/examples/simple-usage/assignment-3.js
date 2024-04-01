/**
 * This is a self-contained (single file) test for a hypothetical JS assignment.
 */

import Autograder from '@byui-cse/autograder';

// Build the JS linter rules; ESLint configuration.
const jsConfig = {
    rules: {
        'no-console': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        'no-unused-vars': 'error',
        eqeqeq: 'error',
        'no-implicit-coercion': 'error',
        complexity: ['error', 2],
        'consistent-return': 'error',
        'max-depth': ['error', 2],
        'max-lines': ['error', 1],
        'max-params': ['error', 1],
        'max-statements': ['error', 10],
        'no-caller': 'error',
        'no-extend-native': 'error',
        'no-extra-bind': 'error',
        'no-floating-decimal': 'error',
        'no-implicit-globals': 'error',
        'no-implied-eval': 'error',
        'no-invalid-this': 'error',
        'no-iterator': 'error',
        'no-labels': 'error',
        'no-lone-blocks': 'error',
        'no-multi-spaces': 'error',
        'no-multi-str': 'error',
        'no-new': 'error',
        'no-new-func': 'error',
        'no-new-wrappers': 'error',
        'no-octal-escape': 'error',
        'no-proto': 'error',
        'no-return-assign': 'error',
        'no-script-url': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unused-expressions': 'error',
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        'no-useless-escape': 'error',
        'no-useless-return': 'error',
        'no-void': 'error',
        'no-warning-comments': 'error',
        'no-with': 'error',
        'prefer-promise-reject-errors': 'error',
        radix: 'error',
        'require-await': 'error',
        'vars-on-top': 'error',
        'wrap-iife': ['error', 'outside'],
        yoda: 'error'
    }
};

// Get a new instance of Autograder and register the linter settings at the same time.
const ag = new Autograder({
    linter: {
        jsConfig
    }
});

/**
 * You could also do the following instead:
 *
 * const ag = new Autograder()
 * ag.registerJsLinterConfig(jsConfig);
 */

// Create and register a JS test.
const shapeClassMustExist = (som, reportObj, reporter) => {
    const shape = som.find('class Shape');

    if (shape) {
        // Show a notice message providing encouragement for following this rule.
        const notice = reporter.makeReport(
            'Good job your file contains the required Shape class.',
            'shape-class-required'
        );
        reportObj.notice.push(notice);
        return;
    }

    // Show an error because the expected Shape class was not found.
    const error = reporter.makeReport(
        'Your code is missing the required Shape class.',
        'shape-class-required'
    );
    reportObj.error.push(error);
};
ag.registerJsTest(shapeClassMustExist);

// Process a whole directory for HTML files.
const reports = await ag.processDirRecursively('dir-to-process');

// Transform the reports (array report objects) into a HTML report. Title and Description are optional:
const html = ag.getHtmlReport(
    reports,
    'JS Assignment',
    'You can add a short or long description of what this test or assignment is for; anything can go here really.'
);

// Save the report to the users computer.
ag.saveHtmlReport(html, 'assignment-3-report.html');
