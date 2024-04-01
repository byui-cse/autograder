/**
 * This is an example of combining all custom tests into a single file and
 * exporting an object of testing objects that the user will then need to
 * register individually with Autograder.registerTests()
 *
 * This is the second most compact way to provide custom tests to the Autograder.
 */

/**
 * CSS TESTS
 */

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

const mediaForPrinting = (som, reportObj, reporter) => {
    const mediaTags = som.findAll('@media+print');

    // Check all @media rules to see if at least one is for print specific rules.
    if (mediaTags.length > 0) {
        return;
    }

    // No @media rule was found for print styles so show an error.
    const error = reporter.makeReport(
        'You are missing the required print styles.',
        'media-for-printing'
    );
    reportObj.error.push(error);
};

/**
 * HTML TESTS
 */

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

const verifyHeadContainsDescription = (som, reportObj, reporter) => {
    const description = som.find('head meta[name="description"]');

    if (description) {
        // Show a notice message providing encouragement for following this rule.
        const notice = reporter.makeReport(
            'Good job your file contains a description meta tag.',
            'must-include-description-meta'
        );
        reportObj.notice.push(notice);
        return;
    }

    // Show an error message because the page does not contain a description meta tag.
    const error = reporter.makeReport(
        'Your file must contain a description meta tag.',
        'must-include-description-meta'
    );
    reportObj.error.push(error);
};

const verifyHeadContainsViewportMeta = (som, reportObj, reporter) => {
    const viewport = som.find('head meta[name="viewport"]');

    if (viewport) {
        // Show a notice message providing encouragement for following this rule.
        const notice = reporter.makeReport(
            'Good job your file contains a viewport meta tag.',
            'must-include-viewport-meta'
        );
        reportObj.notice.push(notice);
        return;
    }

    // Show an error because this page is missing the viewport meta tag.
    const error = reporter.makeReport(
        'Your file must contain a viewport meta tag.',
        'must-include-viewport-meta'
    );
    reportObj.error.push(error);
};

/**
 * JS TESTS
 */

const noVarDeclarations = (som, reportObj, reporter) => {
    const vars = som.findAll('var');

    if (vars.length === 0) {
        // Show a notice message providing encouragement for following this rule.
        const notice = reporter.makeReport(
            'Good job your file does not declare variables with var.',
            'no-var-declarations'
        );
        reportObj.notice.push(notice);
        return;
    }

    // Prepare to word the error correctly.
    let plural = ' was';
    if (vars.length > 1) {
        plural = 's were';
    }

    // Show an error because var was used at least once.
    const error = reporter.makeReport(
        // eslint-disable-next-line max-len
        `${vars.length} variable${plural} declared with var. Only let or const should be used for variable declarations.`,
        'no-var-declarations'
    );
    reportObj.error.push(error);
};

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

/**
 * EXPORT ALL TESTS AS TESTING OBJECTS
 *
 * NOTE: A "testing object" consists of a type and an array of tests. We place
 * each testing object at a key representing the language the testing object is
 * for to simplify the processes of registering the tests later.
 */

export default {
    css: {
        type: 'css',
        tests: [onlyThreeMediaTags, mediaForPrinting]
    },
    html: {
        type: 'html',
        tests: [verifyHeadExists, verifyHeadContainsDescription, verifyHeadContainsViewportMeta]
    },
    js: {
        type: 'js',
        tests: [noVarDeclarations, shapeClassMustExist]
    }
};
