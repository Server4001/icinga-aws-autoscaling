'use strict';

const expect = require('chai').expect;
const eventParser = require('../../../lib/event_parser');

describe('Event Parser', () => {
    it('should return null due to invalid event payload', () => {
        const eventObjects = [
            undefined,
            { missing_Records: 5 },
            { Records: [] },
            { Records: [ { missing_Sns: 'blah' } ] },
            { Records: [ { Sns: { missing_Message: 1.4 } } ] }
        ];

        for (let event of eventObjects) {
            expect(eventParser(event)).to.equal(null);
        }
    });

    it('should return null due to invalid event message payload', () => {
        const eventObjects = [
            { Records: [ { Sns: { Message: '{ "missing_Event": true }' } } ] },
            { Records: [ { Sns: { Message: '{ "missing_Details": 12 }' } } ] },
            { Records: [ { Sns: { Message: '{ "missing_EC2InstanceId": "eleventy five" }' } } ] },
            { Records: [ { Sns: { Message: '{ "Details": { "Missing Availability Zone": "yeppers" } }' } } ] }
        ];

        for ( let event of eventObjects) {
            expect(eventParser(event)).to.equal(null);
        }
    });

    it('should return valid message body with all properties', () => {
        const eventName = 'autoscaling:EC2_INSTANCE_LAUNCH';
        const availabilityZone = 'us-west-2b';
        const region = 'us-west-2';
        const instanceId = 'i-294848282821';

        const event = {
            Records: [
                {
                    Sns: {
                        Message: JSON.stringify({
                            Event: eventName,
                            Details: {
                                'Availability Zone': availabilityZone
                            },
                            EC2InstanceId: instanceId
                        })
                    }
                }
            ]
        };

        expect(eventParser(event)).to.deep.equal({
            event_name: eventName,
            availability_zone: availabilityZone,
            region: region,
            instance_id: instanceId
        });
    });
});
