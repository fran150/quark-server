var mysql = require('mysql');
var async = require('async');
var config = require('../config.json');
var semver = require('semver');

function Packages() {
    var self = this;

    var pool = mysql.createPool(config.database);

    function query(sql, data, callback) {
        pool.getConnection(function(err, connection) {
            if (err) throw err;

            connection.query(sql, data, function(err, data) {
                connection.release();
                if (err) throw err;

                callback(data);
            });
        });
    }

    this.getPackage = function(name, version, callback) {
        const sqlPackage = "SELECT * FROM package WHERE name = ?";
        const sqlPath = "SELECT name, path FROM path WHERE packageName = ? AND packageVersion = ?";
        const sqlShim = "SELECT name, dep FROM shim WHERE packageName = ? AND packageVersion = ?";

        query(sqlPackage, [name], function(packages) {
            async.filter(packages, function(package, packageCallback) {
                packageCallback(null, semver.satisfies(version, package.version));
            }, function(err, results) {
                if (results.length > 0) {
                    var package = results[0];

                    async.parallel({
                        paths: function (pathCallback) {
                            query(sqlPath, [package.name, package.version], function(data) {
                                var paths = {};
                                
                                for (var i = 0; i < data.length; i++) {
                                    paths[data[i].name] = data[i].path;
                                }
                                
                                pathCallback(null, paths);
                            });
                        },
                        shims: function (shimCallback) {
                            query(sqlShim, [package.name, package.version], function(data) {
                                var shims = {};
    
                                for (var i = 0; i < data.length; i++) {
                                    if (!shims[data[i].name]) {
                                        shims[data[i].name] = new Array();
                                    }
    
                                    shims[data[i].name].push(data[i].dep);
                                }
                                
                                shimCallback(null, shims);
                            });
                        }
                    }, function (err, results) {
                        package.paths = results.paths;
                        package.shims = results.shims;
                        callback(package);
                    });    
                } else {
                    callback({});
                }
            });
        });
    }

    this.getPackages = function(search, callback) {
        const sqlPackage = "SELECT * FROM package WHERE name IN (?)";
        const sqlPath = "SELECT name, path FROM path WHERE packageName = ? AND packageVersion = ?";
        const sqlShim = "SELECT name, dep FROM shim WHERE packageName = ? AND packageVersion = ?";

        var names = new Array();

        for (var name in search) {
            names.push(name);
        }

        query(sqlPackage, [names], function(packages) {
            async.filter(packages, function(package, packageCallback) {
                packageCallback(null, semver.satisfies(search[package.name], package.version));
            }, function(err, results) {
                if (results.length > 0) {
                    async.transform(results, {}, function(acc, package, index, detailsCallback) {
                        async.parallel({
                            paths: function (pathCallback) {
                                query(sqlPath, [package.name, package.version], function(data) {
                                    var paths = {};
                                    
                                    for (var i = 0; i < data.length; i++) {
                                        paths[data[i].name] = data[i].path;
                                    }
                                    
                                    pathCallback(null, paths);
                                });
                            },
                            shims: function (shimCallback) {
                                query(sqlShim, [package.name, package.version], function(data) {
                                    var shims = {};
        
                                    for (var i = 0; i < data.length; i++) {
                                        if (!shims[data[i].name]) {
                                            shims[data[i].name] = new Array();
                                        }
        
                                        shims[data[i].name].push(data[i].dep);
                                    }
                                    
                                    shimCallback(null, shims);
                                });
                            }
                        }, function (err, results) {
                            package.paths = results.paths;
                            package.shims = results.shims;
                            acc[package.name] = package;
                            detailsCallback(null);
                        });        
                    }, function(err, response) {
                        callback(response);
                    })
                } else {
                    callback({});
                }
            });
        });
    }
    
}

module.exports = new Packages();