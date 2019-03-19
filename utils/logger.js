var chalk = require('chalk');

// Flag to validate if the logging is enabled or disabled
var logEnabled = true;

function Logger() {
    // If the logging is enabled write the log
    function log(text) {
        if (logEnabled) {
            console.log(text);
        }
    }

    // Enable logging (enabled by default)
    this.enableLog = function() {
        logEnabled = true;
    }
    
    // Disable logging
    this.disableLog = function() {
        logEnabled = false;
    }

    // Informative log entry
    this.info = function(text) {
        log(chalk.bold.white("[") + chalk.bold.blue(" INFO ") + chalk.bold.white("] " + text));
    }

    // Log data actions
    this.data = function(text) {
        log(chalk.bold.white("[") + chalk.bold.yellow(" DATA ") + chalk.bold.white("] " + text));
    }

    // Log an error
    this.error = function(text) {
        log(chalk.bold.white("[") + chalk.bold.red(" ERROR ") + chalk.bold.white("] " + text));
    }

    // Log a get rest verb call
    this.get = function(text) {
        log(chalk.bold.white("[") + chalk.bold.green(" GET ") + chalk.bold.white("] " + text));
    }

    // Log a post rest verb call
    this.post = function(text) {
        log(chalk.bold.white("[") + chalk.bold.magenta(" POST ") + chalk.bold.white("] " + text));
    }
}

// Export the logging functions
module.exports = Logger;