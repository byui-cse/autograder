# Autograder

Autograder (AG) is a automated code review tool for programming assignments and projects. Combining linters with user supplied tests, you can analyze any supported file type and provide tailored feedback about the code.

**Supported file types**: CSS, HTML, and JS.

## Installation and Usage

**Installation**

Autograder is an [NPM package](https://www.npmjs.com/package/@byui-cse/autograder) that must be installed on the device that will run the tests. Your intended use case for AG will determine where to install it:

- Locally on the students device if you provide students with the tests to check their work before submission.
- Locally on the instructors device if students submissions are being checked against the tests after submission.
- Remotely on a server that allows students/instructors to upload or fetch files for testing.

Choosing a remote setup can be beneficial for its flexibility. It enables you to keep test files inaccessible to students, yet allows them to verify their work before final submission. Furthermore, you can configure the remote server to collect and automatically grade final submissions. Keep in mind, though, that while the automated grading (AG) system facilitates the assessment of assignments, you'll need to establish the necessary services and user interfaces for this remote system.

```js
// Installing directly into an assignment/project:
npm install @byui-cse/autograder

// Installing globally on the device/server:
npm install -g @byui-cse/autograder
```

**Usage**

No matter how you choose to implement AG, the usage remains roughly the same. Instructors create test (auto graders) for every assignment or project they wish to test. These tests can be as simple individual files for specific assignments or advanced with a primary entry point (entry file) that loads additional tests based on user input.

Here is the outline for a basic test contained in a single file:

```js
import Autograder from '@byui-cse/autograder';

/**
 * AG INSTANCE + LINTER RULES
 * 
 * Here we get a new instance of the AG and register linter configurations and rules for CSS, HTML,
 * and JS; we do not have to register all three, we can add only the ones we want.
 */
const ag = new Autograder({
    linter: {
        cssConfig: { ... },
        htmlConfig: { ... },
        jsConfig: { ... }
    }
});

/**
 * REGISTER TESTS
 * 
 * Custom tests can be registered individually based on the language they are written for:
 */
ag.registerCssTest(callbackFunction);
ag.registerHtmlTest(callbackFunction);
ag.registerJsTest(callbackFunction);
/**
 * or tests can be mass registered at once using a properly formed testing object:
 *
 * const htmlTests = {
 *     type: 'html',
 *     tests: [testCallbackFunctionName1, testCallbackFunctionName2, testCallbackFunctionName3]
 * };
 * 
 * NOTE: Type must be a supported language or no tests will be registered.
 */
ag.registerTests(testingObject);

/**
 * LINTER RULES ALTERNATIVE IMPLEMENTATION
 * 
 * We could also register linter rules later with the registration functions; again do not have to
 * register all three, we only have to call and register what we want.
 */
ag.registerCssLinterConfig({...}); 
ag.registerHtmlLinterConfig({...}); 
ag.registerJsLinterConfig({...});

/**
 * RUN TESTS
 * 
 * How you actually run a test will depend on your use case. You can use any combination of the
 * following examples as long a you bundle the reports (results) together; you can technically
 * keep reports separate if you wanted to or have an advance use case.
 */
const report = await ag.processFile(absoluteFilePath);
// or:
const report = await ag.processFileByUrl(url);
// or:
const report = await ag.processDirRecursively(directory[, extensions]);
// or merge various tests:
const report = await ag.processFile(absoluteFilePath);
report.push(...await ag.processFile(absoluteFilePath));
report.push(...await ag.processFileByUrl(url));
report.push(...await ag.processFileByUrl(url));
report.push(...await ag.processDirRecursively(directory[, extensions]));

/**
 * TEST RESULTS
 *
 * You have several options for getting and viewing test results which will also depend on your
 * specific use case. In addition to the following examples, you could choose to do something on
 * your own with the `report` objects that were returned to you.
 */
ag.printReportToConsole(reports[, title, description]);
// or get the HTML report and do what you want with the HTML string (file):
const htmlReport = ag.getHtmlReport(reports[, title, description]);
// or get the HTML report and have AG automatically save it somewhere for you:
ag.saveHtmlReport(htmlReport, destination);
```

AG is designed to be extremely flexible in how instructors can implement tests. The example below is an outline for a simple test but more advanced examples are provided in the [examples directory](./app/examples/).

```js
// A CSS file is being demoed in this example:
const nameOfTest = (som, reportObj, reporter) => {
    /**
     * som
     * 
     * This is the Structured Object Model (SOM) for the language this test was registered for. All
     * SOMs have a `find` and `findAll` method that are querySelector like. This allows you to "search"
     * the source code for any language like you would search the DOM in a web page.
     */

    // Here we search the source code for all `@media` rules that also specify they are for `print` styles.
    const mediaTags = som.findAll('@media+print');

    /**
     * reporter
     * 
     * The reporter parameter exposes AGs Reporter class to your test function. Use this to make reports
     * by calling the `makeReport` method.
     * 
     * NOTE: This example does not demo the additional arguments `row` and `col` which allows you to
     * highlight the lines of code being referenced in the report. You can obtain this location data
     * from the node objects returned by your search.
     */

     /**
     * reportObj
     * 
     * The reportObj parameter exposes AGs reports object to your test function. Use this to record
     * (register) your reports. You should push the report to the appropriate array:
     * 
     * reportObj.notice  <-- Any message you wish to share to the student.
     * reportObj.warning <-- A warning to share with the student, may or may not be counted against them.
     * reportObj.error   <-- An error to share with the student, this normally counts against them.
     */ 

    if (mediaTags.length > 0) {
        // Use `makeReport` to commend the student for following instructions; you could also return and not log a message.
        const notice = reporter.makeReport(
            'Good job your file contains a print styles.', // The message to show in the report.
            'must-include-print-styles' // Rule name; this can be made up or part of a system your institution develops.
        );
        reportObj.notice.push(notice);
        return;
    }

    // Use `makeReport` to show an error because this page is missing print styles the assignment called for.
    const error = reporter.makeReport(
        'Your file must include print styles! Add at least one `@media print` rule to your code.',
        'must-include-print-styles'
    );
    reportObj.error.push(error);
};
```

Depending on your use case you would then have students manually run these tests or you could provide some mechanism for tests to be automated. One possible solution is to setup various tests in a `package.json` file and instruct students to run the appropriate command for their assignment(s), such as: `npm run grade:project-1` You could also provide a grading folder of tests and instruct students to run them with `npx`.

Please review [all the examples](./app/examples/) for further help and ideas.

## Methods

All public methods of the Autograder are meant for you to use. Which methods you use will depend heavily on your particular use case but AG has been designed to be as flexible as possible so there may be methods worth ignoring in favor of others:

