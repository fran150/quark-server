var request = require('request');

var config = require('../config.json');

var testingUtils = require('./utils/testing');

var bootstrapPackage = {
    name: "bootstrap",
    email: "panchi150@gmail.com",
    versions: {
        "1.x": {
            paths: {
                "test": "test"
            },
            shims: {
                "test": ["jquery"]
            }
        },
        "2.x": {
            paths: {
                'bootstrap/css': 'bootstrap/css/bootstrap.min',
                'bootstrap/js': 'bootstrap/js/bootstrap.min'
            },
            shims: {
                "bootstrap/js": ["jquery"]
            }
        },
        "3.x": {
            paths: {
                'bootstrap/css': 'bootstrap/dist/css/bootstrap.min',
                'bootstrap/js': 'bootstrap/dist/js/bootstrap.min'
            },
            shims: {
                "bootstrap/js": ["jquery"]
            }
        }
    }
};


describe("Package Read Tests", function() {
    beforeAll(function(done) {
        testingUtils.resetTestDatabase()
            .then(done)
            .catch(done);
    }, config.test.dbCleanTimeout);

    var server = 'http://localhost:3000';

    it("Must update the bootstrap package correctly", function(done) {

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: bootstrapPackage, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(200);

            request.get({ url: server + '/package/bootstrap', json: true }, function(error, response, body) {
                expect(response.statusCode).toBe(200);
                
                // Check main body
                expect(body.name).toBe('bootstrap');
                expect(body.dateCreated).toEqual(new Date('2018-08-14 00:00:00').toISOString());
                expect(body.dateModified).not.toBeNull();
                expect(body.email).toBe('panchi150@gmail.com');
                
                // Check version object
                expect(body.versions).toBeDefined();                
                expect(body.versions["1.x"]).toBeDefined();
                expect(body.versions["2.x"]).toBeDefined();
                expect(body.versions["3.x"]).toBeDefined();

                // Check paths
                expect(body.versions["1.x"].paths['test']).toBe('test');
                expect(body.versions["2.x"].paths['bootstrap/js']).toBe('bootstrap/js/bootstrap.min');
                expect(body.versions["2.x"].paths['bootstrap/css']).toBe('bootstrap/css/bootstrap.min');
                expect(body.versions["3.x"].paths['bootstrap/js']).toBe('bootstrap/dist/js/bootstrap.min');
                expect(body.versions["3.x"].paths['bootstrap/css']).toBe('bootstrap/dist/css/bootstrap.min');

                // Check shims
                expect(body.versions["1.x"].shims['test']).toBe('jquery');
                expect(body.versions["2.x"].shims['bootstrap/js']).toBe('jquery');
                expect(body.versions["3.x"].shims['bootstrap/js']).toBe('jquery');

                done();
            })
        });
    });
})