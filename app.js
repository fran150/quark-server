var express = require("express");
var packagesRouter = require("./routers/package");

var app = express();

app.use('/package', packagesRouter);

app.listen(3000);