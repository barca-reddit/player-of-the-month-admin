const Players = require('../models/players');
const Matches = require('../models/matches');
const Ratings = require('../models/ratings');

const database = {
    players: {
        get: async (data) => {
            return await Players.findOne({ _id: data.id }).lean();
        },
        getAll: async () => {
            return await Players.find({}).lean();
        },
        addTag: async (data) => {
            return await Players.updateOne({ _id: data.id }, { $addToSet: { tags: data.tag } });
        },
        update: async (data) => {
            await Players.validate(data);
            return await Players.replaceOne({ _id: data._id }, data);
        }
    },
    matches: {
        getAll: async () => {
            return await Matches.find({}).sort({ timestamp: -1 }).lean({ virtuals: ['outcome'] });
        },
        insert: async (data) => {
            await Promise.all([
                Matches.validate(data.match),
                data.ratings.map(rating => Ratings.validate(rating))
            ]);

            await Promise.all([
                Matches.replaceOne({ id: data.match.id }, data.match, { upsert: true }),
                Ratings.bulkWrite(
                    [
                        { deleteMany: { filter: { match_id: data.match.id } } },
                        ...data.ratings.map(rating => ({ insertOne: { document: rating } }))
                    ],
                    { ordered: true }
                )
            ]);
        },
        update: async (data) => {
            await Matches.validate(data.match);
            return await Matches.replaceOne({ id: data.match.id }, data.match, { upsert: false });
        },
        delete: async (data) => {
            await Promise.all([
                Matches.deleteOne({ id: data.id }),
                Ratings.deleteMany({ match_id: data.id })
            ]);
        }
    },
    ratings: {
        get: async (data) => {
            return await Ratings.find({ match_id: data.id }).populate('player').lean();
        },
        getAll: async () => {
            return await Ratings.find({}).lean();
        },
        getAggregatedAll: async () => {
            return await Matches.aggregate([
                { $lookup: { from: 'ratings', localField: 'id', foreignField: 'match_id', as: 'rating' } },
                { $unwind: { path: '$rating' } },
                { $lookup: { from: 'players', localField: 'rating.player_id', foreignField: '_id', as: 'player' } },
                { $unwind: { path: '$player' } },
                {
                    $group: {
                        _id: '$player._id',
                        name: { $first: '$player.name' },
                        apps: { $sum: 1 },
                        votes: { $sum: '$rating.votes' },
                        points: { $sum: '$rating.points' },
                        wins: { $sum: { $cond: [{ $gte: ["$rating.points", 12] }, 1, 0] } },
                        top3: { $sum: { $cond: [{ $gte: ["$rating.points", 6] }, 1, 0] } },
                        top5: { $sum: { $cond: [{ $gte: ["$rating.points", 2] }, 1, 0] } },
                    }
                },
                {
                    $addFields: {
                        ppg: { $divide: ['$points', '$apps'] },
                        vpg: { $divide: ['$votes', '$apps'] },
                    }
                },
                { $sort: { 'points': -1, 'votes': -1, 'name': 1 } }
            ]);
        },
        getAggregatedbyDates: async (data) => {
            return await Matches.aggregate([
                { $match: { timestamp: { $gte: data.start, $lte: data.end } } },
                { $lookup: { from: 'ratings', localField: 'id', foreignField: 'match_id', as: 'rating' } },
                { $unwind: { path: '$rating' } },
                { $lookup: { from: 'players', localField: 'rating.player_id', foreignField: '_id', as: 'player' } },
                { $unwind: { path: '$player' } },
                {
                    $group: {
                        _id: '$player._id',
                        name: { $first: '$player.name' },
                        apps: { $sum: 1 },
                        votes: { $sum: '$rating.votes' },
                        points: { $sum: '$rating.points' },
                        wins: { $sum: { $cond: [{ $gte: ["$rating.points", 12] }, 1, 0] } },
                        top3: { $sum: { $cond: [{ $gte: ["$rating.points", 6] }, 1, 0] } },
                        top5: { $sum: { $cond: [{ $gte: ["$rating.points", 2] }, 1, 0] } },
                    }
                },
                {
                    $addFields: {
                        ppg: { $divide: ['$points', '$apps'] },
                        vpg: { $divide: ['$votes', '$apps'] },
                    }
                },
                { $sort: { 'points': -1, 'votes': -1, 'name': 1 } }
            ]);
        }
    },
}

module.exports = database;