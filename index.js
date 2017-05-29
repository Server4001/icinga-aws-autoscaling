'use strict';

const awsApi = require('./lib/aws/api');
const eventParser = require('./lib/event_parser');
const icingaApiFactory = require('./lib/icinga/api');
const logger = require('./lib/logger');

module.exports = function(config) {

    return {
        awsApi,
        eventParser,
        logger,
        icingaApi: icingaApiFactory(config),
    };
};
