var chalk = require('chalk');

// Flag to validate if the logging is enabled or disabled
var logEnabled = true;

// If the logging is enabled write the log
function log(text) {
    if (logEnabled) {
        console.log(text);
    }
}

// Export the logging functions
module.exports = {
    // Enable logging (enabled by default)
    enableLog: function() {
        logEnabled = true;
    },
    
    // Disable logging
    disableLog: function() {
        logEnabled = false;
    },

    // Informative log entry
    info: function(text) {
        log(chalk.bold.white("[") + chalk.bold.blue(" INFO ") + chalk.bold.white("] " + text));
    },

    // Log data actions
    data: function(text) {
        log(chalk.bold.white("[") + chalk.bold.yellow(" DATA ") + chalk.bold.white("] " + text));
    },

    // Log an error
    error: function(text) {
        log(chalk.bold.white("[") + chalk.bold.red(" ERROR ") + chalk.bold.white("] " + text));
    },

    // Log a get rest verb call
    get: function(text) {
        log(chalk.bold.white("[") + chalk.bold.green(" GET ") + chalk.bold.white("] " + text));
    },

    // Log a post rest verb call
    post: function(text) {
        log(chalk.bold.white("[") + chalk.bold.magenta(" POST ") + chalk.bold.white("] " + text));
    }
}