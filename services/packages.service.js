var Q = require("Q");
var semver = require('semver');

var dataSource = require("../data/packages.data");

var packageExceptions = require("../exceptions/package.exceptions");

function PackagesService() {
    var self = this;

    // Returns the package filtering for the specified version
    function getPackage(name, version) {
        return Q.Promise(function(resolve, reject) {
            // Trim inputs
            name = name.trim();
            version = version.trim();
        
            // Validate package name
            if (!name) {
                reject(new packageExceptions.NameNotSpecifiedException());
            }
            
            // Validate version (if specified)
            if (version) {
                if (!semver.valid(version)) { 
                    reject(new packageExceptions.InvalidVersionException(name, version));
                }
            }
        
            // Get package from datasource
            dataSource.getPackage(name).then(function(package) {
                // Search all package versions
                for (var packageVersion in package.versions) {
                    // If the package version does not satisfies the specified version
                    if (version && !semver.satisfies(version, packageVersion)) {
                        // Delete the version from the result
                        delete package.versions[packageVersion];
                    }
                }

                resolve(package);
            });
        })
    }

    // Get package by name
    this.getPackage = function(name) {
        logger.data("Trying to find package " + name);

        return getPackage(name);
    }

    // Get package by name and filter by version
    this.getPackageVersion = function(name, version) {
        logger.data("Trying to find package [" + name + "] version [" + version + "]");

        return getPackage(name, version);
    }

    // Search packages by name version pairs
    this.searchPackages = function(search) {
        return Q.Promise(function(resolve, reject) {
            // Package names to search
            var names = new Array();

            // Validate search parameter
            if (!comp.isObject(search)) {
                reject(new packageExceptions.InvalidSearchParameterException());
            }

            var trimmedSearch = {};

            // Create a names array and validate all specified versions
            for (var name in search) {
                // Trim the name
                var trimmed = name.trim();

                // Validate package name
                if (!trimmed) {
                    reject(new packageExceptions.NameNotSpecifiedException());
                }

                // Add the name to the search array
                names.push(trimmed);

                // Trimmed search
                trimmedSearch[trimmed] = search[name];

                // Validate the package version
                var version = trimmedSearch[trimmed];

                if (!semver.valid(version)) {
                    reject(new packageExceptions.InvalidVersionException(trimmed, version));
                }
            }

            // If theres any package name to search
            if (names.length) {
                logger.data("Trying to find " + names.length + " packages");

                data.search(names).then(function(packages) {
                    if (packages) {
                        logger.data("Found " + packages.length + " packages");

                        // Foreach package found
                        for (var i = 0; i < packages.length; i++) {
                            // Get the package data and searched version
                            let thisPackage = packages[i]; 
                            let searchVersion = trimmedSearch[thisPackage.name];

                            for (var version in thisPackage.versions) {
                                // If package range satisfied specified version
                                if (!semver.satisfies(searchVersion, version)) {
                                    delete thisPackage.versions[version];
                                }
                            }
                        }
                        
                        resolve(packages);
                    } else {
                        logger.data("Packages NOT found!");
                        reject(new packageExceptions.PackagesNotFoundException(names));
                    }    
                });
            } else {
                logger.data("No specified package list to search");
                reject(new packageExceptions.InvalidSearchParameterException());
            }
        });
    }
}

module.exports = new PackagesService();