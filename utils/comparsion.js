var util = require('util');

module.exports = {
    // Check if the specified var is defined
    isDefined: function (variable) {
        if (typeof variable === 'undefined') {
            return false;
        };

        return true;
    },

    // Check if the specified var is a string
    isString: function (variable) {
        if (typeof variable === 'string' || variable instanceof String) {
            return true;
        }

        return false;
    },

    // Check if the sepcified var is an integer
    isInt: function (variable) {
        return Number(variable) === variable && variable % 1 === 0;
    },

    // Check if the specified var can be transformed in an integer
    canBeInt: function(variable) {
        return Number(variable) == variable && variable % 1 === 0;
    },

    // Check if the specified var is a number
    isNumeric: function (variable) {
        return (typeof variable === 'number');
    },

    // Check if the specified var is a decimal
    isDecimal: function (variable) {
        return variable === Number(variable) && variable % 1 !== 0;
    },

    // Check if the specified var is an array
    isArray: function (variable) {
        return util.isArray(variable);
    },

    // Check if the specified var is an object
    isObject: function (variable) {
        if (variable !== null && typeof variable === 'object' && !(variable instanceof Array)) {
            return true;
        }

        return false;
    },

    // Check if the specified var is a function
    isFunction: function (variable) {
        if (variable !== null && typeof variable === 'function') {
            return true;
        }

        return false;
    },

    // Check if the specified var is a date
    isDate: function(variable) {
        if (variable instanceof Date) {
            return true;
        }

        return false;
    },

    // Check if the specified var is a valid date
    isValidDate: function (variable) {
        if (!this.isDate(variable)) {
            return false;
        }

        if (isNaN(variable.getTime())) {
            return false;
        }

        return true;
    }
}