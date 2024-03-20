/**
 * CSS TESTS
 */

const onlyThreeMediaTags = (som, reportObj, reporter) => {
    const mediaTags = som.findAll('@media');

    if (mediaTags.length > 0 && mediaTags.length <= 3) {
        // Don't report anything not even a notice.
        return;
    }

    let plural = '';
    if (mediaTags.length > 1) {
        plural = 's';
    }

    const warning = reporter.makeReport(
        // eslint-disable-next-line max-len
        `Your file contained ${mediaTags.length} media rule${plural}. You were supposed to consolidate them into 3 rules max.`,
        'only-three-media-tags.'
    );

    reportObj.warning.push(warning);
};

const mediaForPrinting = (som, reportObj, reporter) => {
    const mediaTags = som.findAll('@media');

    for (let i = 0; i < mediaTags.length; i++) {
        const node = mediaTags[i];
        if (node.key.includes('print')) {
            return;
        }
    }

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
        let { line } = head.value.loc.start;
        if (head.value.loc.end.line !== line) {
            line = `${line}-${head.value.loc.end.line}`;
        }

        let { col } = head.value.loc.start;
        if (head.value.loc.end.col !== col) {
            col = `${col}-${head.value.loc.end.col}`;
        }

        const notice = reporter.makeReport(
            'Good job your file includes a head tag.',
            'must-include-head-tag',
            line,
            col
        );

        reportObj.notice.push(notice);
        return;
    }

    const error = reporter.makeReport(
        'Your file must contain a head tag.',
        'must-include-head-tag'
    );

    reportObj.error.push(error);
};

const verifyHeadContainsDescription = (som, reportObj, reporter) => {
    const description = som.find('head meta[name="description"]');

    if (description) {
        const notice = reporter.makeReport(
            'Good job your file contains a description meta tag.',
            'must-include-description-meta'
        );

        reportObj.notice.push(notice);
        return;
    }

    const error = reporter.makeReport(
        'Your file must contain a description meta tag.',
        'must-include-description-meta'
    );

    reportObj.error.push(error);
};

const verifyHeadContainsViewportMeta = (som, reportObj, reporter) => {
    const viewport = som.find('head meta[name="viewport"]');

    if (viewport) {
        const notice = reporter.makeReport(
            'Good job your file contains a viewport meta tag.',
            'must-include-viewport-meta'
        );

        reportObj.notice.push(notice);
        return;
    }

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
        const notice = reporter.makeReport(
            'Good job your file does not declare variables with var.',
            'no-var-declarations'
        );

        reportObj.notice.push(notice);
        return;
    }

    let plural = ' was';
    if (vars.length > 1) {
        plural = 's were';
    }

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
        const notice = reporter.makeReport(
            'Good job your file contains the required Shape class.',
            'shape-class-required'
        );

        reportObj.notice.push(notice);
        return;
    }

    const error = reporter.makeReport(
        'Your code is missing the required Shape class.',
        'shape-class-required'
    );

    reportObj.error.push(error);
};

/**
 * EXPORT ALL TESTS AS TESTING OBJECTS
 */

export default {
    CSS: {
        type: 'css',
        tests: [onlyThreeMediaTags, mediaForPrinting]
    },
    HTML: {
        type: 'html',
        tests: [verifyHeadExists, verifyHeadContainsDescription, verifyHeadContainsViewportMeta]
    },
    JS: {
        type: 'js',
        tests: [noVarDeclarations, shapeClassMustExist]
    }
};
