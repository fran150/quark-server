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
var bower = require('../utils/bower');
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

    // Registers the package inserting or updating the data on the db
    this.registerPackage = function(package, token) {
        return Q.Promise(function(resolve, reject) {
            // Validate if the user is the package author or a github repo collaborator
            validateCollaborator(package, token).then(function(data) {
                // If data not exists for this package then insert, if exists update the package
                if (!data.quarkData) {
                    insertPackage(package, data).then(resolve)
                    .catch(reject);
                } else {
                    updatePackage(package, data).then(resolve)
                    .catch(reject);
                }
            })
            .catch(reject);
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
    function insertPackage(package, collabData) {
        return Q.Promise(function(resolve, reject) {
            logger.data("Inserting specified package");
        
            // Set the package author and creation date
            package.name = package.name.trim();
            package.author = collabData.login;
            package.dateCreated = new Date();

            // Validate versions property
            if (!comp.isObject(package.versions)) {
                reject(new packageExceptions.ErrorInPackageFormatException("versions"));
                return;
            }

            // Iterate over all versions in the package
            for (var version in package.versions) {
                var currentVersion = package.versions[version];

                // Validate version object to have paths and shim pairs
                if (!comp.isObject(currentVersion.paths) && !comp.isObject(currentVersion.shims)) {
                    reject(new packageExceptions.ErrorInPackageFormatException("versions." + version));
                }

                escapeKey(package, version);
            }
    
            // Insert the new package
            connector.db().collection('packages').insertOne(package)
                .then(resolve)
                .catch(reject);    
        });
    }

    // Updates the specified package
    function updatePackage(package, collabData) {
        return Q.Promise(function(resolve, reject) {
            logger.data("Updating package");

            // Trim the package name
            package.name = package.name.trim();

            // Set the author as the login user if not specified in the package config
            if (!package.author) {
                package.author = collabData.login;
            }

            // Set the package modification date
            package.dateModified = new Date();            

            // If the logged user is not the package author set the package author and email
            // to the original author
            // Only the original author can change the author and login of a package registration
            if (collabData.quarkData.author != collabData.login) {
                package.author = collabData.quarkData.author;
                package.email = collabData.quarkData.email;
            }

            // Iterate over all versions in the package
            for (var version in package.versions) {
                var currentVersion = package.versions[version];

                // Validate version object to have paths and shim pairs
                if (!comp.isObject(currentVersion.paths) && !comp.isObject(currentVersion.shims)) {
                    reject(new packageExceptions.ErrorInPackageFormatException("versions." + version));
                }

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