// Express 
var express = require('express');
var router = express.Router();
var chalk = require('chalk');

// Schema validator
var validate = require('express-jsonschema').validate;
var schemaValidator = require('../middlewares/schema-validator');

// Data layer
var data = require('../data/packages.data');

// Schemas
var PackageRequestSchema = require('../schemas/package-request.json');
var PackageSchema = require('../schemas/package.json');
var VersionSchema = require('../schemas/version.json');

router.use(express.json());

router.get('/:name', function(req, res, next) {
    console.log(chalk.bold.green("GET") + " "+ chalk.white("package/" + req.params.name));

    data.getPackage(req.params.name).then(function(package) {
        res.json(package);
    });
});

router.get('/:name/:version', function(req, res, next) {
    console.log(chalk.bold.green("GET") + " "+ chalk.white("package/" + req.params.name + "/" + req.params.version));

    data.getPackageVersion(req.params.name, req.params.version).then(function(package) {
        res.json(package);
        next();        
    });    
});

router.post('/', validate({ body: PackageRequestSchema }), function(req, res, next) {
    console.log(chalk.bold.blue("POST") + " "+ chalk.white("package"));

    data.getPackages(req.body).then(function(list) {
        res.json(list);
        next();
    });
});

router.post('', validate({body: PackageSchema}, [VersionSchema]), function(req, res, next) {
    res.json(req.body);
});

router.use(schemaValidator);

module.exports = router;