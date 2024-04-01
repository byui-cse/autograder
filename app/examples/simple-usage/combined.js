/**
 * This is a self-contained (single file) test for a hypothetical project where
 * we want to check the students CSS, HTML, and JS files all at once.
 */

import Autograder from '@byui-cse/autograder';

// Build the CSS linter rules; stylelint configuration.
const cssConfig = {
    rules: {
        'color-hex-alpha': true,
        'property-no-unknown': true,
        'block-no-empty': true,
        'selector-pseudo-element-no-unknown': true,
        'selector-pseudo-class-no-unknown': true,
        'selector-type-no-unknown': true,
        'declaration-block-no-duplicate-properties': true,
        'declaration-block-no-shorthand-property-overrides': true,
        'max-nesting-depth': 1,
        'no-duplicate-selectors': true,
        'font-family-name-quotes': 'always-where-recommended',
        'font-weight-notation': 'numeric',
        'selector-pseudo-element-colon-notation': 'double',
        'rule-empty-line-before': 'always-multi-line',
        'value-keyword-case': 'lower',
        'no-empty-source': true
    }
};

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
        cssConfig,
        htmlConfig,
        jsConfig
    }
});

/**
 * You could also do the following instead:
 *
 * const ag = new Autograder()
 * ag.registerCssLinterConfig(cssConfig);
 * ag.registerHtmlLinterConfig(htmlConfig);
 * ag.registerJsLinterConfig(jsConfig);
 */

// Create and register a CSS test.
const onlyThreeMediaTags = (som, reportObj, reporter) => {
    const mediaTags = som.findAll('@media');

    // If there are 0-3 @media rules do not show any messages.
    if (mediaTags.length >= 0 && mediaTags.length <= 3) {
        return;
    }

    // There was more than 3 @media rules so show a warning; could also show an error instead.
    const warning = reporter.makeReport(
        // eslint-disable-next-line max-len
        `Your file contained ${mediaTags.length} media rules. You were supposed to consolidate them into 3 rules max.`,
        'only-three-media-tags.'
    );
    reportObj.warning.push(warning);
};
ag.registerCssTest(onlyThreeMediaTags);

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

// Process a whole directory for CSS, HTML, and JS files.
const reports = await ag.processDirRecursively('dir-to-process');

/**
 * Transform the reports (array report objects) into a HTML report. Title and
 * Description are optional:
 */
const html = ag.getHtmlReport(
    reports,
    'Combined Assignment',
    'You can add a short or long description of what this test or assignment is for; anything can go here really.'
);

// Save the report to the users computer.
ag.saveHtmlReport(html, 'combined.html');
