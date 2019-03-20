// Get proxyquire
var proxyquire = require('proxyquire');

// Mock the octokit and mongodb libraries
var octokitMock = require("../mocks/octokit.mock");
var connectorMock = require("../mocks/connector.mock");

// Get the data layer packages with mocked connectors
var dataSource = proxyquire("../../data/packages.data", {
    "./connector": connectorMock
});

var githubSource = proxyquire("../../data/github.data", {
    "@octokit/rest": octokitMock
});

// Get services layer
var service = proxyquire('../../services/packages.service', {
    "../data/packages.data": dataSource,
    "../data/github.data": githubSource
});

// Get the routers
var packagesRouter = proxyquire("../../routers/package.router", {
    "../services/packages.service": service
});

// Disable logging
var logger = require("../../utils/logger");
logger.disableLog();

// Load main app
proxyquire('../../app', {
    './data/connector': connectorMock,
    "./routers/package.router": packagesRouter
})