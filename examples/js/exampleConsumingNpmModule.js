/**
 * Example code that consumes the icinga-aws-autoscaling NPM module.
 * In case you wanted to write your own implementation.
 */

const iaa = require('icinga-aws-autoscaling');
const config = require('./config/config.json');

exports.handler = (event, context, callback) => {
    const icingaAwsAutoscaling = iaa(config);
    const message = icingaAwsAutoscaling.eventParser(event, false);
    const icingaApi = icingaAwsAutoscaling.icingaApi;
    const awsApi = icingaAwsAutoscaling.awsApi;
    let callbackArg = null;

    if (message === null) {
        callback(callbackArg);
        return;
    }

    switch (message.event_name) {
        case 'autoscaling:EC2_INSTANCE_LAUNCH':
            callbackArg = handleScaleOut(icingaApi, awsApi);
            break;
        case 'autoscaling:EC2_INSTANCE_TERMINATE':
            callbackArg = handleScaleIn(icingaApi, awsApi);
            break;
        case 'autoscaling:EC2_INSTANCE_LAUNCH_ERROR':
            callbackArg = handleScaleError(icingaApi, awsApi);
            break;
        case 'autoscaling:EC2_INSTANCE_TERMINATE_ERROR':
            callbackArg = handleScaleError(icingaApi, awsApi);
            break;
        default:
            console.log('Invalid event name.');
            break;
    }

    callback(callbackArg)
};
