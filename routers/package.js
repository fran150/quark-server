var express = require('express');
var router = express.Router();

var validate = require('express-jsonschema').validate;
var schemaValidator = require('../middlewares/schema-validator');

var data = require('../data/packages');

var PackageRequestSchema = require('../schemas/package-request.json');
var PackageSchema = require('../schemas/package.json');
var VersionSchema = require('../schemas/version.json');

router.use(express.json());

router.get('/:name', function(req, res, next) {
    data.getPackage(req.params.name).then(function(package) {
        res.json(package);
    });
});

router.post('/search', validate({ body: PackageRequestSchema }), function(req, res, next) {
    console.log(req.body);
});

router.post('', validate({body: PackageSchema}, [VersionSchema]), function(req, res, next) {
    res.json(req.body);
});

router.use(schemaValidator);

module.exports = router;