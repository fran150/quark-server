var mysql = require('mysql');
var async = require('async');
var config = require('../config.json');

function Packages() {
    var self = this;

    var pool = mysql.createPool(config.database);

    this.query = function(sql, data, callback) {
        pool.getConnection(function(err, connection) {
            if (err) throw err;

            connection.query(sql, data, function(err, data) {
                connection.release();
                if (err) throw err;

                callback(data);
            });
        });
    }

    this.getPackage = function(name, callback) {
        const sqlPackage = "SELECT * FROM package WHERE name = ?";
        const sqlPath = "SELECT * FROM path WHERE packageName = ?";
        const sqlShim = "SELECT * FROM shim WHERE packageName = ?";

        self.query(sqlPackage, [name], function(packages) {
            async.each(packages, function(package, packageCallback) {
                async.parallel({
                    paths: function (pathCallback) {
                        self.query(sqlPath, [package.name, package.version], function(data) {
                            pathCallback(null, data);
                        });
                    },
                    shims: function (shimCallback) {
                        self.query(sqlShim, [package.name, package.version], function(data) {
                            shimCallback(null, data);
                        });
                    }
                }, function (err, results) {
                    package.paths = results.paths;
                    package.shims = results.shims;
                    packageCallback();
                });
            }, function(err) {
                callback(packages);
            })
        });
    }
}

module.exports = new Packages();