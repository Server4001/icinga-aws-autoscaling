'use strict';
/**
 * @var {object} event
 * @property {Object} Records
 * @property {Object} Sns
 * @property {*} Message
 */

const logger = require('./logger');

module.exports = function(event, verbose = false) {
    if (event === undefined || event.Records === undefined || event.Records[0] === undefined ||
        event.Records[0].Sns === undefined || event.Records[0].Sns.Message === undefined) {

        logger(verbose, 'INVALID EVENT PAYLOAD.');
        return null;
    }

    /**
     * @var {Object} message
     * @property {*} Event
     * @property {*} Details
     * @property {*} EC2InstanceId
     */
    const message = JSON.parse(event.Records[0].Sns.Message);

    if (message.Event === undefined || message.Details === undefined || message.EC2InstanceId === undefined ||
        message.Details['Availability Zone'] === undefined) {

        logger(verbose, 'INVALID EVENT MESSAGE PAYLOAD.');
        return null;
    }

    return message;
};
