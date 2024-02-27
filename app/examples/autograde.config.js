import CSS from './css.js';
import HTML from './html.js';
import JS from './js.js';

export default (autograder) => {
    CSS().forEach((test) => {
        autograder.registerCssTest(test);
    });

    HTML().forEach((test) => {
        autograder.registerHtmlTest(test);
    });

    JS().forEach((test) => {
        autograder.registerJsTest(test);
    });
};
