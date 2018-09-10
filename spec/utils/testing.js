var fs = require('fs');
var Q = require('q');

var connector = require('../../data/connector');

function TestingUtils() {
    this.resetTestDatabase = function() {
        return Q.Promise(function(resolve, reject) {
            if (connector.getEnvironment() != 'production') {
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
