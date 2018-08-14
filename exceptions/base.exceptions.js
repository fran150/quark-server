// Base exception for all this application
function BaseException(message) {
    // Exception type
    this.type = 'BaseException';
    // Exception message
    this.message = message;
    // Stack trace
    this.stack = (new Error()).stack;
    // Can the exception be resolved by the user?
    this.resolvable = false;
}

BaseException.prototype = Object.create(Error.prototype);
BaseException.prototype.constructor = BaseException;

// Exception produced when an invalid value is sent by the user
function BusinessException(message) {
    BaseException.call(this, message);
    this.type = 'BusinessException';
    this.resolvable = true;
}

BusinessException.prototype = Object.create(BaseException.prototype);
BusinessException.prototype.constructor = BusinessException;

// Exception produced when a problem with the app infraestructure occurs (example: cant connect to database)
function InfrastructureException(message) {
    BaseException.call(this, message);
    this.type = 'InfrastructureException';
    this.resolvable = false;
}

InfrastructureException.prototype = Object.create(BaseException.prototype);
InfrastructureException.prototype.constructor = InfrastructureException;

module.exports = {
    "BaseException": BaseException,
    "BusinessException": BusinessException,
    "InfrastructureException": InfrastructureException
};