const request = require('request');
const config = require('../../config.json');

/**
 * Icinga API class.
 */
module.exports = {
    /**
     * @param {String} instanceId
     * @param {Object} instanceData
     *
     * @return {Promise}
     */
    createHost(instanceId, instanceData) {
        const requestOptions = this.createHostRequestOptions(instanceId, instanceData);

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
     * @param {Object} instanceData
     *
     * @return {Object}
     */
    createHostRequestOptions(instanceId, instanceData) {
        const hostName = this.icingaHostName(instanceId, instanceData);

        let options = {
            method: 'PUT',
            uri: `https://${config.icinga_host}:${config.icinga_port}/v1/objects/hosts/${hostName}`,
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
                    address: instanceData.publicDns,
                    'vars.instance_size': instanceData.instanceSize,
                    'vars.ebs_optimized': instanceData.ebsOptimized,
                    'vars.key_name': instanceData.keyName
                }
            }
        };

        const icingaHostVars = config.icinga_host_vars;

        if (icingaHostVars instanceof Object) {
            for (let hostVar in icingaHostVars) {
                if (icingaHostVars.hasOwnProperty(hostVar) &&
                    options.json.attrs[`vars.${hostVar}`] === undefined) {
                    // Dynamically set host vars from config.
                    options.json.attrs[`vars.${hostVar}`] = icingaHostVars[hostVar];
                }
            }
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
    },

    /**
     * @param {String} instanceId
     * @param {Object} instanceData
     *
     * @return {String}
     */
    icingaHostName(instanceId, instanceData) {
        let hostName = instanceId;

        if ((typeof config.icinga_host_name_property) === 'string' && config.icinga_host_name_property.length > 0) {
            const icingaHostNameProperty = config.icinga_host_name_property.toLowerCase();
            const mapping = {
                public_dns: instanceData.publicDns,
                public_ip: instanceData.publicIpAddress,
                private_dns: instanceData.privateDns,
                private_ip: instanceData.privateIpAddress
            };

            if (mapping.hasOwnProperty(icingaHostNameProperty)) {
                hostName = mapping[icingaHostNameProperty];
            }
        }

        return hostName;
    }
};
