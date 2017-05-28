exports.handler = (event, context, callback) => {
    const config = require('./config');
    const message = event.Records[0].Sns.Message;
    const eventName = message.Event;
    const instanceId = message.EC2InstanceId;
    const availabilityZone = message.Details['Availability Zone'];
    let newEventName;

    if (eventName === 'autoscaling:EC2_INSTANCE_LAUNCH') {
        newEventName = 'SCALE OUT';
    } else if (eventName === 'autoscaling:EC2_INSTANCE_TERMINATE') {
        newEventName = 'SCALE IN';
    }

    console.log({ id: instanceId, az: availabilityZone, event: newEventName });
    callback(null);
    // callback({}); // error.
};
