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
        const expectedMessageBody = {
            Event: 'autoscaling:EC2_INSTANCE_LAUNCH',
            Details: {
                'Availability Zone': 'us-west-2'
            },
            EC2InstanceId: 'i-294848282821'
        };

        const event = {
            Records: [
                {
                    Sns: {
                        Message: JSON.stringify(expectedMessageBody)
                    }
                }
            ]
        };

        expect(eventParser(event)).to.deep.equal(expectedMessageBody);
    });
});
