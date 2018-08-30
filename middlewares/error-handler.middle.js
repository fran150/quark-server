var logger = require("../utils/logger");

function AppErrorHandler(err, req, res, next) { 
    if (err.name === 'JsonSchemaValidation') {
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
        // Set internal server error
        res.status(500);
        // Log the error
        logger.error(err);
   
        // Take into account the content type if your app serves various content types
        res.json(err);
    }
}

module.exports = AppErrorHandler;