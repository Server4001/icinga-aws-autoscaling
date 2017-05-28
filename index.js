let AWS = require('aws-sdk');
const request = require('request');
const util = require('util');
const config = require('./config'); // TODO : Change out for environment variables in lambda.

exports.handler = (event, context, callback) => {
    const message = JSON.parse(event.Records[0].Sns.Message);
    const eventName = message.Event;
    const region = message.Details['Availability Zone'].slice(0, -1);
    const instanceId = message.EC2InstanceId;

    if (eventName === 'autoscaling:EC2_INSTANCE_LAUNCH') {
        AWS.config.region = region;

        let ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });
        const callData = { InstanceIds: [ instanceId ], DryRun: false };

        ec2.describeInstances(callData, (err, data) => {
            if (err) {
                console.log('Error', err.stack);
                callback({ message: err.message, code: err.code });

                return;
            }

            const instanceSize = data.Reservations[0].Instances[0].InstanceType;
            const publicDns = data.Reservations[0].Instances[0].PublicDnsName;
            const requestOptions = createHostRequestOptions(instanceId, publicDns, instanceSize);

            sendIcingaRequest(requestOptions).then(() => {
                callback(null);
            }).catch((error) => {
                console.log(error);
                callback({ message: error.message });
            });
        });
    } else if (eventName === 'autoscaling:EC2_INSTANCE_TERMINATE') {
        const requestOptions = deleteHostRequestOptions(instanceId);

        sendIcingaRequest(requestOptions).then(() => {
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

const sendIcingaRequest = (requestOptions) => {
    return new Promise((resolve, reject) => {
        try {
            request(requestOptions, function(error, response, body) {
                if (error) {
                    return reject({
                        message: 'Request level exception occurred.',
                        data: { exception: error }
                    });
                }
                if (response.statusCode !== 200) {
                    return reject({
                        message: 'Invalid status code in response from Icinga.',
                        data: { response_code: response.statusCode }
                    });
                }
                if (body.results === undefined || body.results[0] === undefined) {
                    return reject({
                        message: 'Unexpected response body returned by Icinga.',
                        data: { body }
                    });
                }
                if (parseInt(body.results[0].code) !== 200) {
                    return reject({
                        message: 'Invalid results code in Icinga response body.',
                        data: { results_code: body.results[0].code }
                    });
                }

                return resolve();
            });
        } catch (e) {
            reject({
                message: e.message,
                data: { exception: e }
            });
        }
    });
};

const createHostRequestOptions = (instanceId, publicDns, instanceSize) => {
    return {
        method: 'PUT',
        uri: `https://${config.icinga.host}:${config.icinga.port}/v1/objects/hosts/${instanceId}`,
        strictSSL: false,
        headers: {
            'Accept': 'application/json'
        },
        auth: {
            user: config.icinga.user,
            pass: config.icinga.password
        },
        json: {
            templates: [ 'generic-host' ],
            attrs: {
                address: publicDns,
                'vars.os' : 'Linux', // TODO : Make this dynamic.
                'vars.instance_size': instanceSize,
                'vars.hostgroups': 'X,linux-servers,X', // TODO : Make this dynamic.
                groups: [ 'linux-servers' ] // TODO : Make this dynamic.
                // TODO : Add group for the ASG name.
            }
        }
    };
};

const deleteHostRequestOptions = (instanceId) => {
    return {
        method: 'POST',
        uri: `https://${config.icinga.host}:${config.icinga.port}/v1/objects/hosts/${instanceId}?cascade=1`,
        strictSSL: false,
        headers: {
            'Accept': 'application/json',
            'X-HTTP-Method-Override': 'DELETE'
        },
        auth: {
            user: config.icinga.user,
            pass: config.icinga.password
        },
        json: {}
    };
};
