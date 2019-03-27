var Q = require('q');

// Exceptions
var dbExceptions = require('../../exceptions/db.exceptions');

// Utils
var logger = require('../../utils/logger');

// Mock packages data
var originalData = require('./data/packages');

var utils = require('../utils');

function clone(item) {
    return JSON.parse(JSON.stringify(item));
}

// Connector to the database
function Connector() {
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

    this.connect = function(url) {
        return Q.Promise(function(resolve, reject) {
            logger.info("Connecting to database");

            if (url == "err") {
                logger.error("Error connecting to the database");
                reject(new dbExceptions.CantConnectToDbException(err));
            } else {
                logger.info("Connected to database");                    

                resolve(db);
            }
        });
    }

    this.db = function() {
        if (!db) {
            reject(new dbExceptions.CantConnectToDbException());
        } else {
            return db;
        }
    }
}

module.exports = new Connector();
