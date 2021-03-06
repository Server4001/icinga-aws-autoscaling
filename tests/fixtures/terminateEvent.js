'use strict';

module.exports = function(instanceId, availabilityZone) {
    return {
        Records: [
            {
                Sns: {
                    Message: JSON.stringify({
                        Event: 'autoscaling:EC2_INSTANCE_TERMINATE',
                        Details: {
                            'Availability Zone': availabilityZone
                        },
                        EC2InstanceId: instanceId
                    })
                }
            }
        ]
    };
};
