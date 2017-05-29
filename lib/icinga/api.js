const request = require('request');
const config = require('../../config.json');

/**
 * Icinga API class.
 */
module.exports = {
    /**
     * @param {String} instanceId
     * @param {String} publicDns
     * @param {String} instanceSize
     *
     * @return {Promise}
     */
    createHost(instanceId, publicDns, instanceSize) {
        const requestOptions = this.createHostRequestOptions(instanceId, publicDns, instanceSize);

        return this.sendRequest(requestOptions);
    },

    /**
     * @param {String} instanceId
     *
     * @return {Promise}
     */
    deleteHost(instanceId) {
        const requestOptions = this.deleteHostRequestOptions(instanceId);

        return this.sendRequest(requestOptions);
    },

    /**
     * @param {Object} requestOptions
     *
     * @return {Promise}
     */
    sendRequest(requestOptions) {
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
        let options = {
            method: 'PUT',
            uri: `https://${config.icinga_host}:${config.icinga_port}/v1/objects/hosts/${instanceId}`,
            strictSSL: false,
            headers: {
                'Accept': 'application/json'
            },
            auth: {
                user: config.icinga_user,
                pass: config.icinga_pass
            },
            json: {
                templates: [ 'generic-host' ],
                attrs: {
                    address: publicDns,
                    'vars.instance_size': instanceSize
                    // 'vars.hostgroups': 'X,linux-servers,X', // TODO : Do we need this?
                }
            }
        };

        if ((typeof config.icinga_host_os) === 'string' && config.icinga_host_os.length > 0) {
            options.json.attrs['vars.os'] = config.icinga_host_os;
        }
        if (config.icinga_hostgroups instanceof Array && config.icinga_hostgroups.length > 0) {
            options.json.attrs.groups = config.icinga_hostgroups;
        }

        return options;
    },

    /**
     * @param {String} instanceId
     *
     * @return {Object}
     */
    deleteHostRequestOptions(instanceId) {
        return {
            method: 'POST',
            uri: `https://${config.icinga_host}:${config.icinga_port}/v1/objects/hosts/${instanceId}?cascade=1`,
            strictSSL: false,
            headers: {
                'Accept': 'application/json',
                'X-HTTP-Method-Override': 'DELETE'
            },
            auth: {
                user: config.icinga_user,
                pass: config.icinga_pass
            },
            json: {}
        };
    }
};
