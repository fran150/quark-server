var express = require('express');
var router = express.Router();

var dataPackages = require('../data/packages');

router.use(express.json());

router.get('/:name', function(req, res, next) {
    dataPackages.getPackage(req.params.name, function(packages) {
        res.json(packages);
    });    
});

module.exports = router;