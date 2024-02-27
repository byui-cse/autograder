/**
 * The fastest way to get the actual type of anything in JavaScript.
 *
 * {@link https://jsbench.me/ruks9jljcu/2 | See benchmarks}.
 *
 * @param {*} unknown - Anything you wish to check the type of.
 * @returns {string|undefined} - The type in lowercase of the unknown value passed in or undefined.
 */
export default function WhatIs(unknown) {
    try {
        return ({}).toString.call(unknown).match(/\s([^\]]+)/)[1].toLowerCase();
    } catch (e) { return undefined; }
}
