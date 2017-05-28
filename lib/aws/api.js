let AWS = require('aws-sdk');

/**
 * AWS API class.
 */
module.exports = {
    ec2Facts(instanceId, region, callback) {
        AWS.config.region = region;

        //noinspection JSCheckFunctionSignatures
        let ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });
        const callData = { InstanceIds: [ instanceId ], DryRun: false };

        ec2.describeInstances(callData, (err, data) => {
            if (err) {
                callback(err);

                return;
            }

            const instanceSize = data.Reservations[0].Instances[0].InstanceType;
            const publicDns = data.Reservations[0].Instances[0].PublicDnsName;

            callback(undefined, { instanceSize, publicDns });
        });
    }
};
