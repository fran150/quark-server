var Q = require("Q");
var semver = require('semver');
var bower = require('../utils/bower');

var dataSource = require("../data/packages.data");
var githubDataSource = require("../data/github.data");

var packageExceptions = require("../exceptions/package.exceptions");

function PackagesService() {
    var self = this;

    // Returns the package filtering for the specified version
    function getPackage(name, version) {
        return Q.Promise(function(resolve, reject) {
            // Trim inputs
            name = name.trim();
            version = version.trim();
        
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
        
            // Get package from datasource
            dataSource.getPackage(name).then(function(package) {
                // Search all package versions
                for (var packageVersion in package.versions) {
                    // If the package version does not satisfies the specified version
                    if (version && !semver.satisfies(version, packageVersion)) {
                        // Delete the version from the result
                        delete package.versions[packageVersion];
                    }
                }

                resolve(package);
            });
        })
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

    // Search packages by name version pairs
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

                data.search(names).then(function(packages) {
                    if (packages) {
                        logger.data("Found " + packages.length + " packages");

                        // Foreach package found
                        for (var i = 0; i < packages.length; i++) {
                            // Get the package data and searched version
                            let thisPackage = packages[i]; 
                            let searchVersion = trimmedSearch[thisPackage.name];

                            for (var version in thisPackage.versions) {
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
                });
            } else {
                logger.data("No specified package list to search");
                reject(new packageExceptions.InvalidSearchParameterException());
            }
        });
    }

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

    function validateCollaborator(package, token) {
        logger.data("Authenticating token");

        // Wait for package info and a bower lookup
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
        
            githubDataSource.getUser(token).then(function(user) {
                var login = user.data.login;

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

                    githubDataSource.getCollaborators(token, login, owner, repo).then(function(collabs) {
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
                    .then(reject);
                }
            })
            .then(reject);
        })
        .then(reject);    
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
            }
    
            dataSource.insertPackage(package).then(resolve)
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
            }

            dataSource.updatePackage(package).then(resolve)
                .catch(reject);
        });
    }
}

module.exports = new PackagesService();