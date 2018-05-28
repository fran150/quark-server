var url = require('url');
var path = require('path');
var async = require('async');
var semver = require('semver');
var Q = require('q');
const octokit = require('@octokit/rest')();
const MongoClient = require('mongodb').MongoClient

var logger = require('../utils/logger');
var config = require('../config.json');
var bower = require('../utils/bower');

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

    function validateCollaborator(package, token, bowerData) {
        return Q.Promise(function(resolve, reject) {
            logger.data("Authenticating token");
            
            octokit.authenticate({
                type: 'oauth',
                token: token
            });    

            Q.all([self.getPackage(package.name), bower.lookup(package.name)]).then(function(results) {
                var quarkData = results[0];
                var bowerData = results[1];

                if (!bowerData) {
                    reject("Bower package not found");                    
                    return;
                }

                var urlParts = url.parse(bowerData.url);
                var pathParts = urlParts.pathname.split('/');
                var owner = pathParts[1];

                var repo = path.basename(pathParts[2], '.git');

                logger.data("Get logged user");

                octokit.users.get({}).then(function(user) {
                    var login = user.data.login;                    

                    logger.data("Found logged user: " + login);

                    if (!quarkData) {
                        logger.data("Quark package not found. Will insert new package");
                        resolve({
                            login: login,
                            valid: true,
                            quarkData: undefined
                        });
                    } else {
                        if (quarkData.author) {
                            logger.data("Checking if user is who registered the package");

                            if (quarkData.author == login) {
                                logger.data("The specified user is who registered the package");

                                resolve({
                                    login: login,
                                    valid: true,
                                    quarkData: quarkData
                                });
                                return
                            } else {
                                logger.data("The specified user is not the owner of the package");
                            }                           
                        }

                        logger.data("Checking if user is a package's repository collaborator");

                        octokit.repos.getCollaborators({
                            login: login,
                            owner: owner,
                            repo: repo,
                        }).then(function(collabs) {
                            for (var i = 0; i <= collabs.data.length; i++) {
                                var collaborator = collabs.data[i].login;

                                if (collaborator == login) {
                                    logger.data("The specified user is a collaborator of the repository");
                                    
                                    resolve({
                                        login: login,
                                        valid: true,
                                        quarkData: quarkData
                                    });

                                    return;
                                }
                            }

                            logger.data("The specified user is NOT a collaborator of the repository");

                            resolve({
                                login: login,
                                valid: false,
                                quarkData: quarkData
                            });
                        })
                        .catch(function(error) {
                            reject(error);
                        });
                    }
                })
                .catch(function(error) {
                    reject(error);
                });                    
                
            })
            .catch(function(error) {
                reject(error);
            });
        });
    }

    this.registerPackage = function(package, token) {
        return Q.Promise(function(resolve, reject) {
            validateCollaborator(package, token).then(function(data) {
                if (data.valid) {                    
                    var collection = db(reject).collection('packages');

                    if (!data.quarkData) {
                        logger.data("Inserting specified package");

                        package.author = data.login;
                        package.created = new Date();

                        collection.insertOne(package, function(err, result) {
                            if (err) {
                                reject({ type: 'unknown', data: err });         
                            } else {
                                logger.info("Package Inserted!");
                                resolve(true);
                            }
                        });
                    } else {
                        logger.data("Updating specified package");

                        package.author = data.quarkData.author;
                        package.created = data.quarkData.created;

                        package.updated = new Date();
                        collection.replaceOne({ name: package.name }, package, function(err, result) {
                            if (err) {
                                reject({ type: 'unknown', data: err });                                
                            } else {
                                logger.info("Package Updated!");
                                resolve(true);
                            }                            
                        })
                    }
                } else {
                    reject({ type: 'login', data: "The specified user is not valid or can't edit this quark package"});
                }
            })
            .catch(function(error) {
                if (error.code && error.code >= 400 && error.code <= 499) {
                    reject({ type: 'login', data: "The specified user is not valid or can't edit this quark package" });
                } else {
                    reject({ type: 'unknown', data: error });
                }                
            })
        });
    }
    
}

module.exports = new Packages();