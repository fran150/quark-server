
var bower = require('bower');
var Q = require('q');
var logger = require('./logger');

module.exports = {
    lookup: function(package) {
        return Q.Promise(function(resolve, reject) {
            logger.data("Looking up bower package " + package);

            bower.commands.lookup(package)
                .on('end', function(data) {
                    logger.data("Found bower info for " + package);
                    resolve(data);
                })
                .on('error', function(data) {
                    reject(data);
                })
        })
    }        
}
