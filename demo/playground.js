import Fs from 'fs';

const json = JSON.parse(Fs.readFileSync('demo/reports.json'));

let body = '';
let header = '';
const files = [];

['css', 'html', 'js'].forEach((type) => {
    files.push(json[type].name);
    body += '<article>';
    body += `<h2>${json[type].name}</h2>`;
    body += '<div class="title">Source</div>';
    console.log(json[type].src);
    body += `<div class="toggle"><pre><code class="${json[type].ext}">${json[type].src.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></div>`;
    body += '<div class="title">Notices</div>';
    json[type].notice.forEach((notice) => {
        body += `<div class="alert notice"><div class="rule">${notice.rule}</div>`;
        body += `<div class="message">${notice.text}</div></div>`;
    });
    body += '<div class="title">Warnings</div>';
    json[type].warning.forEach((warning) => {
        body += `<div class="alert warning"><div class="rule">${warning.rule}</div>`;
        body += `<div class="message">${warning.text}</div></div>`;
    });
    body += '<div class="title">Errors</div>';
    json[type].error.forEach((error) => {
        body += `<div class="alert error"><div class="rule">${error.rule}</div>`;
        body += `<div class="message">${error.text}</div></div>`;
    });
    body += '</article>';
});

let list = '';
files.forEach((file) => {
    list += `<li>${file}</li>`;
});

header = `
<div class="files">
    <div class="title">Files Reviewed</div>
    <div class="list">
        <ol>${list}</ol>
    </div>
</div>
`;

const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/highlightjs-line-numbers.js/2.8.0/highlightjs-line-numbers.min.js"></script>
    <script>
    hljs.highlightAll();
    hljs.initLineNumbersOnLoad({
        singleLine: true
    });
    </script>
    <style>
    /* for block of numbers */
.hljs-ln-numbers {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;

    text-align: center;
    color: #ccc;
    border-right: 1px solid #CCC;
    vertical-align: top;
    padding-right: 5px;

    /* your custom style here */
}

.alert {
    position: relative;
    padding: 0.75rem 1.25rem;
    margin-bottom: 1rem;
    border: 1px solid transparent;
    border-radius: 0.25rem;
}

.notice {
    color: #0c5460;
    background-color: #d1ecf1;
    border-color: #bee5eb;
}

.error {
    color: #721c24;
    background-color: #f8d7da;
    border-color: #f5c6cb;
}

.warning {
    color: #856404;
    background-color: #fff3cd;
    border-color: #ffeeba;
}

.
    </style>
</head>
<body>
    ${header}
    ${body}
</body>
</html>
`;

Fs.writeFileSync('report.html', template);
