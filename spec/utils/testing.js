const mongoUnit = require('mongo-unit');
var Q = require('q');

const mockData = require('../db/mock.data.json');

function TestingUtils() {
    var testUrl;

    this.startTestDb = function() {
        return Q.Promise(function(resolve, reject) {
            console.log("START");

            var promise = mongoUnit.start();


            mongoUnit.getUrl();

            promise.catch(function(err) {
                console.log("ERROR");
            })
            
        })
    }

    this.dropTestDb = function() {
        return mongoUnit.drop();
    }

    this.stopTestDb = function() {
        mongoUnit.stop();
    }

    this.loadTestDb = function() {
        mongoUnit.initDb(testUrl, mockData);
    }    
}

module.exports = new TestingUtils();
