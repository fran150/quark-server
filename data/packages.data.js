var async = require('async');
var semver = require('semver');
var Q = require('q');
const MongoClient = require('mongodb').MongoClient

var config = require('../config.json');

function Packages() {
    var self = this;

    var database;

    function db(reject) {
        if (!database) {
            reject(new Error("Disconnected from database"));
        } else {
            return database;
        }
    }

    this.connect = function() {
        return Q.Promise(function(resolve, reject) {
            console.log("Connecting: " + config.connection);

            MongoClient.connect(config.connection, function(err, client) {
                if (err) {
                    reject(new Error("Database connection error"));
                } else {                    
                    database = client.db(config.database);
                    resolve(db);
                }
            });
        });
    }

    this.getPackage = function(name) {
        return Q.Promise(function(resolve, reject) {        
            var packages = db(reject).collection('packages');

            packages.findOne({ name: name }, function(err, data) {
                if (!err) {
                    resolve(data);
                } else {
                    reject(err);
                }
            });
        });
    }

    this.getPackageVersion = function(name, version) {
        return Q.Promise(function(resolve, reject) {        
            var packages = db(reject).collection('packages');

            packages.findOne({ name: name }, function(err, data) {
                if (!err) {
                    if (data.versions) {
                        for (var packageVersion in data.versions) {
                            if (!semver.satisfies(version, packageVersion)) {
                                delete data.versions[packageVersion];
                            }
                        }                        
                    }

                    resolve(data);
                } else {
                    reject(err);
                }
            });
        });
    }
    
    this.getPackages = function(search, callback) {
        return Q.Promise(function(resolve, reject) {
            var names = new Array();

            for (var name in search) {
                names.push(name);
            }
    
            if (names.length) {
                var collection = db(reject).collection('packages');

                collection.find({ name: { $in: names } }).toArray(function(err, data) {
                    if (!err) {
                        for (var i = 0; i < data.length; i++) {
                            var package = data[i];
        
                            if (package.versions) {
                                for (var packageVersion in package.versions) {    
                                    if (!semver.satisfies(search[name].version, packageVersion)) {
                                        delete package.versions[packageVersion];
                                    } else {
                                        for (var property in package.versions[packageVersion]) {
                                            package[property] = package.versions[packageVersion][property];
                                        }
                                    }
                                }
                            }
                            
                            delete package.versions;
                        }
    
                        resolve(data);    
                    } else {
                        reject(err);
                    }
                });
            } else {
                resolve();
            }
        });
    }

    this.addPackage = function(package) {
        return Q.Promise(function(resolve, reject) {

        });
    }
    
}

module.exports = new Packages();