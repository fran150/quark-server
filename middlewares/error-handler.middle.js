var logger = require("../utils/logger");
var BaseExceptions = require("../exceptions/base.exceptions");
var AuthExceptions = require("../exceptions/auth.exceptions");

function AppErrorHandler(err, req, res, next) { 
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

        // Log the error
        logger.error(err);
   
        // Take into account the content type if your app serves various content types
        res.json(err);
    } else if (err.name === 'JsonSchemaValidation') {
        var responseData;

        // Log the error
        logger.error(err.message);
 
        // Set a bad request http response status or whatever you want
        res.status(400);
 
        // Format the response body however you want
        responseData = {
           statusText: 'Bad Request',
           jsonSchemaValidation: true,
           validations: err.validations  // All of your validation information
        };
 
        // Take into account the content type if your app serves various content types
        res.json(responseData);
    } else {
        // pass error to next error middleware handler
        next(err);
    }
}

module.exports = AppErrorHandler;