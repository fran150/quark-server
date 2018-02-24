var express = require('express');
var router = express.Router();

var dataPackages = require('../data/packages');

router.use(express.json());

router.get('/:name/:version', function(req, res, next) {
    dataPackages.getPackage(req.params.name, req.params.version, function(packages) {
        res.json(packages);
    });    
});

module.exports = router;