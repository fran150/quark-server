var Q = require('q');
var mysql = require('mysql');

// Exceptions
var dbExceptions = require('../exceptions/db.exceptions');

// Utils
var logger = require('../utils/logger');
var config = require('../config.json');

// Read arguments
var argv = require('minimist')(process.argv.slice(2));

// Connector to the database
function Connector() {
    var self = this;
    
    // Application pool
    var pool;

    this.transaction = function(process) {
        return Q.Promise(function(resolve, reject) {
            self.getConnection().then(function(conn) {
                process(conn, function(result) {               
                    // Commit the transaction
                    conn.commit(function(commitError) {  
                        logger.data("Commit transaction");
    
                        if (!commitError) {
                            // If theres no error commiting, commit the process
                            resolve(result);
                            conn.release();
                        } else {
                            // If theres an error commiting, rollback the process
                            logger.data("Rollingback transaction");
                            conn.rollback(function(rollbackError) {
                                if (!rollbackError) {
                                    reject(commitError);
                                    conn.release();
                                } else {
                                    reject(rollbackError);
                                    conn.release();
                                }
                            });                
                        }
                    })
                }, function(err) {
                    logger.data("Rollback transaction");
    
                    conn.rollback(function(rollbackError) {
                        if (!rollbackError) {
                            reject(err);
                            conn.release();
                        } else {
                            reject(rollbackError);
                            conn.release();
                        }
                    });
                });
    
            })
            .catch(reject);            
        });
    }

    // Get a connection to database from the pool
    this.getConnection = function(connection) {
        return Q.Promise(function(resolve, reject) {
            if (connection) {
                resolve(connection);
            } else {
                logger.data("Getting connection from the pool");

                // Check if pool is created
                if (!pool) {
                    reject(new dbExceptions.ConnectionPoolNotCreatedException());
                }
    
                // Try get a connection from the pool
                pool.getConnection(function(err, connection) {
                    if (err) {
                        logger.error("Error getting connection from database pool");
                        reject(new dbExceptions.ErrorGettingConnection(err));
                    } else {
                        resolve(connection);
                    }
                });    
            }            
        });
    }

    // Execute the specified query
    this.query = function(query, params, connection) {
        return Q.Promise(function(resolve, reject) {
            // Get a connection to query
            self.getConnection(connection).then(function(con) {
                // Execute specified query
                con.query(query, params, function(err, result, fields) {
                    logger.data("Executing query " + this.sql);

                    // If the connection is not specified manually
                    if (!connection) {
                        // Release connection
                        con.release();
                    }

                    if (err) {
                        // If error reject the promise
                        reject(err)
                    } else {
                        // Return the result and fields
                        resolve({
                            result: result,
                            fields: fields
                        });
                    }
                });
            })
            .catch(function(err) {
                // On get connection error elevate rejection
                reject(err);
            });
        });
    }

    // Create a connection pool
    this.createConnectionPool = function(environment) {
        try {
            // Create a connection pool with the specified config and save to the variable
            logger.info("Create database connection pool");

            var env;

            if (!environment) {
                env = argv["_"] || "develop";
            } else {
                env = environment;
            }

            pool = mysql.createPool(config[env].database);
        } catch(ex) {
            logger.error("Error creating database connection pool");
            throw new dbExceptions.CreateConnectionPoolException(ex);
        }
    }
}

module.exports = new Connector();
