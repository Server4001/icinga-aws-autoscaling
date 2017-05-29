const fs = require('fs');
const path = require('path');

let configFile = {};
const configFilePath = path.join(__dirname, '../', 'config.json');

if (fs.existsSync(configFilePath)) {
    configFile = require('../config.json');
}

module.exports = {
    icinga_host: process.env.icinga_host || configFile.icinga_host,
    icinga_port: process.env.icinga_port || configFile.icinga_port,
    icinga_user: process.env.icinga_user || configFile.icinga_user,
    icinga_pass: process.env.icinga_pass || configFile.icinga_pass
};
