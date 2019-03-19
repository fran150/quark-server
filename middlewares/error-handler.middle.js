var BaseExceptions = require("../exceptions/base.exceptions");
var AuthExceptions = require("../exceptions/auth.exceptions");
var JsonExceptions = require('../exceptions/json.exceptions');

function AppErrorHandler(logger, arguments) {
    return function (err, req, res, next) { 
        if (err instanceof BaseExceptions.BaseException) {
            if (err instanceof AuthExceptions.LoginException) {
                // Set Unauthorized
                res.status(401);
            } else if (err instanceof AuthExceptions.AuthException) {
                // Set forbidden
                res.status(403);
            } else {
                // Set internal server error
                res.status(500);
            }

            if (err.stack && arguments["_"] == "production") {
                delete err.stack;
            }

            // Log the error
            logger.error(err);
    
            // Take into account the content type if your app serves various content types
            res.json(err);
        } else if (err.name === 'JsonSchemaValidation') {
            // Log the error
            logger.error(err.message);
    
            // Set a bad request http response status
            res.status(400);
    
            // Take into account the content type if your app serves various content types
            res.json(new JsonExceptions.JsonValidationException(err.validations));
        } else {
            // pass error to next error middleware handler
            next(err);
        }
    }
}

module.exports = AppErrorHandler;