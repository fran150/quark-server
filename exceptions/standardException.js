
function StandardException(message) {
    this.type = 'StandardException';
    this.message = message;
    this.stack = (new Error()).stack;
}

StandardException.prototype = new Error;

module.exports = StandardException;