var async = require('async');
var semver = require('semver');
var Q = require('q');
const MongoClient = require('mongodb').MongoClient

var config = require('../config.json');

function Packages() {
    var self = this;

    var database;

    function db(reject) {
        if (!database) {
            reject(new Error("Disconnected from database"));
        } else {
            return database;
        }
    }

    this.connect = function() {
        return Q.Promise(function(resolve, reject) {
            console.log("Connecting: " + config.connection);

            MongoClient.connect(config.connection, function(err, client) {
                if (err) {
                    reject(new Error("Database connection error"));
                } else {                    
                    database = client.db(config.database);
                    resolve(db);
                }
            });
        });
    }

    this.getPackage = function(name) {
        return Q.Promise(function(resolve, reject) {
            console.log("Querying Package " + name);
            
            db(reject).collection('packages').find({ name: name }, function(err, result) {
                if (!err) {
                    resolve(result);
                } else {
                    reject(err);
                }
            });
        });
    }

    this.getPackages = function(search, callback) {
        return Q.Promise(function(resolve, reject) {
            var names = new Array();

            for (var name in search) {
                names.push(name);
            }
    
            if (names.length) {
    
            }
        });
    }

    this.addPackage = function(package) {
        return Q.Promise(function(resolve, reject) {

        });
    }
    
}

module.exports = new Packages();