var express = require("express");

var packagesRouter = require("./routers/package.router");
var data = require('./data/packages.data');

var logger = require("./utils/logger");

var app = express();

app.use('/package', packagesRouter);

data.connect().then(function() {
    logger.info("Listening on port 3000");
    app.listen(3000);
})
.catch(function (error) {
    logger.error(error);
    throw new Error(error);
})
.done();