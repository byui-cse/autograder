import Fs from 'fs';
import Autograder from '../app/autograder.js';

const ag = new Autograder();

const file = {
    css: {},
    html: {},
    js: {}
};

let report = '';
const reports = [];

// CSS
console.log('\n----------[ CSS ]----------');
report = await ag.processFileByUrl('https://caboodle.tech/byui/ag/css/simple.css');
// report.src = 'Removed to save space in demo.';
console.log(report);
reports.push(report);

// HTML
console.log('\n\n----------[ HTML ]----------');
report = await ag.processFileByUrl('https://caboodle.tech/byui/ag/html/simple.html');
// report.src = 'Removed to save space in demo.';
console.log(report);
reports.push(report);

// JS
console.log('\n\n----------[ JS ]----------');
report = await ag.processFileByUrl('https://caboodle.tech/byui/ag/js/simple.js');
// report.src = 'Removed to save space in demo.';
console.log(report);
reports.push(report);

Fs.writeFileSync('report.html', ag.getHtmlReport(reports));
