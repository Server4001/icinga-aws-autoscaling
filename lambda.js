'use strict';

const path = require('path');
const awsApi = require('./lib/aws/api');
const configLoader = require('./lib/configLoader');
const eventParser = require('./lib/event_parser');
const icingaApiFactory = require('./lib/icinga/api');
const logger = require('./lib/logger');

exports.handler = (event, context, callback) => {

    try {
        const config = configLoader(path.join(__dirname, 'config.json'));
    } catch (e) {
        logger(true, e);
        callback({ message: e.message });

        return;
    }

    let verbose = false;
    if (config.verbose === true || config.verbose === 'true' || config.verbose === 1) {
        verbose = true;
    }

    /** @var {object} message */
    const message = eventParser(event, verbose);

    if (message === null) {
        callback(null);

        return;
    }

    const eventName = message.event_name;
    const region = message.region;
    const instanceId = message.instance_id;
    const icingaApi = icingaApiFactory(config);

    if (eventName === 'autoscaling:EC2_INSTANCE_LAUNCH') {

        awsApi.ec2Facts(instanceId, region).then((data) => {
            icingaApi.createHost(instanceId, data).then(() => {
                logger(verbose, `Created Host: ${instanceId}`);
                callback(null);
            }).catch((error) => {
                logger(verbose, error);
                callback({ message: error.message });
            });
        }).catch((err) => {
            logger(verbose, 'Error', err.stack);
            callback({ message: err.message, code: err.code });
        });

    } else if (eventName === 'autoscaling:EC2_INSTANCE_TERMINATE') {

        awsApi.ec2Facts(instanceId, region).then((data) => {
            icingaApi.deleteHost(instanceId, data).then(() => {
                logger(verbose, `Deleted Host: ${instanceId}`);
                callback(null);
            }).catch((error) => {
                logger(verbose, error);
                callback({ message: error.message });
            });
        }).catch((err) => {
            logger(verbose, 'Error', err.stack);
            callback({ message: err.message, code: err.code });
        });

    } else {
        logger(verbose, 'UNKNOWN EVENT NAME: ', eventName);
        callback(null);
    }
};
