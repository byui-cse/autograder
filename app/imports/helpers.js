/* eslint-disable no-param-reassign */

/**
 * Get a portion of the original source file.
 *
 * @param {string} source The source file to pull lines from.
 * @param {int} lineStart The line to start at.
 * @param {int} lineEnd The line to end at.
 * @param {int} colStart The column to start at; send 0 for bodies and blocks.
 * @param {int} colEnd The column to end at; send 0 for bodies and blocks.
 * @returns {string} The portion of the source file requested.
 */
export const GetLines = (source, lineStart, lineEnd, colStart = 0, colEnd = 0) => {

    colStart += 1;
    lineEnd += 1;

    const lines = source.split('\n');

    // Handle line errors
    if (lineStart > lines.length) return '';
    if (lineEnd > lines.length) lineEnd = lines.length;

    // Handle columns
    colStart = colStart || 0;
    colEnd = colEnd || 0;

    // Slice lines
    const start = lineStart - 1;
    const end = lineEnd - 1;
    const slice = lines.slice(start, end);

    // Extract columns
    const result = slice.map((line) => {
        if (!colStart || !colEnd) {
            return line;
        }
        return line.substring(colStart - 1, colEnd);
    }).join('\n');

    return result;
};

/**
 * Get the source code (value) of a node.
 *
 * @param {object} somNode The SOM node object to get the source code (body) from.
 * @param {string} source The original source code this node was parsed from.
 * @returns {string} The request portion of code or an empty string.
 */
export const GetValue = (somNode, source = '') => {

    if (!somNode) {
        return '';
    }

    let node = somNode;

    // HTMLs structure is very different so account for a user not passing in the actual node.
    if (node.node) {
        node = node.node;
    }

    // If location data is missing we may have the parent object and need to grab the node still.
    if (!node.loc) {

        if (!node.key) {
            return '';
        }

        node = somNode[node.key];
    }

    return GetLines(
        source,
        node.loc.start.line,
        node.loc.end.line,
        0,
        0
    );
};

/**
 * The fastest way to get the actual type of anything in JavaScript.
 *
 * {@link https://jsbench.me/ruks9jljcu/2 | See benchmarks}.
 *
 * @param {*} unknown Anything you wish to check the type of.
 * @returns {string|undefined} The type in lowercase of the unknown value passed in or undefined.
 */
export const WhatIs = (unknown) => {
    try {
        return ({}).toString.call(unknown).match(/\s([^\]]+)/)[1].toLowerCase();
    } catch (e) { return undefined; }
};
