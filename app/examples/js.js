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

export default () => [
    noVarDeclarations,
    shapeClassMustExist
];
