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

    const error = reporter.makeReport(
        // eslint-disable-next-line max-len
        `Your file contained ${mediaTags.length} media rule${plural}. You were supposed to consolidate them into 3 rules max.`,
        'only-three-media-tags.'
    );

    reportObj.error.push(error);
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

export default () => [
    onlyThreeMediaTags,
    mediaForPrinting
];
