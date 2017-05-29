const awsApi = require('./lib/aws/api');
const eventParser = require('./lib/event_parser');
const icingaApi = require('./lib/icinga/api');

exports.handler = (event, context, callback) => {

    /** @var {object} message */
    const message = eventParser(event);

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
                console.log(`Created Host: ${instanceId}`);
                callback(null);
            }).catch((error) => {
                console.log(error);
                callback({ message: error.message });
            });
        }).catch((err) => {
            console.log('Error', err.stack);
            callback({ message: err.message, code: err.code });
        });

    } else if (eventName === 'autoscaling:EC2_INSTANCE_TERMINATE') {

        icingaApi.deleteHost(instanceId).then(() => {
            console.log(`Deleted Host: ${instanceId}`);
            callback(null);
        }).catch((error) => {
            console.log(error);
            callback({ message: error.message });
        });

    } else {
        console.log('UNKNOWN EVENT NAME: ', eventName);
        callback(null);
    }
};
