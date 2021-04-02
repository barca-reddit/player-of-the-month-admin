const fetchTimeout = require('../util/fetchTimeout');

const strawpoll = async (url) => {
    try {
        const host = new URL(url).hostname.replace(/^www\./, '')
        const id = new URL(url).pathname.replace(/\/$/, '').split('/').pop();
        const fetchURL = host === 'strawpoll.me'
            ? `https://www.strawpoll.me/api/v2/polls/${id}`
            : `https://www.strawpoll.com/api/poll/${id}`;
        const request = await fetchTimeout(fetchURL);
        const response = await request.json();

        if (host === 'strawpoll.me') {
            return response;
        }
        else if (host === 'strawpoll.com') {
            return {
                id: response.content.id,
                title: response.content.title,
                ...response.content.poll.poll_answers.reduce((acc, curr) => {
                    return { options: [...acc.options, curr.answer], votes: [...acc.votes, curr.votes] }
                }, {
                    options: [],
                    votes: []
                })
            }
        }
    } catch (error) {
        throw error;
    }
}

module.exports = strawpoll;