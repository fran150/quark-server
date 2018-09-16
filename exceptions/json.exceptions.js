var BaseExceptions = require("./base.exceptions");

function JsonValidationException(validations) {
    BaseExceptions.BusinessException.call(this);
    this.type = 'JsonValidationException';
    this.message = "An error ocurred while trying to read the package";
    this.validations = validations;
}

JsonValidationException.prototype = Object.create(BaseExceptions.BusinessException.prototype);
JsonValidationException.prototype.constructor = JsonValidationException;

module.exports = {
    "JsonValidationException": JsonValidationException
};