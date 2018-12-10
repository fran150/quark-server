var Q = require('q');

// Exceptions
var dbExceptions = require('../../exceptions/db.exceptions');

// Utils
var logger = require('../../utils/logger');

// Connector to the database
function Connector() {
    var packages = {
        bootstrap: {
            name: "bootstrap",
            dateCreated: new Date(2018, 8, 14, 0, 0, 0),
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
                        "bootstrap/js": "bootstrap/js/bootstrap.min",
                        "bootstrap/css": "bootstrap/css/bootstrap.min"
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

    var db = {
        collection: function(name) {
            return {
                find: function(query) {
                    var result = new Array();
                    var names = query.names["$in"];

                    for (var i = 0; i < names.length; i++) {
                        result.push(packages[names[i]]);
                    }

                    return result;
                },
                findOne: function(query) {
                    return packages[query.name];
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
