let AWS = require('aws-sdk');

/**
 * AWS API class.
 */
module.exports = {
    ec2Facts(instanceId, region) {
        AWS.config.region = region;

        return new Promise((resolve, reject) => {
            //noinspection JSCheckFunctionSignatures
            let ec2 = new AWS.EC2({ apiVersion: '2016-11-15' });
            const callData = { InstanceIds: [ instanceId ], DryRun: false };

            ec2.describeInstances(callData, (err, data) => {
                if (err) {
                    return reject(err);
                }

                resolve({
                    instanceSize: data.Reservations[0].Instances[0].InstanceType,
                    ebsOptimized: data.Reservations[0].Instances[0].EbsOptimized,
                    keyName: data.Reservations[0].Instances[0].KeyName,
                    publicDns: data.Reservations[0].Instances[0].PublicDnsName,
                    publicIpAddress: data.Reservations[0].Instances[0].PublicIpAddress,
                    privateDns: data.Reservations[0].Instances[0].PrivateDnsName,
                    privateIpAddress: data.Reservations[0].Instances[0].PrivateIpAddress
                });
            });
        });
    }
};
