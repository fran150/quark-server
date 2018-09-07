// Get libraries
var url = require('url');
var path = require('path');

var Q = require('q');
var semver = require('semver');
const octokit = require('@octokit/rest')();

// Get exceptions
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
            
            // Get the package data
            const sql = "SELECT * FROM package WHERE name = ?";
            connector.query(sql, [name]).then(function(data) {
                // If a package is found
                if (data && data.result.length) {
                    logger.data("Package found!");

                    // Get the package info from the db result
                    var package = data.result[0];

                    // Get the paths for the package
                    const sqlPath = "SELECT * FROM path WHERE packageName = ?";
                    var pathPromise = connector.query(sqlPath, [package.name]).then(function(data) {
                        // Get paths info from the results
                        var paths = data.result;

                        // For each found path
                        for (var i = 0; i < paths.length; i++) {
                            // Get path data and version
                            var path = paths[i];
                            var packageVersion = path.packageVersion;

                            // If the package version satisfies the specified version
                            if (!version || semver.satisfies(version, packageVersion)) {
                                // If package version not exists create it
                                if (!package.versions) {
                                    package.versions = {};
                                } 

                                // if package version property is not defined create it
                                if (!package.versions[packageVersion]) {
                                    package.versions[packageVersion] = {}
                                }

                                // if path property does not exists create it
                                if (!package.versions[packageVersion].paths) {
                                    package.versions[packageVersion].paths = {}
                                }

                                // Add the path to the version data
                                package.versions[packageVersion].paths[path.name] = path.path;
                            }
                        }
                    })
                    .catch(function(err) {
                        reject(new dbExceptions.QueryingDbException(err));
                    });

                    // Get the shims of the package
                    const sqlShim = "SELECT * FROM shim WHERE packageName = ?";
                    var shimPromise = connector.query(sqlShim, [package.name]).then(function(data) {
                        // Get shims info from the results
                        var shims = data.result;

                        // For each shim found
                        for (var i = 0; i < shims.length; i++) {
                            // Get shim data and version
                            var shim = shims[i];
                            var packageVersion = shim.packageVersion;

                            // If the package version satisfies the specified version
                            if (!version || semver.satisfies(version, packageVersion)) {                                
                                // If package version not exists create it
                                if (!package.versions) {
                                    package.versions = {};
                                } 

                                // if package version property is not defined create it
                                if (!package.versions[packageVersion]) {
                                    package.versions[packageVersion] = {}
                                }

                                // if shim property does not exists create it
                                if (!package.versions[packageVersion].shims) {
                                    package.versions[packageVersion].shims = {}
                                }

                                // Add the shim to the version data
                                package.versions[packageVersion].shims[shim.name] = shim.dep;
                            }
                        }
                    })
                    .catch(function(err) {
                        reject(new dbExceptions.QueryingDbException(err));
                    });

                    // Wait for object to be complete and return
                    Q.all([pathPromise, shimPromise]).then(function() {
                        resolve(package);
                    });
                } else {
                    logger.data("Package NOT found!");
                    resolve();
                }
            })
            .catch(function(err) {
                reject(new dbExceptions.QueryingDbException(err));
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
    
    // Search packages by name and version
    this.searchPackages = function(search, callback) {
        return Q.Promise(function(resolve, reject) {
            // Package names to search
            var names = new Array();

            // Validate search parameter
            if (!comp.isObject(search)) {
                reject(new packageExceptions.InvalidSearchParameterException());
            }

            // Create a names array and validate all specified versions
            for (var name in search) {
                // Validate package name
                if (!name) {
                    reject(new packageExceptions.NameNotSpecifiedException());
                }

                // Add the name to the search array
                names.push(name);

                // Validate the package version
                var version = search[name];                
                if (!semver.valid(version)) {
                    reject(new packageExceptions.InvalidVersionException(name, version));
                }
            }
    
            // If theres any package name to search
            if (names.length) {
                logger.data("Trying to find " + names.length + " packages");

                // Get the specified packages
                const sql = "SELECT * FROM package WHERE name IN (?)";                
                connector.query(sql, [names]).then(function(data) {
                    // If packages are found
                    if (data && data.result.length) {
                        var packages = data.result;

                        logger.data("Found " + packages.length + " packages");

                        const sqlPath = "SELECT * FROM path WHERE packageName = ?";
                        const sqlShim = "SELECT * FROM shim WHERE packageName = ?";

                        // Initialize a promises array
                        var promises = new Array();

                        // Foreach package found
                        for (var i = 0; i < packages.length; i++) {
                            // Get the package data and searched version
                            let thisPackage = packages[i]; 
                            let version = search[thisPackage.name];

                            // Initialize package paths and shims
                            thisPackage.paths = {};
                            thisPackage.shims = {};
    
                            // Get the paths of the package
                            let pathPromise = connector.query(sqlPath, [thisPackage.name]).then(function(data) {
                                let paths = data.result;
        
                                // For each path found
                                for (let j = 0; j < paths.length; j++) {
                                    // Get path data and version
                                    let path = paths[j];
                                    let packageVersion = path.packageVersion;
        
                                    // If package range satisfied specified version
                                    if (semver.satisfies(version, packageVersion)) {
                                        // Add the path to the version data
                                        thisPackage.paths[path.name] = path.path;
                                    }
                                }
                            })
                            .catch(function(err) {
                                reject(err);
                            });
                
                            // Get the shims of the package
                            let shimPromise = connector.query(sqlShim, [thisPackage.name]).then(function(data) {
                                let shims = data.result;
        
                                // For each shim found
                                for (let j = 0; j < shims.length; j++) {
                                    // Get shim data and version
                                    let shim = shims[j];
                                    let packageVersion = shim.packageVersion;
        
                                    // If package range satisfied specified version
                                    if (semver.satisfies(version, packageVersion)) {
                                        // Add the shim to the version data
                                        thisPackage.shims[shim.name] = shim.dep;
                                    }
                                }
                            })
                            .catch(function(err) {
                                reject(err);
                            });

                            // Add the promises to the array
                            promises.push(pathPromise);
                            promises.push(shimPromise);
                        }
    
                        // Wait for all promises to complete then return the package
                        Q.all(promises).then(function() {
                            logger.data("Found packages!");
                            resolve(packages);
                        })
                        .catch(function(err) {
                            reject(err);
                        })
                    } else {
                        logger.data("Packages NOT found!");
                        resolve();
                    }
                })
                .catch(function(err) {
                    reject(err);
                })                
            } else {
                logger.data("No specified package list to search");
                resolve();
            }
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

                    logger.data("Found logged user: " + login);

                    // If there's is no quark data on the db
                    if (!quarkData) {
                        logger.data("Quark package not found. Will insert new package");

                        // Returns login data, valid user and no quark data
                        resolve({
                            login: login,
                            valid: true,
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
                                    valid: true,
                                    quarkData: quarkData
                                });

                                return
                            } else {
                                logger.data("The specified user is not the owner of the package");
                            }
                        }

                        logger.data("Checking if user is a package's repository collaborator");

                        // If user is not the author of the package check if its a collaborator on github repo
                        octokit.repos.getCollaborators({
                            login: login,
                            owner: owner,
                            repo: repo,
                        }).then(function(collabs) {
                            // Validate response
                            if (!collabs || !collabs.data || !comp.isArray(collabs.data)) {
                                reject(new authExceptions.CantGetCollaboratorsException("No collaborators data"));
                            }

                            // Iterate over the found collaborators
                            for (var i = 0; i <= collabs.data.length; i++) {
                                var collaborator = collabs.data[i].login;

                                // If the logged user is a collaborator in the github repo
                                if (collaborator == login) {
                                    logger.data("The specified user is a collaborator of the repository");
                                    
                                    // Return the user data, valid flag and quark data
                                    resolve({
                                        login: login,
                                        valid: true,
                                        quarkData: quarkData
                                    });

                                    return;
                                }
                            }

                            logger.data("The specified user is NOT a collaborator of the repository");

                            // Return the user data and package data, but valid user flag set to false
                            resolve({
                                login: login,
                                valid: false,
                                quarkData: quarkData
                            });
                        })
                        .catch(function(error) {
                            reject(new authExceptions.CantGetCollaboratorsException(error));
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

    function insertPackagePathAndShim(package, connection) {
        return Q.Promise(function(resolve, reject) {
            // Create a promises array for all the paths and shims inserts
            var promises = new Array();

            // Queries for inserting path and shims
            const sqlPath = "INSERT INTO path VALUES (?,?,?,?)";
            const sqlShim = "INSERT INTO shim VALUES (?,?,?,?)";

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

                if (currentVersion.paths) {
                    // Iterate over all paths in package versions
                    for (var pathName in currentVersion.paths) {
                        var path = currentVersion.paths[pathName];

                        // Insert the path and store the promise on the array
                        var pathPromise = connector.query(sqlPath, [package.name, version, pathName, path], connection)
                            .catch(function(err) {
                                reject(new dbExceptions.QueryingDbException(err));
                            });

                        promises.push(pathPromise);
                    }
                }

                if (currentVersion.shims) {
                    // Iterate over all shims in package versions
                    for (var shimName in currentVersion.shims) {
                        var shim = currentVersion.shims[shimName];
                        
                        // Insert the shim and store the promise on the array
                        var shimPromise = connector.query(sqlShim, [package.name, version, shimName, shim], connection)
                            .catch(function(err) {
                                reject(new dbExceptions.QueryingDbException(err));
                            });

                        promises.push(shimPromise);
                    }
                }
            }

            // Wait for all paths and shims to be inserted
            Q.all(promises).then(function() {
                logger.info("Package path and shims Inserted!");
                resolve(package);
            })
            .catch(reject);
        })
    }

    // Deletes all paths and shims of the specified package
    function deletePackagePathAndShim(package, connection) {
        return Q.Promise(function(resolve, reject) {
            // Path and shim delete queries
            const sqlPath = "DELETE FROM path WHERE packageName = ?";
            const sqlShim = "DELETE FROM shim WHERE packageName = ?";

            // Execute both queries and get the promises
            var pathPromise = connector.query(sqlPath, [package.name], connection)
                .catch(reject);
            var shimPromise = connector.query(sqlShim, [package.name], connection)
                .catch(reject);

            // Wait for both promises to execute
            Q.all([pathPromise, shimPromise]).then(resolve)
                .catch(reject);
        })
    }

    // Inserts a package on the database
    function insertPackage(package, collabData) {
        return connector.transaction(function(connection, resolve, reject) {
            logger.data("Inserting specified package");
            
            // Set the package author and creation date
            package.author = collabData.login;
            package.dateCreated = new Date();

            // Package insert query
            const sql = "INSERT INTO package VALUES (?,?,?,?,?)";

            // Execute the insert, and then insert the paths and shims
            connector.query(sql, [package.name, package.dateCreated, null, package.author, package.email], connection).then(function() {
                insertPackagePathAndShim(package, connection).then(resolve)
                .catch(reject);
            })
            .catch(reject);
        });
    }

    // Updates the specified package
    function updatePackage(package, collabData) {
        return connector.transaction(function(connection, resolve, reject) {
            logger.data("Updating package");

            // Set the package modification date
            package.dateModified = new Date();

            // If the logged user is not the package author set the package author
            // to the original author
            if (collabData.quarkData.author != collabData.login) {
                package.author = collabData.quarkData.author;
            }

            // Update package query
            const sql = "UPDATE package SET dateModified = ?, author = ?, email = ? WHERE name = ?";

            // Execute the update query, then delete all the existing path and shims and insert the new ones
            connector.query(sql, [package.dateModified, package.author, package.email, package.name], connection).then(function() {
                deletePackagePathAndShim(package, connection).then(function() {
                    insertPackagePathAndShim(package, connection).then(resolve)
                    .catch(reject);
                })
                .catch(reject);
            })
            .catch(reject);
        });
    }

    // Registers the package inserting or updating the data on the db
    this.registerPackage = function(package, token) {
        return Q.Promise(function(resolve, reject) {
            // Validate if the user is the package author or a github repo collaborator
            validateCollaborator(package, token).then(function(data) {
                // If its a valid user
                if (data.valid) {
                    // If data not exists for this package then insert, if exists update the package
                    if (!data.quarkData) {
                        insertPackage(package, data).then(resolve)
                        .catch(function(error) {
                            reject(new packageExceptions.ErrorRegisteringPackageException("inserting", error))
                        });
                    } else {
                        updatePackage(package, data).then(resolve)
                        .catch(function(error) {
                            reject(new packageExceptions.ErrorRegisteringPackageException("updating", error))
                        });
                    }
                } else {
                    reject(new packageExceptions.ErrorRegisteringPackageException("login", error));
                }
            })
            .catch(function(error) {
                if (error.code && error.code >= 400 && error.code <= 499) {
                    reject(new packageExceptions.ErrorRegisteringPackageException("login", error));
                } else {
                    reject(new packageExceptions.ErrorRegisteringPackageException("github", error));
                }                
            })
        });
    }
}

module.exports = new Packages();