// Get express framework
var express = require("express");

// Get routers
var packagesRouter = require("./routers/package.router");

// Get utils
var connector = require('./data/connector');
var logger = require("./utils/logger");

// Get middlewares
var errorHandler = require("./middlewares/error-handler.middle");

// Init express
var app = express();

// Add package router
app.use('/package', packagesRouter);

// User error handler middleware
app.use(errorHandler);

// Create connection pool
connector.connect().then(function() {
    // Start listening on port 3000
    logger.info("Listening on port 3000");
    app.listen(3000);
}).done();

