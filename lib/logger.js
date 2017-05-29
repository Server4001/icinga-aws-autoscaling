'use strict';

module.exports = function(verbose, ...data) {
    if (verbose) {
        console.log(...data);
    }
};
