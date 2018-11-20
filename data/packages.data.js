// Get libraries
var url = require('url');
var path = require('path');

var Q = require('q');
var semver = require('semver');
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
    function getPackage(name, version) {
        return Q.Promise(function(resolve, reject) {
            name = name.trim();
            
            // Validate package name
            if (!name) {
                reject(new packageExceptions.NameNotSpecifiedException());
            }
            
            // Validate version (if specified)
            if (version) {
                if (!semver.valid(version)) { 
                    reject(new packageExceptions.InvalidVersionException(name, version));
                }
            }

            // Get the package from the collection
            connector.db().collection('packages').findOne({ name: name }).then(function(package) {
                // If a package is found
                if (package) {
                    logger.data("Package found!");

                    if (package.versions) {
                        for (var packageVersion in package.versions) {                            
                            packageVersion = unescapeKey(package, packageVersion);
                                                    
                            // If the package version does not satisfies the specified version
                            if (version && !semver.satisfies(version, packageVersion)) {
                                // Delete the version from the result
                                delete package.versions[packageVersion];
                            }
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

    // Get package by name
    this.getPackage = function(name) {
        logger.data("Trying to find package " + name);

        return getPackage(name);
    }

    // Get package by name and filter by version
    this.getPackageVersion = function(name, version) {
        logger.data("Trying to find package [" + name + "] version [" + version + "]");

        return getPackage(name, version);
    }
    
    // Search packages by name and version
    this.searchPackages = function(search) {
        return Q.Promise(function(resolve, reject) {
            // Package names to search
            var names = new Array();

            // Validate search parameter
            if (!comp.isObject(search)) {
                reject(new packageExceptions.InvalidSearchParameterException());
            }

            var trimmedSearch = {};

            // Create a names array and validate all specified versions
            for (var name in search) {
                // Trim the name
                var trimmed = name.trim();

                // Validate package name
                if (!trimmed) {
                    reject(new packageExceptions.NameNotSpecifiedException());
                }

                // Add the name to the search array
                names.push(trimmed);

                // Trimmed search
                trimmedSearch[trimmed] = search[name];

                // Validate the package version
                var version = trimmedSearch[trimmed];

                if (!semver.valid(version)) {
                    reject(new packageExceptions.InvalidVersionException(trimmed, version));
                }
            }
    
            // If theres any package name to search
            if (names.length) {
                logger.data("Trying to find " + names.length + " packages");

                connector.db().collection('packages').find({ name: { $in: names } }).toArray(function(err, packages) {
                    if (err) {
                        reject(new dbExceptions.QueryingDbException(err));
                        return;
                    }

                    // If packages are found
                    if (packages) {
                        logger.data("Found " + packages.length + " packages");

                        // Foreach package found
                        for (var i = 0; i < packages.length; i++) {
                            // Get the package data and searched version
                            let thisPackage = packages[i]; 
                            let searchVersion = trimmedSearch[thisPackage.name];

                            for (var version in thisPackage.versions) {
                                // Unescape version
                                version = unescapeKey(thisPackage, version);

                                // If package range satisfied specified version
                                if (!semver.satisfies(searchVersion, version)) {
                                    delete thisPackage.versions[version];
                                }
                            }
                        }
                        
                        resolve(packages);                    
                    } else {
                        logger.data("Packages NOT found!");
                        reject(new packageExceptions.PackagesNotFoundException(names));
                    }
                })                
            } else {
                logger.data("No specified package list to search");
                reject(new packageExceptions.InvalidSearchParameterException());
            }
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

    // Validate if the user is the package owner or a collaborator
    function validateCollaborator(package, token) {
        return Q.Promise(function(resolve, reject) {
            logger.data("Authenticating token");
            
            // Sets the authentication method for future requests
            octokit.authenticate({
                type: 'oauth',
                token: token
            });

            // Wait for package info and do a bower lookup
            Q.all([self.getPackage(package.name), bower.lookup(package.name)]).then(function(results) {
                var quarkData = results[0];
                var bowerData = results[1];

                // If not bower data found
                if (!bowerData) {
                    reject(new packageExceptions.PackageNotFoundInBowerException());                    
                    return;
                }

                // Parse the found url in bower (http://github.com/<owner>/<repo>)
                var urlParts = url.parse(bowerData.url);
                var pathParts = urlParts.pathname.split('/');
                
                // Get the owner and repo from the url
                var owner = pathParts[1];
                var repo = path.basename(pathParts[2], '.git');

                logger.data("Get logged user and repository");

                // Get the user's data
                octokit.users.get({}).then(function(user) {
                    var login = user.data.login;
                    
                    if (!user || !user.data || !user.data.login) {
                        reject(new packageExceptions.GetUserDataException());
                    }

                    logger.data("Found logged user: " + login);

                    // If there's is no quark data on the db
                    if (!quarkData) {
                        logger.data("Quark package not found. Will insert new package");

                        // Returns login data, valid user and no quark data
                        resolve({
                            login: login,
                            quarkData: undefined
                        });
                    } else {
                        // If the package is already on the db, check the author
                        if (quarkData.author) {
                            logger.data("Checking if user is who registered the package");

                            // If the author is the logged user
                            if (quarkData.author == login) {
                                logger.data("The specified user is who registered the package");

                                // Returns login data, valid user and quark data
                                resolve({
                                    login: login,
                                    quarkData: quarkData
                                });

                                return
                            } else {
                                logger.data("The specified user is not the owner of the package");
                            }
                        }

                        // If the login is the user of the github repo
                        if (login == owner) {
                            logger.data("The specified user is the owner of the github repo");

                            resolve({
                                login: login,
                                quarkData: quarkData
                            });

                            return
                        }

                        logger.data("Checking if user is a package's repository collaborator");

                        // If user is not the author of the package or the repo check if its a collaborator
                        octokit.repos.getCollaborators({
                            login: login,
                            owner: owner,
                            repo: repo
                        }).then(function(collabs) {
                            // Validate response
                            if (!collabs || !collabs.data || !comp.isArray(collabs.data)) {
                                reject(new authExceptions.CantGetCollaboratorsException("No collaborators data"));
                            }

                            // Iterate over the found collaborators
                            for (var i = 0; i < collabs.data.length; i++) {
                                var collaborator = collabs.data[i].login;

                                // If the logged user is a collaborator in the github repo
                                if (collaborator == login) {
                                    logger.data("The specified user is a collaborator of the repository");
                                    
                                    // Return the user data, valid flag and quark data
                                    resolve({
                                        login: login,
                                        quarkData: quarkData
                                    });

                                    return;
                                }
                            }

                            logger.data("The specified user is NOT a collaborator of the repository");

                            // Return the user data and package data, but valid user flag set to false
                            reject(new authExceptions.UserUnauthorizedException(login));
                        })
                        .catch(function(error) {
                            // If can't get the collborators because of user throw unauthorized
                            if (error.code == 403) {
                                reject(new authExceptions.UserUnauthorizedException(login));
                            } else {
                                reject(new authExceptions.CantGetCollaboratorsException(error));
                            }
                            
                        });
                    }
                })
                .catch(function(error) {
                    reject(new authExceptions.GetUserDataException(error));
                });                    
                
            })
            .catch(function(error) {
                reject(error);
            });
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