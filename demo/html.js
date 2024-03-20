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
    <p class="test">
        This is just some text.
    </p>
</body>
</html>
`;

const hsom = HtmlTreeHelper.parse(demo);
// console.log(hsom.getStructure());
console.log(hsom.findAll('p.test'));
// hsom.findAll('p').forEach((node) => {
//     // console.log(hsom.getValue(result, hsom.src));
//     console.log(node);
// });

// function trav(map) {
//     map.forEach((value, key, map) => {
//         if (value?.node?.loc) {
//             console.log(value.node.loc);
//         }
//         if (value.children) {
//             trav(value.children);
//         }
//     });
// }
// trav(hsom.getStructure().som);
// {
//     attrsMap: Map(1) {
//         [Key] => [Value]
//     },
//     children: Map(1) {
//       [Key] => [Node]
//     },
//     node: {
//       nodeName: 'p',
//       tagName: 'p',
//       attrs: [ [Object] ], // The original attrs object used to make attrsMap
//       namespaceURI: 'http://www.w3.org/1999/xhtml',
//       childNodes: [ [Object], [Object], [Object] ], // Original child object used to make children
//       parentNode: {
//         [Node]
//       },
//       loc: [Loc Object]
//     }
// }
