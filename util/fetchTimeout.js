const fetch = require("node-fetch");
const AbortController = require('abort-controller');

const fetchTimeout = async (url, options) => {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000);
        const request = await fetch(url, { ...options, signal: controller.signal });
        return request;
    } catch (error) {
        if (error.name = 'AbortError') {
            throw (`Error: Network request timed out (${10000} ms).`);
        }
        else {
            return error;
        }
    }
}

module.exports = fetchTimeout;