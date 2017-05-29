/**
 * @var {object} event
 * @property {Object} Records
 * @property {Object} Sns
 * @property {Object} Message
 */
module.exports = function(event) {
    if (event === undefined || event.Records === undefined || event.Records[0] === undefined ||
        event.Records[0].Sns === undefined || event.Records[0].Sns.Message === undefined) {

        console.log('INVALID EVENT PAYLOAD.');
        return null;
    }

    const message = JSON.parse(event.Records[0].Sns.Message);

    if (message.Event === undefined || message.Details === undefined || message.EC2InstanceId === undefined ||
        message.Details['Availability Zone'] === undefined) {

        console.log('INVALID EVENT MESSAGE PAYLOAD.');
        return null;
    }

    return message;
};
