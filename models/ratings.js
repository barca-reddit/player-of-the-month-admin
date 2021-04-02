const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const Schema = mongoose.Schema;

const RatingSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        match_id: { type: String, required: true },
        player_id: { type: Schema.Types.ObjectId, required: true },
        votes: { type: Number, required: true },
        points: { type: Number, required: true },
        percent: { type: Schema.Types.Decimal128 },
    },
    {
        toObject: {
            virtuals: true
        },
        toJSON: {
            virtuals: true
        }
    }
);

RatingSchema.virtual('player', {
    ref: 'players',
    localField: 'player_id',
    foreignField: '_id',
    justOne: true,
});

RatingSchema.plugin(mongooseLeanVirtuals);

// RatingSchema.virtual('match', {
//     ref: 'matches',
//     localField: 'match_id',
//     foreignField: 'id',
//     justOne: true,
// });

const Ratings = mongoose.model('ratings', RatingSchema);

(async () => {
    await Ratings.syncIndexes();
})();

module.exports = Ratings;