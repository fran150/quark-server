var url = require('url');
var path = require('path');
var semver = require('semver');
var Q = require('q');
const octokit = require('@octokit/rest')();

var logger = require('../utils/logger');
var connector = require('./connector');
var bower = require('../utils/bower');

function Packages() {
    var self = this;

    this.getPackage = function(name) {
        return Q.Promise(function(resolve, reject) {
            logger.data("Trying to find package " + name);
            
            var sql = "SELECT * FROM package WHERE name = ?";

            // Get the package data
            connector.query(sql, [name]).then(function(data) {
                // If a package is found
                if (data && data.result.length) {
                    logger.data("Package found!");

                    var packages = data.result;

                    // Initialize package paths and shims
                    var package = packages[0];                    
                    package.path = {};
                    package.shim = {};

                    var sqlPath = "SELECT * FROM path WHERE packageName = ?";

                    // Get the paths of the package
                    var pathPromise = connector.query(sqlPath, [package.name]).then(function(data) {
                        var paths = data.result;

                        // For each found path
                        for (var i = 0; i < paths.length; i++) {
                            // Get path data and version
                            var path = paths[i];
                            var version = path.packageVersion;

                            // If package version not exists create it
                            if (!package.path[version]) {
                                package.path[version] = {};
                            } 

                            // Add the path to the version data
                            package.path[version][path.name] = path.path;
                        }
                    });

                    var sqlShim = "SELECT * FROM shim WHERE packageName = ?";

                    // Get the shims of the package
                    var shimPromise = connector.query(sqlShim, [package.name]).then(function(data) {
                        var shims = data.result;

                        // For each shim found
                        for (var i = 0; i < shims.length; i++) {
                            // Get shim data and version
                            var shim = shims[i];
                            var version = shim.packageVersion;

                            // If package version not exists create it
                            if (!package.shim[version]) {
                                package.shim[version] = {};
                            } 

                            // Add the shim to the version data
                            package.shim[version][shim.name] = shim.dep;
                        }
                    });

                    Q.all([pathPromise, shimPromise]).then(function() {
                        resolve(package);
                    })
                    .catch(function(err) {
                        reject(new dbExceptions.QueryingDbException(err));
                    });
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

    this.getPackageVersion = function(name, version) {
        return Q.Promise(function(resolve, reject) {        
            logger.data("Trying to find package [" + name + "] version [" + version + "]");

            var sql = "SELECT * FROM package WHERE name = ?";

            // Get the package data
            connector.query(sql, [name]).then(function(data) {
                // If a package is found
                if (data && data.result.length) {
                    var packages = data.result;

                    // Initialize package paths and shims
                    var package = packages[0];                    
                    package.path = {};
                    package.shim = {};

                    var sqlPath = "SELECT * FROM path WHERE packageName = ?";

                    // Get the paths of the package
                    var pathPromise = connector.query(sqlPath, [package.name]).then(function(data) {
                        var paths = data.result;

                        // For each found path
                        for (var i = 0; i < paths.length; i++) {
                            // Get path data and version
                            var path = paths[i];
                            var packageVersion = path.packageVersion;

                            // If package version not exists create it
                            if (semver.satisfies(version, packageVersion)) {
                                if (!package.path[packageVersion]) {
                                    package.path[packageVersion] = {};
                                } 
    
                                // Add the path to the version data
                                package.path[packageVersion][path.name] = path.path;
                            }
                        }
                    });

                    var sqlShim = "SELECT * FROM shim WHERE packageName = ?";

                    // Get the shims of the package
                    var shimPromise = connector.query(sqlShim, [package.name]).then(function(data) {
                        var shims = data.result;

                        // For each shim found
                        for (var i = 0; i < shims.length; i++) {
                            // Get shim data and version
                            var shim = shims[i];
                            var packageVersion = shim.packageVersion;

                            if (semver.satisfies(version, packageVersion)) {
                                // If package version not exists create it
                                if (!package.shim[packageVersion]) {
                                    package.shim[packageVersion] = {};
                                } 

                                // Add the shim to the version data
                                package.shim[packageVersion][shim.name] = shim.dep;
                            }
                        }
                    });                    

                    Q.all([pathPromise, shimPromise]).then(function() {
                        logger.data("Found a package!");
                        resolve(package);
                    })
                    .catch(function(err) {
                        reject(new dbExceptions.QueryingDbException(err));
                    });
                } else {
                    logger.data("Package NOT found!");
                    resolve();
                }
            })
            .catch(function(err) {
                reject(new dbExceptions.QueryingDbException(err));
            })
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

                var sql = "SELECT * FROM package WHERE name IN (?)";

                connector.query(sql, [names]).then(function(data) {
                    // If a packages are found
                    if (data && data.result.length) {
                        var promises = new Array();

                        for (var i = 0; i < data.result.length; i++) {
                            // Initialize package paths and shims
                            var package = data.result[i]; 
                            var version = search[package.name];

                            package.path = {};
                            package.shim = {};

                            var sqlPath = "SELECT * FROM path WHERE packageName = ?";
    
                            // Get the paths of the package
                            var pathPromise = connector.query(sqlPath, [package.name]).then(function(data) {
                                var paths = data.result;
        
                                // For each found path
                                for (var j = 0; j < paths.length; j++) {
                                    // Get path data and version
                                    var path = paths[j];
                                    var packageVersion = path.packageVersion;
        
                                    // If package version not exists create it
                                    if (semver.satisfies(version, packageVersion)) {
                                        // Add the path to the version data
                                        package.path[path.name] = path.path;
                                    }
                                }
                            });
        
                            var sqlShim = "SELECT * FROM shim WHERE packageName = ?";
        
                            // Get the shims of the package
                            var shimPromise = connector.query(sqlShim, [package.name]).then(function(data) {
                                var shims = data.result;
        
                                // For each shim found
                                for (var j = 0; j < shims.length; j++) {
                                    // Get shim data and version
                                    var shim = shims[j];
                                    var packageVersion = shim.packageVersion;
        
                                    if (semver.satisfies(version, packageVersion)) {
                                        // Add the shim to the version data
                                        package.shim[shim.name] = shim.dep;
                                    }
                                }
                            });
                            
                            // Add the promises to the array
                            promises.push(pathPromise);
                            promises.push(shimPromise);
                        }
    
    
                        Q.all(promises).then(function() {
                            logger.data("Found some packages!");
                            resolve(package);
                        })
                        .catch(function(err) {
                            reject(new dbExceptions.QueryingDbException(err));
                        });
                    } else {
                        logger.data("Packages NOT found!");
                        resolve();
                    }
                })
                .catch(function(err) {
                    reject(new dbExceptions.QueryingDbException(err));
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