// Express 
var express = require('express');
var router = express.Router();

// Middlewares
var validate = require('express-jsonschema').validate;
var validateToken = require('../middlewares/token-validator.middle');

// Data layer
var data = require('../data/packages.data');

var logger = require('../utils/logger');

// Schemas
var PackageRequestSchema = require('../schemas/package-request.json');
var PackageSchema = require('../schemas/package.json');
var VersionSchema = require('../schemas/version.json');

// Exceptions
var packageExceptions = require('../exceptions/package.exceptions');

router.use(express.json());

router.get('/:name', function(req, res, next) {
    logger.get("/package/" + req.params.name);

    data.getPackage(req.params.name).then(function(package) {
        if (package) {
            res.json(package);
        } else {
            throw new packageExceptions.PackageNotFoundException(req.params.name);
        }
    })
    .catch(next);
});

router.get('/:name/:version', function(req, res, next) {
    logger.get("/package/" + req.params.name + "/" + req.params.version);

    data.getPackageVersion(req.params.name, req.params.version).then(function(package) {
        if (package) {
            res.json(package);
        } else {
            throw new packageExceptions.PackageNotFoundException(req.params.name);
        }
    })
    .catch(next);
});

router.post('/search', validate({ body: PackageRequestSchema }), function(req, res, next) {
    logger.post("/package/search");

    data.searchPackages(req.body).then(function(list) {
        res.json(list);
    })
    .catch(next);    
});

router.post('', validate({ body: PackageSchema }, [VersionSchema]), validateToken, function(req, res, next) {
    logger.post("/package");

    data.registerPackage(req.body, req.header("token")).then(function(result) {
        res.json(result);
    })
    .catch(next);
});

module.exports = router;