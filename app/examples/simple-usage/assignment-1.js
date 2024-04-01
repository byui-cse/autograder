/**
 * This is a self-contained (single file) test for a hypothetical CSS assignment.
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

// Get a new instance of Autograder and register the linter settings at the same time.
const ag = new Autograder({
    linter: {
        cssConfig
    }
});

/**
 * You could also do the following instead:
 *
 * const ag = new Autograder()
 * ag.registerCssLinterConfig(cssConfig);
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

// Process a whole directory for CSS files.
const reports = await ag.processDirRecursively('dir-to-process');

// Transform the reports (array report objects) into a HTML report. Title and Description are optional:
const html = ag.getHtmlReport(
    reports,
    'CSS Assignment',
    'You can add a short or long description of what this test or assignment is for; anything can go here really.'
);

// Save the report to the users computer.
ag.saveHtmlReport(html, 'assignment-1-report.html');
