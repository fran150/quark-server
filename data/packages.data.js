// Get libraries
var url = require('url');
var path = require('path');

var Q = require('q');

const octokit = require('@octokit/rest')();

// Get exceptions
var baseExceptions = require('../exceptions/base.exceptions');
var dbExceptions = require('../exceptions/db.exceptions');
var packageExceptions = require('../exceptions/package.exceptions');
var authExceptions = require('../exceptions/auth.exceptions');

// Get utilities
var logger = require('../utils/logger');
var connector = require('./connector');
var comp = require('../utils/comparsion');

function Packages() {
    var self = this;

    // Gets a package and version data
    this.getPackage = function(name) {
        return Q.Promise(function(resolve, reject) {
            // Get the package from the collection
            connector.db().collection('packages').findOne({ name: name }).then(function(package) {
                // If a package is found
                if (package) {
                    logger.data("Package found!");

                    // Escape all found versions
                    if (package.versions) {
                        for (var packageVersion in package.versions) {                            
                            unescapeKey(package, packageVersion);
                        }
                    }

                    resolve(package);
                } else {
                    logger.data("Package NOT found!");
                    resolve();
                }
            })
            .catch(function(err) {
                reject(new dbExceptions.QueryingDbException(err));
            });
        });
    }
    
    // Search packages by name and version
    this.searchPackages = function(names) {
        return Q.Promise(function(resolve, reject) {
            connector.db().collection('packages').find({ name: { $in: names } }).toArray(function(err, packages) {
                if (err) {
                    reject(new dbExceptions.QueryingDbException(err));
                    return;
                }

                // If packages are found
                if (packages) {
                    // Foreach package found
                    for (var i = 0; i < packages.length; i++) {
                        // Get the package data and searched version
                        let thisPackage = packages[i]; 

                        if (thisPackage.versions) {
                            for (var version in thisPackage.versions) {
                                // Unescape version
                                unescapeKey(thisPackage, version);
                            }    
                        }
                    }                                                            
                }

                resolve(packages);
            })                
        });
    }

    // Escapes . with @ in version key of the specified package and version
    function escapeKey(package, version) {
        if (package && package.versions && package.versions[version]) {
            package.versions[version.replace(".", "@")] = package.versions[version];
            delete package.versions[version];
        }
    }

    // Unescapes @ with . in version key of the specified package and version    
    function unescapeKey(package, version) {
        if (package && package.versions && package.versions[version]) {
            var newVersion = version.replace("@", ".");

            package.versions[newVersion] = package.versions[version];
            delete package.versions[version];

            return newVersion;
        }
    }

    // Inserts a package on the database
    this.insertPackage = function(package) {
        return Q.Promise(function(resolve, reject) {
            // Iterate over all versions in the package
            for (var version in package.versions) {
                escapeKey(package, version);
            }
    
            // Insert the new package
            connector.db().collection('packages').insertOne(package)
                .then(resolve)
                .catch(reject);    
        });
    }

    // Updates the specified package
    this.updatePackage = function(package) {
        return Q.Promise(function(resolve, reject) {
            // Iterate over all versions in the package
            for (var version in package.versions) {
                escapeKey(package, version);
            }

            // Upsert the package            
            connector.db().collection('packages').updateOne(package, {
                $set: {
                    name: package.name
                }
            }, { upsert: true })
                .then(resolve)
                .catch(reject);    
        });
    }
}

module.exports = new Packages();