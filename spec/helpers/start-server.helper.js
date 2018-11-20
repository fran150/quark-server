var proxyquire = require('proxyquire');

// Get express framework
var express = require("express");

// Load the mocked modules
var octokitMock = require("../mocks/octokit.mock");
var dataMock = proxyquire("../../data/packages.data", {
    "@octokit/rest": octokitMock
});

var packagesRouter = proxyquire("../../routers/package.router", {
    "../data/packages.data": dataMock
});

// Get utils
var connector = require('../../data/connector');
var logger = require("../../utils/logger");

var testing = require("../utils/testing");

// Disable logging
logger.disableLog();

// Get middlewares
var errorHandler = require("../../middlewares/error-handler.middle");

// Init express
var app = express();

// Add package router
app.use('/package', packagesRouter);

// User error handler middleware
app.use(errorHandler);

testing.startTestDb().then(function(url) {
    /*connector.connect(url).then(function() {
        app.listen(3000);
    });*/
})