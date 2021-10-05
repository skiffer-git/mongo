/**
 * Test inserts into sharded timeseries collection with the balancer on.
 *
 * @tags: [
 *   requires_fcv_51,
 * ]
 */

(function() {
"use strict";

load("jstests/core/timeseries/libs/timeseries.js");  // For 'TimeseriesTest' helpers.

Random.setRandomSeed();

const dbName = 'testDB';
const collName = 'testColl';
const timeField = 'time';
const metaField = 'hostid';

// Connections.
const st = new ShardingTest({shards: 2, rs: {nodes: 2}});
const mongos = st.s0;

// Sanity checks.
if (!TimeseriesTest.shardedtimeseriesCollectionsEnabled(st.shard0)) {
    jsTestLog("Skipping test because the sharded time-series collection feature flag is disabled");
    st.stop();
    return;
}

// Databases and collections.
assert.commandWorked(mongos.adminCommand({enableSharding: dbName}));
const mainDB = mongos.getDB(dbName);

// Helpers.
let currentId = 0;
function generateId() {
    return currentId++;
}

const largeStr = "a".repeat(10000);

function generateBatch(size) {
    return TimeseriesTest.generateHosts(size).map((host, index) => Object.assign(host, {
        _id: generateId(),
        [metaField]: index,
        [timeField]: new Date(currentId),
        largeField: largeStr,
    }));
}

st.startBalancer();
function runTest(shardKey) {
    assert.commandWorked(mainDB.createCollection(
        collName, {timeseries: {timeField: timeField, metaField: metaField}}));
    const coll = mainDB.getCollection(collName);

    // Shard timeseries collection.
    assert.commandWorked(coll.createIndex(shardKey));
    assert.commandWorked(mongos.adminCommand({
        shardCollection: `${dbName}.${collName}`,
        key: shardKey,
    }));

    // Insert a large dataset so that the balancer is guranteed to split the chunks.
    let bulk = coll.initializeUnorderedBulkOp();
    const numDocs = 100000;
    const firstBatch = generateBatch(numDocs);
    for (let doc of firstBatch) {
        bulk.insert(doc);
    }
    assert.commandWorked(bulk.execute());

    // Ensure that each shard has at least one chunk after the split.
    const primaryShard = st.getPrimaryShard(dbName);
    const otherShard = st.getOther(primaryShard);
    assert.soon(
        () => {
            const counts = st.chunkCounts(`system.buckets.${collName}`, dbName);
            return counts[primaryShard.shardName] >= 1 && counts[otherShard.shardName] >= 1;
        },
        () => {
            return tojson(mongos.getDB("config").getCollection("chunks").find().toArray());
        });

    // Verify that all the documents still exist in the collection.
    assert.eq(coll.find().itcount(), numDocs);
    assert(coll.drop());
}

runTest({time: 1});
st.stop();
})();
