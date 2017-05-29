'use strict';

const fs = require('fs');

module.exports = function(defaultConfigPath) {

    if (!fs.existsSync(defaultConfigPath)) {
        throw Error('Unable to find config file. Ensure config.json exists in your project root.');
    }

    return require(defaultConfigPath);
};
