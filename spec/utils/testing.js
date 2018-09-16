var fs = require('fs');
var Q = require('q');

var connector = require('../../data/connector');

// Read arguments
var argv = require('minimist')(process.argv.slice(2));
var env = argv["_"] || "develop";

var config = require('../../config.json');

function TestingUtils() {
    this.getDbCleanTimeout = function() {
        return config[env].dbCleanTimeout;
    }

    this.resetTestDatabase = function() {
        return Q.Promise(function(resolve, reject) {
            if (env != 'production') {
                fs.readFile('./database/quark-database.sql', 'utf8', function(err, dbCreation) {
                    if (!err) {
                        fs.readFile('./database/test-cases.sql', 'utf8', function(err, testCases) {
                            if (!err) {
                                var sql = dbCreation + "\r\n" + testCases;

                                connector.query(sql, {}).then(function(result) { 
                                    resolve(result);
                                })
                                .catch(function(err) {
                                    reject(err);
                                })
                            } else {
                                reject(err);
                            }
                        })
                    } else {
                        reject(err);
                    }
                });
            } else {
                reject(new Error('Connector is set to the production environment'));
            }    
        });
    }
    
}

module.exports = new TestingUtils();
