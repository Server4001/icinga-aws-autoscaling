exports.handler = (event, context, callback) => {
    const config = require('./config');
    const message = event.Records[0].Sns.Message;
    const eventName = message.Event;

    if (eventName === 'autoscaling:EC2_INSTANCE_LAUNCH') {
        // const availabilityZone = message.Details['Availability Zone'];;
        console.log({ id: message.EC2InstanceId, az: message.Details, event: 'SCALE OUT' });
    } else if (eventName === 'autoscaling:EC2_INSTANCE_TERMINATE') {
        // const availabilityZone = message.Details['Availability Zone'];
        console.log({ id: message.EC2InstanceId, az: message.Details, event: 'SCALE IN' });
    }

    callback(null);
    // callback({}); // error.
};
