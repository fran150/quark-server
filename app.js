var express = require("express");

var packagesRouter = require("./routers/package.router");
var connector = require('./data/connector');
var logger = require("./utils/logger");

var app = express();

app.use('/package', packagesRouter);

connector.createConnectionPool();

logger.info("Listening on port 3000");
app.listen(3000);