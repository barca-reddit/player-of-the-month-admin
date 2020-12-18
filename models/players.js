const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const Schema = mongoose.Schema;

const PlayerSchema = new Schema(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        name: { type: String, required: true, index: true, unique: true },
        number: { type: Number, required: true },
        photo: { type: String, required: true, default: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Elliot_Grieveson.png' },
        tags: [{ type: String }]
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

PlayerSchema.virtual('ratings', {
    ref: 'ratings',
    localField: 'name',
    foreignField: 'name',
    justOne: false,
});

PlayerSchema.plugin(mongooseLeanVirtuals);

const Players = mongoose.model('players', PlayerSchema);

(async () => {
    await Players.syncIndexes();
})();

module.exports = Players;