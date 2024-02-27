// https://htmlhint.com/docs/user-guide/getting-started

import Linter from '../app/imports/linter.js';

// NOTE: Rules should be loaded from the assignment grading config OR default to our defaults.
const htmlRules = {
    'tag-pair': false,
    'attr-missing-value': true,
    'attr-value-double-quotes': false
};

// NOTE: Get this from the actual page
const html = `
<html>
<head>
<title>My First Webpage</title>
<meta charset="UTF-8">
<meta name="description" content="This is my first website. It includes lots of information about my life.">
</head>
<body>
<img src="">
<h1>Welcome to my webpage</h1>
<p>Welcome to <em>my</em> brand new website.</p>
<p>This site will be my <strong>new</strong> home on the web.</p>
<a href="/page2.html">Page2</a>
<img src="testpic.jpg" alt="This is a test image" height="42" width="42">
<p>This website will have the following benefits for my business:</p>
<ul>
<li>Increased traffic </li>
<li>Global Reach</li>
<li>Promotional Opportunities</li>
</ul>
<table>
<tr>
<td>Row 1 - Column 1</td>
<td>Row 1 - Column 2 </td>
</tr>
<tr>
<td>Row 2 - Column 1</td>
<td>Row 2 - Column 2</td>
</tr>
</table>
</body>
</html>`;

const css = `
/* Valid declarations */
body {
    color: #333;
    background-color: #fff;
    font-size: 16px;
}

a {
    text-decoration: none;
    color: blue;
}

/* Invalid declarations */
h1 {
    font-size: 18px;
}

.invalid-class {
    margin: 10px;
}

/* Order rule violation */
body {
    background-color: #fff;
    color: #333;
}

/* Color rule violations */
.invalid-color {
    color: red;
}

.invalid-hex-color {
    color: #1234;
}

/* Additional rule violations */
.invalid-selector::before {
    content: '';
}

/* Pseudo-class rule violation */
a:hover {
    color: red;
}

.foo {
    color: red !important; /* declaration-no-important */
  }
  
  .bar {
    background: invalid-color; /* color-no-invalid-hex */
  }
  
  @unknown-at-rule { /* at-rule-no-unknown */
    /* ... */
  }
  
  .baz {
    margin: 0;
    margin: 10px; /* declaration-block-no-duplicate-properties */
  }
  a {
    border-radius: 5px;
  }
`;

const js = `

let message = 'Hello World';
message = 'Hi'; // no-const-assign

function greet(name) {
  const greeting = \`Hello \${name}\`;
  
  console.log(greting); // no-undef
  
  if (name == 'John') { // eqeqeq
    return greeting; 
  }
}

greet('John');
`;

const protest = `
/* eslint-disable max-classes-per-file */

// Shape class
class Shape {

    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    area() {
        return this.width * this.height;
    }

}

// Circle class
class Circle extends Shape {

    constructor(radius) {
        super(radius, radius);
        this.radius = radius;
    }

    area() {
        return Math.PI * (this.radius ** 2);
    }

}

// Rectangle class
class Rectangle extends Shape {

    // eslint-disable-next-line no-useless-constructor
    constructor(width, height) {
        super(width, height);
    }

}

// Main code
const shapes = [];

const c = new Circle(5);
shapes.push(c);

const r = new Rectangle(3, 4);
shapes.push(r);

for (const s of shapes) {
    console.log(s.area());
}

// eslint-disable-next-line no-var, no-unused-vars, vars-on-top
var oldVariableDeclaration = 'Alice';
`;

const linter = new Linter();

// console.log('\n==========[ CSS REPORT ]==========\n');
// const reportCss = await linter.lintCSS(css);
// console.log(reportCss);

// console.log('\n==========[ HTML REPORT ]==========\n');
// const reportHtml = await linter.lintHTML(html);
// console.log(reportHtml);

console.log('\n==========[ JS REPORT ]==========\n');
// const reportJs = await linter.lintJS(js);
const reportJs = await linter.lintJS(protest);
console.log(reportJs);
