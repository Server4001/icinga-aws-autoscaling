const util = require('util');
const awsApi = require('./lib/aws/api');
const icingaApi = require('./lib/icinga/api');

/**
 * @var {object} event
 * @property {Array} Records
 * @property {Object} Sns
 * @property {Object} Message
 * @property {String} Event
 * @property {String} EC2InstanceId
 * @property {Object} Details
 */
exports.handler = (event, context, callback) => {
    const message = JSON.parse(event.Records[0].Sns.Message);
    const eventName = message.Event;
    const region = message.Details['Availability Zone'].slice(0, -1);
    const instanceId = message.EC2InstanceId;

    if (eventName === 'autoscaling:EC2_INSTANCE_LAUNCH') {
        awsApi.ec2Facts(instanceId, region).then((data) => {
            icingaApi.createHost(instanceId, data.publicDns, data.instanceSize).then(() => {
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
            callback(null);
        }).catch((error) => {
            console.log(error);
            callback({ message: error.message });
        });
    } else {
        // TODO : Consider removing this.
        console.log('UNKNOWN EVENT NAME', eventName);
        console.log(util.inspect(event, {showHidden: true, depth: null}));
        callback(null);
    }
};
