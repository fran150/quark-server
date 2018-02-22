var express = require("express");
var packagesRouter = require("./routers/packages");

var app = express();

app.use('/packages', packagesRouter);

app.listen(3000);