// Express 
var express = require('express');
var router = express.Router();

// Schema validator
var validate = require('express-jsonschema').validate;
var schemaValidator = require('../middlewares/schema-validator');

// Data layer
var data = require('../data/packages.data');

var logger = require('../utils/logger');

// Schemas
var PackageRequestSchema = require('../schemas/package-request.json');
var PackageSchema = require('../schemas/package.json');
var VersionSchema = require('../schemas/version.json');

router.use(express.json());

router.get('/:name', function(req, res, next) {
    logger.get("/package/" + req.params.name);

    data.getPackage(req.params.name).then(function(package) {
        res.json(package);
    });
});

router.get('/:name/:version', function(req, res, next) {
    logger.get("/package/" + req.params.name + "/" + req.params.version);

    data.getPackageVersion(req.params.name, req.params.version).then(function(package) {
        res.json(package);
    })
    .catch(function(error) {        
        logger.error(error);
        res.status(500);
        res.json(error);
    })
});

router.post('/search', validate({ body: PackageRequestSchema }), function(req, res, next) {
    logger.post("/package/search");

    data.getPackages(req.body).then(function(list) {
        res.json(list);
    })
    .catch(function(error) {        
        logger.error(error);
        res.status(500);
        res.json(error);
    })    
});

router.post('', validate({ body: PackageSchema }, [VersionSchema]), function(req, res, next) {
    logger.post("/package");

    if (!req.header("token")) {
        logger.error("Token not specified");
        res.status(401);
        res.json("Access token not specified");
    } else {
        data.registerPackage(req.body, req.header("token")).then(function(result) {
            res.json(result);
        })
        .catch(function(error) {
            if (error.data) {
                logger.error(error.data);
            } else {
                logger.error(error);
            }

            if (error.type && error.type == "login") {
                res.status(401);
            } else {
                res.status(500);
            }

            res.json(error);                    
        })
    }
});

router.use(schemaValidator);

module.exports = router;