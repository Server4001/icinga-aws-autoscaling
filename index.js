'use strict';
const awsApi = require('./lib/aws/api');
const config = require('./config.json');
const eventParser = require('./lib/event_parser');
const icingaApi = require('./lib/icinga/api');
const logger = require('./lib/logger');

exports.handler = (event, context, callback) => {

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

    const eventName = message.Event;
    const region = message.Details['Availability Zone'].slice(0, -1);
    const instanceId = message.EC2InstanceId;

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
