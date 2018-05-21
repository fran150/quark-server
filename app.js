var express = require("express");
var packagesRouter = require("./routers/package.router");
var data = require('./data/packages.data');

var app = express();

app.use('/package', packagesRouter);

data.connect().then(function() {
    console.log("Listening on port 3000");
    app.listen(3000);
}).catch(function (error) {
    throw error; 
});