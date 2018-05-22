var chalk = require('chalk');

module.exports = {
    info: function(text) {
        console.log(chalk.bold.white("[") + chalk.bold.blue(" INFO ") + chalk.bold.white("] " + text));
    },
    data: function(text) {
        console.log(chalk.bold.white("[") + chalk.bold.yellow(" DATA ") + chalk.bold.white("] " + text));
    },
    error: function(text) {
        console.log(chalk.bold.white("[") + chalk.bold.red(" ERROR ") + chalk.bold.white("] " + text));
    },
    get: function(text) {
        console.log(chalk.bold.white("[") + chalk.bold.green(" GET ") + chalk.bold.white("] " + text));
    },
    post: function(text) {
        console.log(chalk.bold.white("[") + chalk.bold.magenta(" POST ") + chalk.bold.white("] " + text));
    }
}