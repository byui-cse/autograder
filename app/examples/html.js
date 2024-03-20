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

export default () => [
    verifyHeadExists,
    verifyHeadContainsDescription,
    verifyHeadContainsViewportMeta
];
