// Get proxyquire
var proxyquire = require('proxyquire');

// Get express framework
var express = require("express");

// Mock the octokit and mongodb
var octokitMock = require("../mocks/octokit.mock");
var connectorMock = require("../mocks/connector.mock");

// Get data layer mocks
var dataMock = proxyquire("../../data/packages.data", {
    "./connector": connectorMock
});

var githubMock = proxyquire("../../data/github.data", {
    "@octokit/rest": octokitMock
});

// Service layer mock
var serviceMock = proxyquire('../../services/packages.service', {
    "../data/packages.data": dataMock,
    "../data/github.data": githubMock
});

// Router mock
var packagesRouter = proxyquire("../../routers/package.router", {
    "../services/packages.service": serviceMock
});

// Get utils
var connector = connectorMock;
var logger = require("../../utils/logger");

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

connector.connect().then(function() {
    // Start listening on port 3000
    logger.info("Listening on port 3000");
    app.listen(3000);
}).done();
