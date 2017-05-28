const request = require('request');
const config = require('../../config.json'); // TODO : Change out for environment variables in lambda.

module.exports = {
    /**
     * @param {Object} requestOptions
     * @return {Promise}
     */
    sendIcingaRequest(requestOptions) {
        return new Promise((resolve, reject) => {
            try {
                /**
                 * @var {Object} body
                 * @property {Object} results
                 */
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
    },

    /**
     * @param {String} instanceId
     * @param {String} publicDns
     * @param {String} instanceSize
     *
     * @return {Object}
     */
    createHostRequestOptions(instanceId, publicDns, instanceSize) {
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
    },

    /**
     * @param {String} instanceId
     *
     * @return {Object}
     */
    deleteHostRequestOptions(instanceId) {
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
    }
};
