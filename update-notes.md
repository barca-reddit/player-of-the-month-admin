db.getCollection('ratings').updateMany(
    {},
    [{ "$set": { "match_id": { "$toString": "$match_id" } }}]
);

db.getCollection('matches').updateMany(
    {},
    [{ "$set": { "id": { "$toString": "$id" } }}]
);