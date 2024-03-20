import Combined from './combined.js';

export default (autograder) => {
    autograder.registerTests(Combined.CSS);
    autograder.registerTests(Combined.HTML);
    autograder.registerTests(Combined.JS);
};
