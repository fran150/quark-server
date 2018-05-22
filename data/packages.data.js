var async = require('async');
var semver = require('semver');
var Q = require('q');
const MongoClient = require('mongodb').MongoClient

var logger = require('../utils/logger');
var config = require('../config.json');

function Packages() {
    var self = this;

    var database;

    function db(reject) {
        if (!database) {
            var msg = "Disconnected from database";
            logger.error(msg);
            reject(new Error(msg));
        } else {
            return database;
        }
    }

    this.connect = function() {
        return Q.Promise(function(resolve, reject) {
            logger.info("Connecting to database");

            MongoClient.connect(config.connection, function(err, client) {
                if (err) {
                    logger.error("Database connection error");
                    reject(err);
                } else {                    
                    database = client.db(config.database);

                    logger.info("Connected to database");
                    
                    resolve(database);
                }
            });
        });
    }

    this.getPackage = function(name) {
        return Q.Promise(function(resolve, reject) {        
            var packages = db(reject).collection('packages');

            logger.data("Trying to find package " + name);

            packages.findOne({ name: name }, function(err, data) {
                if (!err) {
                    if (data) {
                        logger.data("Package found!");
                    } else {
                        logger.data("Package NOT found!");
                    }                    
                    
                    resolve(data);
                } else {
                    logger.error("Error trying to find package");
                    reject(err);
                }
            });
        });
    }

    this.getPackageVersion = function(name, version) {
        return Q.Promise(function(resolve, reject) {        
            var packages = db(reject).collection('packages');

            logger.data("Trying to find package [" + name + "] version [" + version + "]");

            packages.findOne({ name: name }, function(err, data) {
                if (!err) {
                    var count = 0;

                    if (data.versions) {
                        for (var packageVersion in data.versions) {
                            try {
                                if (!semver.satisfies(version, packageVersion)) {                                    
                                    delete data.versions[packageVersion];
                                } else {
                                    count++;
                                }
                            } catch(ex) {
                                reject("Specified version is invalid");
                            }
                        }                        
                    }
                    
                    logger.data("Found a package with " + count + " statisfying versions");
                    
                    resolve(data);
                } else {
                    logger.error("Error trying to find package version");
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
                logger.data("Trying to find " + names.length + " packages");

                var collection = db(reject).collection('packages');

                collection.find({ name: { $in: names } }).toArray(function(err, data) {
                    if (!err) {
                        logger.data("Found " + data.length + " packages");

                        var count = 0;
                        
                        for (var i = 0; i < data.length; i++) {
                            var package = data[i];
        
                            if (package.versions) {
                                for (var packageVersion in package.versions) {    
                                    try {
                                        if (!semver.satisfies(search[package.name].version, packageVersion)) {
                                            delete package.versions[packageVersion];
                                        } else {
                                            count++;

                                            for (var property in package.versions[packageVersion]) {
                                                package[property] = package.versions[packageVersion][property];
                                            }
                                        }    
                                    } catch(ex) {
                                        reject("Specified version [" + search[package.name].version + "] for " + package.name + " is invalid");
                                    }
                                }
                            }
                            
                            delete package.versions;
                        }

                        logger.data("Found " + count + " satisfying versions");
    
                        resolve(data);    
                    } else {
                        reject(err);
                    }
                });
            } else {
                logger.data("No specified package list to search");
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