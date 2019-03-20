var Q = require('q');

// Exceptions
var dbExceptions = require('../../exceptions/db.exceptions');

// Utils
var logger = require('../../utils/logger');

var data = {
    clone: function() {
        return JSON.parse(JSON.stringify(this));
    },
    bootstrap: {
        name: "bootstrap",
        dateCreated: new Date('2018-08-14 00:00:00').toISOString(),
        dateModified: null,
        author: "fran150",
        email: "panchi150@gmail.com",
        versions: {
            "2@x": {
                paths: {
                    "bootstrap/js": "bootstrap/js/bootstrap.min",
                    "bootstrap/css": "bootstrap/css/bootstrap.min"
                },
                shims: {
                    "bootstrap/js": ["jquery"]
                }
            },
            "3@x": {
                paths: {
                    "bootstrap/js": "bootstrap/dist/js/bootstrap.min",
                    "bootstrap/css": "bootstrap/dist/css/bootstrap.min"
                },
                shims: {
                    "bootstrap/js": ["jquery"]
                }
            }                
        }
    },
    "qk-alchemy": {
        name: "qk-alchemy",
        dateCreated: new Date(2018, 8, 14, 0, 0, 0),
        dateModified: null,
        author: "fran150",
        email: "panchi150@gmail.com",
        versions: {
            "1@x": {
                paths: {
                    "qk-alchemy": "qk-alchemy"
                }
            }
        }
    },
    "qk-bootstrap": {
        name: "qk-bootstrap",
        dateCreated: new Date(2018, 8, 14, 0, 0, 0),
        dateModified: null,
        author: "fran150",
        email: "panchi150@gmail.com",
        versions: {
            "1@x": {
                paths: {
                    "qk-bootstrap": "qk-bootstrap"
                }
            }
        }
    }
}


// Connector to the database
function Connector() {
    var db = {
        collection: function(name) {
            return {
                find: function(query) {
                    var result = new Array();
                    var names = query.name["$in"];

                    var packages = data.clone();

                    for (var i = 0; i < names.length; i++) {
                        if (packages[names[i]]) {
                            result.push(packages[names[i]]);
                        }
                    }

                    return {
                        toArray: function(callback) {
                            callback(false, result);
                        }
                    }
                },
                findOne: function(query) {
                    return Q.Promise(function(resolve, reject) {
                        var packages = data.clone();
                        resolve(packages[query.name]);
                    });
                },
                insertOne: function(package) {
                    packages[package.name] = package;
                },
                updateOne: function() {
                    packages[package.name] = package;
                }
            }
        }
    }

    this.connect = function(url) {
        return Q.Promise(function(resolve, reject) {
            logger.info("Connecting to database");

            if (url == "err") {
                logger.error("Error connecting to the database");
                reject(new dbExceptions.CantConnectToDbException(err));
            } else {
                logger.info("Connected to database");                    

                resolve(db);
            }
        });
    }

    this.db = function() {
        if (!db) {
            reject(new dbExceptions.CantConnectToDbException());
        } else {
            return db;
        }
    }
}

module.exports = new Connector();
