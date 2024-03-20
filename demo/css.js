import CssTreeHelper from '../app/imports/css/css-tree-helper.js';

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

  /*keyframe animations*/
  @keyframes slideIn {
    from {
      transform: translateX(-100%);
    }
  
    to {
      transform: translateX(0);
    }
  }
  
  /*gradient background*/  
  body {
    background: linear-gradient(to right, #f6d365, #fda085);
  }
  
  /*transitions on hover*/
  a {
    transition: color 0.3s ease-out;
  }
  
  a:hover {
    color: #f9844a;
  }
  
  /*box shadows*/
  div {
    box-shadow: 0 2px 2px rgba(0,0,0,0.2);
  }
  
  /*nested flexbox*/
  header {
    display: flex; 
    align-items: center;
  }
  
  nav {
    flex: 1;
    display: flex;
    justify-content: space-between; 
  }
  
  /*animations*/
@keyframes notificationAnimation {
    0% {
        transform: none;
    }

    50% {
        transform: rotate(10deg);
    }

    100% {
        transform: none;
    }
}
  
  .notification {
    animation: notificationAnimation 2s ease-in-out;
  }
  
  /*media queries*/  
  @media only print and (max-width: 600px) {
    nav {
      flex-direction: column;
    }

    div {
        list-style: none;
    }
    
    header {
      padding: 10px;
    }
  }

  @media (min-width: 30em) and (max-width: 50em) {
    div {
        list-style: none;
    }
  }
  
  /*child selector*/
  ul > li {
    list-style: none;
  }
`;

/*
#div.test ~ .demo > a {
    width: 100%;
    height: 10px;
    font-size: calc(var(--variable-width) + 20px);
    text-align: center;
}
@media screen and (min-width: 480px) {
    html,
    body {
        background-color: lightgreen;
    }
}
@media (max-width: 600px) and (orientation: landscape) {
    width: 100%;
    height: 10px;
}
@media (min-width: 700px), handheld and (orientation: landscape) {
    div {
        font-size: calc(var(--variable-width) + 20px);
        text-align: center;
    }
}
@media (min-width: 768px) {
    @media (max-height: 500px) {
        div {
            font-size: calc(var(--variable-width) + 20px);
            text-align: center;
        }
    }
}
*/

const simpleCss = `
/* Targeting screen widths and orientations */
@media (max-width: 767px) and (orientation: portrait) {
  /* Styles for portrait views on small screens */
}

@media (min-width: 992px) and (orientation: landscape) {
  /* Styles for landscape views on large screens */
}

/* Combining multiple features */
@media (min-width: 500px) and (max-height: 600px) and (color-gamut: srgb) {
  /* Styles for specific screen dimensions and color capabilities */
}

/* Using logical operators */
@media (min-width: 768px) and (not (orientation: portrait)) {
  /* Styles for landscape views on medium and large screens */
}

@media (hover: hover) and (pointer: fine) {
  /* Styles for devices with hover and fine pointer capabilities */
}

/* Targeting specific devices and features */
@media (pointer: coarse) {
  /* Styles for devices with coarse pointers (e.g., touchscreens) */
}

@media (prefers-color-scheme: dark) {
  /* Styles for devices in dark mode */
}

/* Creative combinations */
@media (min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
  /* Styles for large, hover-capable, fine-pointer devices with reduced motion preference */
}

@media (min-width: 700px), handheld and (orientation: landscape) {
    div {
        font-size: calc(var(--variable-width) + 20px);
        text-align: center;
    }
}
@media (min-width: 768px) {
    @media (max-height: 500px) {
        div {
            font-size: calc(var(--variable-width) + 20px);
            text-align: center;
        }
    }
}
`;

const trial = `
html,
body {
    color: blue;
}
h1, h2, h3, h4 {
    font-weight: bold;
}
#div.test ~ .demo > a {
    width: 100%;
    height: 10px;
    font-size: calc(var(--variable-width) + 20px);
    text-align: center;
}
.test::first-child > a ~ .wizard {
    font-size: 1px;
}
`;

const quick = `
@keyframes notificationAnimation {
    0% {
        transform: none;
    }

    50% {
        transform: rotate(10deg);
    }

    100% {
        transform: none;
    }
}
`;

const scss = `
// Variables
$primary-color: #333;
$secondary-color: #eee;

// Nesting
nav {
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li { display: inline-block; }

  a {
    display: block;
    padding: 6px 12px; 
    text-decoration: none;
  }
}

// Mixins
@mixin transition($property) {
  -webkit-transition: $property;
     -moz-transition: $property;
       -o-transition: $property;
          transition: $property;
}

// Extend/Inheritance
.button {
  border: 1px solid $primary-color;
  padding: 10px 15px;
  @include transition(all 0.3s ease);

  &:hover {
    color: $secondary-color;
  }
}

.submit-button {
  @extend .button;
  background-color: $primary-color;
  color: #fff;
}
`;

const testcss = `
a {
    color: black;
}

a {
    text-decoration: none;
}
`;

const parserTest = `
/* 1. Descendant Selector */
div p {
  color: blue;
}

/* 2. Child Selector */
ul > li {
  font-weight: bold;
}

/* 3. Adjacent Sibling Selector */
h1 + p {
  font-style: italic;
}

/* 4. General Sibling Selector */
h2 ~ p {
  text-decoration: underline;
}

/* 5. Universal Selector */
* {
  margin: 0;
  padding: 0;
}

/* 6. Attribute Selectors */
a[target="_blank"] {
  color: red;
}

input[type="text"] {
  border: 1px solid green;
}

div[class~="highlighted"] {
  background-color: yellow;
}

a[href|="/en"] {
  font-size: 1.2em;
}

a[href^="https://"] {
  text-decoration: none;
}

a[href$=".pdf"] {
  font-weight: bold;
}

img[alt*="logo"] {
  border: 2px solid black;
}

/* 7. Class Selector */
.main-content {
  max-width: 800px;
  margin: 0 auto;
}

/* 8. ID Selector */
#page-header {
  background-color: #333;
  color: #fff;
  padding: 20px;
}

/* 9. Pseudo-classes */
a:visited {
  color: purple;
}

li:first-child {
  list-style-type: none;
}

/* 10. Pseudo-elements */
p::first-line {
  font-weight: bold;
}

::before {
  content: "Note: ";
  font-style: italic;
}
`;

// const c = CssTreeHelper.parse(scss);
// const c = CssTreeHelper.parse(quick);
// const c = CssTreeHelper.parse(parserTest);
const c = CssTreeHelper.parse(`${css}\n${simpleCss}\n${trial}`);
const struct = c.getStructure();
delete struct.src;
// console.log(struct.src);
// console.log(struct.som['body N<2>'].declaration.color);
const print = c.findAll('@media');
console.log(print);
// print.forEach((node) => {
//     console.log(node[node.key].loc);
// });

// function trav(obj) {
//     Object.values(obj).forEach((item) => {
//         if (item.loc) {
//             console.log(item.loc);
//         }
//         if (item.declaration) {
//             trav(item.declaration);
//         }
//     });
// }
// trav(struct.som);
// console.log(c.getValue(print[0], struct.src));
// console.log(print['@media only print and (max-width: 600px) N<262>']);
