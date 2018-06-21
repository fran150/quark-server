var Q = require('q');
const MongoClient = require('mongodb').MongoClient

var dbExceptions = require('../exceptions/dbExceptions');
var logger = require('../utils/logger');
var config = require('../config.json');

// Connector to the MongoDB database
function Connector() {
    var database;

    this.db = function(reject) {
        if (!database) {
            logger.error("Trying to execute a database command before calling connect");
            reject(new dbExceptions.DisconnectedException());
        } else {
            return database;
        }
    }

    // Connects to the database specified in config.json using the configuration specified in connection property
    this.connect = function() {
        return Q.Promise(function(resolve, reject) {
            logger.info("Connecting to database");

            // Connect to mongodb using the specified connection and new parser
            MongoClient.connect(config.connection, { useNewUrlParser: true }, function(err, client) {
                if (err) {
                    logger.error("Database connection error");
                    reject(new dbExceptions.ConnectException(err));
                } else {
                    try {
                        database = client.db(config.database);
                        logger.info("Connected to database");
                        resolve(database);
                    } catch (ex) {
                        reject(new dbExceptions.SelectingDbException(config.database, ex));
                    }
                }
            });
        });
    }
}

module.exports = new Connector();
