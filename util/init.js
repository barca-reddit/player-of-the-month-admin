const player_data = require('../default-players.json');
const Players = require('../models/players');

const init = async () => {
    const players = await Players.find({}).lean();
    if (players.length < 1) {
        await Players.create(player_data);
    }
};

module.exports = init;