const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const Schema = mongoose.Schema;

const MatchSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        id: { type: Number, required: true, index: true, unique: true },
        timestamp: { type: Number, required: true },
        competition: { type: String, required: true },
        thread: { type: String, required: true },
        home_team_name: { type: String, required: true },
        away_team_name: { type: String, required: true },
        home_team_score: { type: Number, required: true },
        away_team_score: { type: Number, required: true },
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

MatchSchema.virtual('ratings', {
    ref: 'ratings', // this shit has to be lowercase, otherwise path: ... won't work ... FFS
    localField: 'id',
    foreignField: 'match_id',
    justOne: false,

});

MatchSchema.virtual('outcome').get(function () {
    if (this.home_team_name.toLowerCase() === 'barcelona') {
        return this.home_team_score > this.away_team_score
            ? 'W'
            : this.home_team_score < this.away_team_score
                ? 'L'
                : 'D';
    }
    else if (this.away_team_name.toLowerCase() === 'barcelona') {
        return this.home_team_score < this.away_team_score
            ? 'W'
            : this.home_team_score > this.away_team_score
                ? 'L'
                : 'D';
    }
    else {
        return '?';
    }
});

MatchSchema.plugin(mongooseLeanVirtuals);

const Matches = mongoose.model('matches', MatchSchema);

(async () => {
    await Matches.syncIndexes();
})();

module.exports = Matches;