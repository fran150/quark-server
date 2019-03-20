var request = require('request');

describe("Package Read Tests", function() {
    var server = 'http://127.0.0.1:3000';

    function validateTestPackage(expect, response, body, done) {
        // Check status code
        expect(response.statusCode).toBe(200);

        // Check main body
        expect(body.name).toBe('bootstrap');
        expect(body.dateCreated).toEqual(new Date('2018-08-14 00:00:00').toISOString());
        expect(body.dateModified).toBeNull();
        expect(body.email).toBe('panchi150@gmail.com');
        
        // Check version object
        expect(body.versions).toBeDefined();                
        expect(body.versions["2.x"]).toBeDefined();
        expect(body.versions["3.x"]).toBeDefined();

        // Check paths
        expect(body.versions["2.x"].paths['bootstrap/js']).toBe('bootstrap/js/bootstrap.min');
        expect(body.versions["2.x"].paths['bootstrap/css']).toBe('bootstrap/css/bootstrap.min');
        expect(body.versions["3.x"].paths['bootstrap/js']).toBe('bootstrap/dist/js/bootstrap.min');
        expect(body.versions["3.x"].paths['bootstrap/css']).toBe('bootstrap/dist/css/bootstrap.min');

        // Check shims
        expect(body.versions["3.x"].shims['bootstrap/js']).toEqual(['jquery']);

        done();
    }

    it("Must get the test package correctly", function(done) {
        request.get({ url: server + '/package/bootstrap', json: true, proxy: "" }, function(error, response, body) {                            
            validateTestPackage(expect, response, body, done);
        });
    });
/*
    it("Must get the test package correctly trimming the package name", function(done) {
        request.get({ url: server + '/package/%20%20bootstrap%20', json: true }, function(error, response, body) {                            
            validateTestPackage(expect, response, body, done);
        });
    });

    it("Must fail indicating package not found", function(done) {
        request.get({ url: server + '/package/inexistent', json: true }, function(error, response, body) {
            // Check the status code
            expect(response.statusCode).toBe(500);

            // Check error type
            expect(body.type).toBe("PackageNotFoundException");

            done();
        });
    });

    it("Must fail indicating package not found avoiding query injection", function(done) {
        request.get({ url: server + "/package/bootstrap'%20AND%20'1'='1", json: true }, function(error, response, body) {
            // Check the status code
            expect(response.statusCode).toBe(500);

            // Check the error type
            expect(body.type).toBe("PackageNotFoundException");

            done();
        });
    });    

    it("Must fail indicating package name not specified", function(done) {
        request.get({ url: server + "/package/%20%20", json: true }, function(error, response, body) {
            // Check status code
            expect(response.statusCode).toBe(500);
            
            // Check the error type
            expect(body.type).toBe("NameNotSpecifiedException");

            done();
        });
    });    

    it("Must fail indicating package name not specified", function(done) {
        request.get({ url: server + "/package/%20%20", json: true }, function(error, response, body) {
            // Check status code
            expect(response.statusCode).toBe(500);
            
            // Check the error type
            expect(body.type).toBe("NameNotSpecifiedException");

            done();
        });
    });    

    it("Must get only the 2.x versions", function(done) {
        request.get({ url: server + '/package/bootstrap/2.2.1', json: true }, function(error, response, body) {                            
          // Check status code
          expect(response.statusCode).toBe(200);

          // Check main body
          expect(body.name).toBe('bootstrap');
          expect(body.dateCreated).toEqual(new Date('2018-08-14 00:00:00').toISOString());
          expect(body.dateModified).toBeNull();
          expect(body.email).toBe('panchi150@gmail.com');
          
          // Check version object
          expect(body.versions).toBeDefined();         
          expect(body.versions["2.x"]).toBeDefined();
          expect(body.versions["3.x"]).toBeUndefined();

          done();
        });
    });

    it("Must get only the 3.x versions", function(done) {
        request.get({ url: server + '/package/bootstrap/3.3.2', json: true }, function(error, response, body) {                            
          // Check status code
          expect(response.statusCode).toBe(200);

          // Check main body
          expect(body.name).toBe('bootstrap');
          expect(body.dateCreated).toEqual(new Date('2018-08-14 00:00:00').toISOString());
          expect(body.dateModified).toBeNull();
          expect(body.email).toBe('panchi150@gmail.com');
          
          // Check version object
          expect(body.versions).toBeDefined();         
          expect(body.versions["2.x"]).toBeUndefined();
          expect(body.versions["3.x"]).toBeDefined();

          done();
        });
    });

    it("Must get the package but no versions", function(done) {
        request.get({ url: server + '/package/bootstrap/1.1.0', json: true }, function(error, response, body) {                            
          // Check status code
          expect(response.statusCode).toBe(200);

          // Check main body
          expect(body.name).toBe('bootstrap');
          expect(body.dateCreated).toEqual(new Date('2018-08-14 00:00:00').toISOString());
          expect(body.dateModified).toBeNull();
          expect(body.email).toBe('panchi150@gmail.com');
          
          // Check version object
          expect(body.versions).toBeDefined();         
          expect(body.versions["2.x"]).toBeUndefined();
          expect(body.versions["3.x"]).toBeUndefined();

          done();
        });
    });    

    it("Must fail indicating that an invalid version was specified", function(done) {
        request.get({ url: server + '/package/bootstrap/3.3.qw', json: true }, function(error, response, body) {                            
          // Check status code
          expect(response.statusCode).toBe(500);

          // Check main body
          expect(body.type).toBe('InvalidVersionException');

          done();
        });
    });

    it("Must return the packages with the specified versions", function(done) {
        var body = {
            "bootstrap": "3.3.2",
            "qk-alchemy": "1.0.0"
        };

        request.post({ url: server + '/package/search', body: body, json: true }, function(error, response, body) {                            
            // Check status code
            expect(response.statusCode).toBe(200);

            // Check main body
            expect(body.length).toBe(2);

            expect(body[0].name).toBe('bootstrap');
            expect(body[0].dateCreated).toEqual(new Date('2018-08-14 00:00:00').toISOString());
            expect(body[0].dateModified).toBeNull();
            expect(body[0].email).toBe('panchi150@gmail.com');

            expect(body[0].paths).toBeDefined();
            expect(body[0].shims).toBeDefined();

            expect(body[0].paths['bootstrap/js']).toBe('bootstrap/dist/js/bootstrap.min');
            expect(body[0].paths['bootstrap/css']).toBe('bootstrap/dist/css/bootstrap.min');        

            expect(body[1].name).toBe('qk-alchemy');
            expect(body[1].dateCreated).toEqual(new Date('2018-08-15 00:00:00').toISOString());
            expect(body[1].dateModified).toBeNull();
            expect(body[1].email).toBe('panchi150@gmail.com');

            expect(body[1].paths).toBeDefined();
            expect(body[1].shims).toBeDefined();

            expect(body[1].paths['qk-alchemy']).toBe('qk-alchemy');
            expect(body[1].shims).toEqual({});

            done();
        });
    });

    it("Must return the packages with the specified versions even with leading or trailing spaces", function(done) {
        var body = {
            "    bootstrap": "3.3.2",
            "qk-alchemy    ": "1.0.0"
        };

        request.post({ url: server + '/package/search', body: body, json: true }, function(error, response, body) {                            
            // Check status code
            expect(response.statusCode).toBe(200);

            // Check main body
            expect(body.length).toBe(2);

            expect(body[0].name).toBe('bootstrap');
            expect(body[0].dateCreated).toEqual(new Date('2018-08-14 00:00:00').toISOString());
            expect(body[0].dateModified).toBeNull();
            expect(body[0].email).toBe('panchi150@gmail.com');

            expect(body[0].paths).toBeDefined();
            expect(body[0].shims).toBeDefined();

            expect(body[0].paths['bootstrap/js']).toBe('bootstrap/dist/js/bootstrap.min');
            expect(body[0].paths['bootstrap/css']).toBe('bootstrap/dist/css/bootstrap.min');        

            expect(body[1].name).toBe('qk-alchemy');
            expect(body[1].dateCreated).toEqual(new Date('2018-08-15 00:00:00').toISOString());
            expect(body[1].dateModified).toBeNull();
            expect(body[1].email).toBe('panchi150@gmail.com');

            expect(body[1].paths).toBeDefined();
            expect(body[1].shims).toBeDefined();

            expect(body[1].paths['qk-alchemy']).toBe('qk-alchemy');
            expect(body[1].shims).toEqual({});

            done();
        });
    });    

    it("Must throw invalid search parameter when body is an empty object", function(done) {
        var body = {};

        request.post({ url: server + '/package/search', body: body, json: true }, function(error, response, body) {
            // Check status code
            expect(response.statusCode).toBe(500);

            expect(body.type).toBe("InvalidSearchParameterException");

            done();
        })
    });

    it("Must validate the structure of the search object", function(done) {
        var body = {
            "test": 1234
        };

        request.post({ url: server + '/package/search', body: body, json: true }, function(error, response, body) {
            // Check status code
            expect(response.statusCode).toBe(400);

            expect(body.type).toBe("JsonValidationException");

            expect(body.validations).toBeDefined();
            expect(body.validations.body[0].property).toBe("request.body.test");
            expect(body.validations.body[0].value).toBe(1234);

            done();
        })
    });   
    
    it("Must throw invalid version exception when one of the packages has a wrong one specified", function(done) {
        var body = {
            "test": "1.2qweqwe"
        };

        request.post({ url: server + '/package/search', body: body, json: true }, function(error, response, body) {
            // Check status code
            expect(response.statusCode).toBe(500);

            expect(body.type).toBe("InvalidVersionException");

            done();
        })
    });
    
    it("Must return packages not found", function(done) {
        var body = {
            "test": "1.2.3",
            "test2": "1.0.0"
        };

        request.post({ url: server + '/package/search', body: body, json: true }, function(error, response, body) {
            // Check status code
            expect(response.statusCode).toBe(500);

            expect(body.type).toBe("PackagesNotFoundException");
            expect(body.packages).toEqual(["test", "test2"]);

            done();
        })
    });      

    it("Must ignore not found packages and leave empty shim and paths from unexistent versions", function(done) {
        var body = {
            "bootstrap": "3.3.2",
            "qk-alchemy": "0.1.0",
            "test": "1.0.0"
        };

        request.post({ url: server + '/package/search', body: body, json: true }, function(error, response, body) {                            
            // Check status code
            expect(response.statusCode).toBe(200);

            // Check main body to be only 2 packages
            expect(body.length).toBe(2);

            // Validate bootstrap package
            expect(body[0].name).toBe('bootstrap');
            expect(body[0].dateCreated).toEqual(new Date('2018-08-14 00:00:00').toISOString());
            expect(body[0].dateModified).toBeNull();
            expect(body[0].email).toBe('panchi150@gmail.com');

            expect(body[0].paths).toBeDefined();
            expect(body[0].shims).toBeDefined();

            expect(body[0].paths['bootstrap/js']).toBe('bootstrap/dist/js/bootstrap.min');
            expect(body[0].paths['bootstrap/css']).toBe('bootstrap/dist/css/bootstrap.min');        

            // Validate qk-alchemy package
            expect(body[1].name).toBe('qk-alchemy');
            expect(body[1].dateCreated).toEqual(new Date('2018-08-15 00:00:00').toISOString());
            expect(body[1].dateModified).toBeNull();
            expect(body[1].email).toBe('panchi150@gmail.com');

            // Validate empty path and shims
            expect(body[1].paths).toBeDefined();
            expect(body[1].shims).toBeDefined();

            expect(body[1].paths).toEqual({});
            expect(body[1].shims).toEqual({});

            done();
        });
    });*/
})