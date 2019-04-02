var Q = require('q');

var originalData = require('./data/packages');

var utils = require('../utils');

function clone(item) {
    return JSON.parse(JSON.stringify(item));
}

// Connector to the database
function MongoClient(url) {
    var data = clone(originalData);

    this.reset = function() {
        data = clone(originalData);
    }

    var db = {
        collection: function(name) {
            return {
                find: function(query) {
                    var result = new Array();
                    var names = query.name["$in"];

                    var packages = clone(data);

                    for (var i = 0; i < names.length; i++) {
                        if (packages[names[i]]) {
                            result.push(packages[names[i]]);
                        }
                    }

                    return {
                        toArray: function(callback) {
                            callback(false, result);
                        }
                    }
                },
                findOne: function(query) {
                    return Q.Promise(function(resolve, reject) {
                        var packages = clone(data);
                        resolve(packages[query.name]);
                    });
                },
                insertOne: function(package) {
                    return Q.Promise(function(resolve, reject) {
                        data[package.name] = package;
                        resolve();
                    });                    
                },
                updateOne:function(package, query) {
                    return Q.Promise(function(resolve, reject) {
                        utils.map(package, data[query["$set"].name]);
                        resolve();
                    });                    
                }
            }
        }
    }

    this.connect = function(callback) {
        callback();
    }

    this.db = function(dbName) {
        if (!db) {
            reject(new dbExceptions.CantConnectToDbException());
        } else {
            return db;
        }
    }
}

module.exports = {
    MongoClient: MongoClient
}