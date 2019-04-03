var Q = require('q');

var pkg = require('./data/packages');

var utils = require('../utils');

// Connector to the database
function MongoClient(url) {
    this.reset = function() {
        pkg.reset();
    }

    var db = {
        collection: function(name) {
            return {
                find: function(query) {
                    var result = new Array();
                    var names = query.name["$in"];

                    var packages = pkg.data;

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
                        var packages = pkg.data;
                        resolve(packages[query.name]);
                    });
                },
                insertOne: function(package) {
                    return Q.Promise(function(resolve, reject) {
                        pkg.data[package.name] = package;
                        resolve();
                    });                    
                },
                updateOne:function(package, query) {
                    return Q.Promise(function(resolve, reject) {
                        utils.map(package, pkg.data[query["$set"].name]);
                        resolve();
                    });                    
                }
            }
        }
    }

    this.connect = function(callback) {
        if (url == "mongodb://error:27017") {
            callback("The specified database doesn't exists");
        } else {
            callback();
        }        
    }

    this.db = function(dbName) {
        if (dbName == "error") {
            return;
        }

        return db;
    }
}

module.exports = {
    MongoClient: MongoClient
}