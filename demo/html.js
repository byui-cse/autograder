import HtmlTreeHelper from '../app/imports/html/html-tree-helper.js';

const demo = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <p id="the-chosen-one">Para one</p>
    <p class="test">
        Para two
        <a href="#noda" data-test="testing-data">Test Link</a>
    </p>
    <p class="text-test">
        This is just some text.
    </p>
</body>
</html>
`;

const hsom = HtmlTreeHelper.parse(demo);
console.log(hsom.getStructure().som.get('html lang="en" N<2>'));
// console.log(hsom.find('p.text-test'));
// hsom.findAll('p').forEach((node) => {
//     console.log(node);
// });
