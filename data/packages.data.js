// Get libraries
var url = require('url');
var path = require('path');

var Q = require('q');
var semver = require('semver');
const octokit = require('@octokit/rest')();

// Get exceptions
var dbExceptions = require('../exceptions/db.exceptions');
var packageExceptions = require('../exceptions/package.exceptions');

// Get utilities
var logger = require('../utils/logger');
var connector = require('./connector');
var bower = require('../utils/bower');

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
                    reject(new packageExceptions.InvalidVersionException(version));
                }
            }
            
            // Get the package data
            var sql = "SELECT * FROM package WHERE name = ?";
            connector.query(sql, [name]).then(function(data) {
                // If a package is found
                if (data && data.result.length) {
                    logger.data("Package found!");

                    // Get the package info from the db result
                    var package = data.result[0];

                    // Get the paths for the package
                    var sqlPath = "SELECT * FROM path WHERE packageName = ?";
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
                    var sqlShim = "SELECT * FROM shim WHERE packageName = ?";
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

    this.getPackage = function(name) {
        logger.data("Trying to find package " + name);

        return getPackage(name);
    }

    this.getPackageVersion = function(name, version) {
        logger.data("Trying to find package [" + name + "] version [" + version + "]");

        return getPackage(name, version);
    }
    
    this.searchPackages = function(search, callback) {
        return Q.Promise(function(resolve, reject) {
            // Package names to search
            var names = new Array();

            // Create a names array and validate all specified versions
            for (var name in search) {
                // Add the name to the search array
                names.push(name);

                // Validate the package version
                var version = search[name];
                if (!semver.valid(version)) {
                    reject(new packageExceptions.InvalidVersionException(version));
                }
            }
    
            // If theres any package name to search
            if (names.length) {
                logger.data("Trying to find " + names.length + " packages");

                // Get the specified packages
                var sql = "SELECT * FROM package WHERE name IN (?)";                
                connector.query(sql, [names]).then(function(data) {
                    // If packages are found
                    if (data && data.result.length) {
                        var packages = data.result;

                        logger.data("Found " + packages.length + " packages");

                        var sqlPath = "SELECT * FROM path WHERE packageName = ?";
                        var sqlShim = "SELECT * FROM shim WHERE packageName = ?";

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
                            logger.data("Found some packages!");
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

    function insertPackage(package, collabData) {
        return Q.Promise(function(resolve, reject) {
            // Gets a connection from the pool
            connector.getConnection().then(function(connection) {

                /// Initiate transaction
                connection.beginTransaction(function(err) {
                    if (!err) {
                        logger.data("Inserting specified package");
        
                        package.author = collabData.login;
                        package.dateCreated = new Date();
        
                        var sql = "INSERT INTO package VALUES (?,?,?,?,?)";

                        connector.query(sql, [package.name, package.dateCreated, null, package.author, package.email], connection).then(function(result) {
                            var promises = new Array();

                            var sqlPath = "INSERT INTO path VALUES (?,?,?,?)";
                            var sqlShim = "INSERT INTO shim VALUES (?,?,?,?)";

                            for (var version in package.versions) {
                                for (var pathName in package.versions[version].paths) {
                                    var path = package.versions[version].paths[pathName];
                                    var pathPromise = connector.query(sqlPath, [package.name, version, pathName, path], connection);
                                    
                                    promises.push(pathPromise);
                                }

                                for (var shimName in package.versions[version].shims) {
                                    var shim = package.versions[version].shims[shimName];
                                    var shimPromise = connector.query(sqlShim, [package.name, version, shimName, shim], connection);

                                    promises.push(shimPromise);
                                }
                            }

                            Q.all(promises).then(function(results) {
                                connection.commit(function(err) {
                                    if (!err) {
                                        logger.info("Package Inserted!");

                                        resolve(true);
                                    } else {
                                        connection.rollback(function(terr) {
                                            if (!terr) {
                                                reject(terr);
                                            } else {
                                                reject(err);
                                            }
                                        });
                                    }
                                });
                            })
                            .catch(function(err) {
                                connection.rollback(function(terr) {
                                    if (!terr) {
                                        reject(terr);
                                    } else {
                                        reject(err);
                                    }
                                });    
                            })
                        })
                        .catch(function(err) {
                            console.log(err);
                            connection.rollback(function(terr) {
                                if (!terr) {
                                    reject(terr);
                                } else {
                                    reject(err);
                                }
                            });
                        })    
                    } else {
                        reject(err);
                    }
                });    
            })
            .catch(function(err) {
                reject(err);
            })
        })
    }

    this.registerPackage = function(package, token) {
        return Q.Promise(function(resolve, reject) {
            validateCollaborator(package, token).then(function(data) {
                if (data.valid) {                    
                    if (!data.quarkData) {
                        insertPackage(package, data).then(function() {
                            resolve(true);
                        })
                        .catch(function(err) {
                            reject(err);
                        });
                    } else {

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