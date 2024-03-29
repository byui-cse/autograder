/**
 * A file dedicated to only CSS tests.
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
 * EXPORT THE CSS TESTING OBJECT
 */

export default {
    type: 'css',
    tests: [onlyThreeMediaTags, mediaForPrinting]
};
