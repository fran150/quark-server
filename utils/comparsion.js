var util = require('util');

function Comparsion() {
    // Check if the specified var is defined
    this.isDefined = function(variable) {
        if (typeof variable === 'undefined') {
            return false;
        };

        return true;
    }

    // Check if the specified var is a string
    this.isString = function(variable) {
        if (typeof variable === 'string' || variable instanceof String) {
            return true;
        }

        return false;
    }

    // Check if the sepcified var is an integer
    this.isInt = function(variable) {
        return Number(variable) === variable && variable % 1 === 0;
    }

    // Check if the specified var can be transformed in an integer
    this.canBeInt = function(variable) {
        return Number(variable) == variable && variable % 1 === 0;
    }

    // Check if the specified var is a number
    this.isNumeric = function(variable) {
        return (typeof variable === 'number');
    }

    // Check if the specified var is a decimal
    this.isDecimal = function(variable) {
        return variable === Number(variable) && variable % 1 !== 0;
    }

    // Check if the specified var is an array
    this.isArray = function(variable) {
        return util.isArray(variable);
    }

    // Check if the specified var is an object
    this.isObject = function(variable) {
        if (variable !== null && typeof variable === 'object' && !(variable instanceof Array)) {
            return true;
        }

        return false;
    }

    // Check if the specified var is a function
    this.isFunction = function(variable) {
        if (variable !== null && typeof variable === 'function') {
            return true;
        }

        return false;
    }

    // Check if the specified var is a date
    this.isDate = function(variable) {
        if (variable instanceof Date) {
            return true;
        }

        return false;
    }

    // Check if the specified var is a valid date
    this.isValidDate = function(variable) {
        if (!this.isDate(variable)) {
            return false;
        }

        if (isNaN(variable.getTime())) {
            return false;
        }

        return true;
    }
}

module.exports = Comparsion;