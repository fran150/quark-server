var Q = require('q');
var mongoose = require('mongoose');

// Exceptions
var dbExceptions = require('../exceptions/db.exceptions');

// Utils
var logger = require('../utils/logger');
var config = require('../config.json');

// Connector to the database
function Connector() {
    var self = this;

    this.connect = function(url) {
        return Q.Promise(function(resolve, reject) {
            // If the database connection is not specified
            if (!url) {
                // Set the url to the one specified in config.json
                url = config.database.url;
            }
            
            logger.info("Connecting to database");

            mongoose.connect(url, function(err) {
                if (err) {
                    logger.error("Error connecting to the database");
                    reject(new dbExceptions.CantConnectToDbException(err));                        
                } else {
                    logger.info("Connected to database");
                    resolve();
                }
            });
        });
    }
}

module.exports = new Connector();
