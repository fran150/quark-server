// Express 
var express = require('express');
var router = express.Router();

// Middlewares
var JsonSchema = require('express-jsonschema');
var TokenValidator = require('../middlewares/token-validator.middle');

// Business layer
var PackageService = require('../services/packages.service');

// Schemas
var PackageRequestSchema = require('../schemas/package-request.json');
var PackageSchema = require('../schemas/package.json');
var VersionSchema = require('../schemas/version.json');

// Exceptions
var packageExceptions = require('../exceptions/package.exceptions');

function PackageRouter(logger) {
    router.use(express.json());

    router.get('/:name', function(req, res, next) {
        logger.get("/package/" + req.params.name);
    
        service.getPackage(req.params.name).then(function(package) {
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
    
        service.getPackageVersion(req.params.name, req.params.version).then(function(package) {
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
    
        service.searchPackages(req.body).then(function(list) {
            res.json(list);
        })
        .catch(next);    
    });
    
    router.post('', validate({ body: PackageSchema }, [VersionSchema]), validateToken, function(req, res, next) {
        logger.post("/package");
    
        service.registerPackage(req.body, req.header("token")).then(function(result) {
            res.json(result);
        })
        .catch(next);
    });

    return router;
}


module.exports = PackageRouter;