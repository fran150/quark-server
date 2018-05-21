var express = require("express");
var chalk = require("chalk");

var packagesRouter = require("./routers/package.router");
var data = require('./data/packages.data');

var app = express();

app.use('/package', packagesRouter);

data.connect().then(function() {
    console.log(chalk.green.bold("Listening on port 3000"));
    app.listen(3000);
})
.catch(function (error) {
    throw new Error(error);
})
.done();