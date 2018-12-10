var Q = require('q');

const MongoClient = require('mongodb').MongoClient;

// Exceptions
var dbExceptions = require('../exceptions/db.exceptions');

// Utils
var logger = require('../utils/logger');
var config = require('../config.json');

// Connector to the database
function Connector() {
    var self = this;

    var client;
    var db;

    this.connect = function(url) {
        return Q.Promise(function(resolve, reject) {
            // If the database connection is not specified
            if (!url) {
                // Set the url to the one specified in config.json
                url = config.database.url;
            }
            
            logger.info("Connecting to database");

            client = new MongoClient(url);

            client.connect(function(err) {
                if (err) {
                    logger.error("Error connecting to the database");
                    reject(new dbExceptions.CantConnectToDbException(err));
                } else {
                    logger.info("Connected to database");
                    
                    db = client.db(config.database.name);                

                    resolve(db);
                }
            });
        });
    }

    this.db = function() {
        if (!db) {
            throw new dbExceptions.CantConnectToDbException();
        } else {
            return db;
        }
    }
}

module.exports = new Connector();
