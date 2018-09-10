var request = require('request');

var config = require('../config.json');

var testingUtils = require('./utils/testing');

describe("Package Read Tests", function() {
    beforeAll(function(done) {
        testingUtils.resetTestDatabase()
            .then(done)
            .catch(done);
    }, config.tests.dbCleanTimeout);

    var server = 'http://localhost:3000';

    it("Must get the test package correctly", function(done) {
        request.get({ url: server + '/package/bootstrap', json: true }, function(error, response, body) {                
            // Check main body
            expect(body.name).toBe('bootstrap');
            expect(body.dateCreated).toEqual(new Date('2018-08-14 00:00:00').toISOString());
            expect(body.dateModified).toBeNull();
            expect(body.email).toBe('panchi150@gmail.com');
            
            // Check version object
            expect(body.versions).toBeDefined();                
            expect(body.versions["3.x"]).toBeDefined();

            // Check paths
            expect(body.versions["3.x"].paths['bootstrap/js']).toBe('bootstrap/dist/js/bootstrap.min.js');
            expect(body.versions["3.x"].paths['bootstrap/css']).toBe('bootstrap/dist/css/bootstrap.min.css');

            // Check shims
            expect(body.versions["3.x"].shims['bootstrap/js']).toBe('jquery');

            done();
        });
    });

    it("Must get an empty response", function(done) {
        request.get({ url: server + '/package/inexistent', json: true }, function(error, response, body) {
            expect(body).toBeUndefined();

            done();
        });
    });

    it("Must avoid query injection", function(done) {
        request.get({ url: server + "bootstrap'%20AND%20'1'='1", json: true }, function(error, response, body) {
            console.log(response);
            expect(body).toBeUndefined();

            done();
        });
    });    

    it("Must avoid throw package not specified", function(done) {
        request.get({ url: server + "%20%20", json: true }, function(error, response, body) {
            console.log(response);
            expect(body).toBeUndefined();

            done();
        });
    });    

})