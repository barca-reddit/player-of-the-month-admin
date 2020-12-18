const fetchTimeout = require('../util/fetchTimeout');

const strawpoll = async (id) => {
    try {
        const request = await fetchTimeout(`https://www.strawpoll.me/api/v2/polls/${id}`);
        const response = await request.json();
        return response;
    } catch (error) {
        throw error;
    }
}

module.exports = strawpoll;