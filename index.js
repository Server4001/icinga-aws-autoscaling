let AWS = require('aws-sdk');
const util = require('util');
const icingaApi = require('./lib/icinga/api');

/**
 * @var {object} event
 * @property {Array} Records
 * @property {Object} Sns
 * @property {Object} Message
 * @property {String} Event
 * @property {String} EC2InstanceId
 * @property {Object} Details
 * @property {String} Availability Zone
 */
exports.handler = (event, context, callback) => {
    const message = JSON.parse(event.Records[0].Sns.Message);
    const eventName = message.Event;
    const region = message.Details['Availability Zone'].slice(0, -1);
    const instanceId = message.EC2InstanceId;

    if (eventName === 'autoscaling:EC2_INSTANCE_LAUNCH') {
        AWS.config.region = region;

        //noinspection JSCheckFunctionSignatures
        let ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });
        const callData = { InstanceIds: [ instanceId ], DryRun: false };

        ec2.describeInstances(callData, (err, data) => {
            if (err) {
                //noinspection JSUnresolvedVariable
                console.log('Error', err.stack);
                callback({ message: err.message, code: err.code });

                return;
            }

            const instanceSize = data.Reservations[0].Instances[0].InstanceType;
            const publicDns = data.Reservations[0].Instances[0].PublicDnsName;
            const requestOptions = icingaApi.createHostRequestOptions(instanceId, publicDns, instanceSize);

            icingaApi.sendIcingaRequest(requestOptions).then(() => {
                callback(null);
            }).catch((error) => {
                console.log(error);
                callback({ message: error.message });
            });
        });
    } else if (eventName === 'autoscaling:EC2_INSTANCE_TERMINATE') {
        const requestOptions = icingaApi.deleteHostRequestOptions(instanceId);

        icingaApi.sendIcingaRequest(requestOptions).then(() => {
            callback(null);
        }).catch((error) => {
            console.log(error);
            callback({ message: error.message });
        });
    } else {
        console.log('UNKNOWN EVENT NAME', eventName);
        console.log(util.inspect(event, {showHidden: true, depth: null}));
        callback(null);
    }
};
