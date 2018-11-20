var request = require('request');

var config = require('../config.json');

var testingUtils = require('./utils/testing');

describe("Package register tests", function() {
    beforeEach(function(done) {
        //testingUtils.dropTestDb();

        testingUtils.loadTestDb().then(done)
            .catch(reject);        
    }, 30000)

    afterAll(function(done) {
        testingUtils.stopTestDb();
    })

    var server = 'http://localhost:3000';

    it("Must update the bootstrap package correctly", function(done) {
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

    it("Must insert the package correctly and set the author as the logged user", function(done) {

        var package = {
            name: "test",
            email: "panchi150@gmail.com",
            author: "pepe",
            versions: {
                "1.x": {
                    paths: {
                        "test": "test"
                    }
                }
            }
        };

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: package, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(200);

            request.get({ url: server + '/package/test', json: true }, function(error, response, body) {
                expect(response.statusCode).toBe(200);

                // Check main body
                expect(body.name).toBe('test');
                expect(body.author).toBe('fran150');
                expect(body.dateCreated).not.toBeNull();                
                expect(body.dateModified).toBeNull();
                expect(body.email).toBe('panchi150@gmail.com');
                
                // Check version object
                expect(body.versions).toBeDefined();                
                expect(body.versions["1.x"]).toBeDefined();

                // Check paths
                expect(body.versions["1.x"].paths['test']).toBe('test');

                done();
            })
        });
    });

    it("Must fail validating package schema (required fields)", function(done) {
        var testPackage = {
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(400);

            expect(body.validations).toEqual({
                "body": [
                    {
                        "property": "request.body.name",
                        "messages": ["is required"]
                    },
                    {
                        "property": "request.body.versions",
                        "messages": ["is required"]
                    }                    
                ]
            });

            done();
        });
    });    

    it("Must fail validating package schema (fields format)", function(done) {
        var testPackage = {
            "name": 1234,
            "email": "panchi150",
            "author": 1234,
            "versions": "Will Fail"
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(400);

            expect(body.validations).toEqual({
                "body": [
                    {
                        "value": 1234,
                        "property": "request.body.name",
                        "messages": ["is not of a type(s) string"]
                    },
                    {
                        "value": 1234,
                        "property": "request.body.author",
                        "messages": ["is not of a type(s) string"]
                    },
                    {
                        "value": "panchi150",
                        "property": "request.body.email",
                        "messages": ["does not conform to the \"email\" format"]
                    },
                    {
                        "value": "Will Fail",
                        "property": "request.body.versions",
                        "messages": ["is not of a type(s) object"]
                    }                    
                ]
            });
            
            done();
        });
    });    

    it("Must fail validating versions min properties", function(done) {
        var testPackage = {
            "name": "test",
            "author": "fran150",
            "email": "panchi150@gmail.com",
            "versions": {                
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(400);

            expect(body.validations).toEqual({
                "body": [
                    {
                        "value": {},
                        "property": "request.body.versions",
                        "messages": ["does not meet minimum property length of 1"]
                    }                    
                ]
            });

            done();
        });
    });    

    it("Must fail validating versions required properties", function(done) {
        var testPackage = {
            "name": "test",
            "author": "fran150",
            "email": "panchi150@gmail.com",
            "versions": {
                "1.x": {
                }
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(400);

            expect(body.validations).toEqual({
                "body": [
                    {
                        "property": "request.body.versions[\"1.x\"].paths",
                        "messages": ["is required"]
                    }                    
                ]
            });

            done();
        });
    });    

    it("Must fail validating version's path required properties", function(done) {
        var testPackage = {
            "name": "test",
            "author": "fran150",
            "email": "panchi150@gmail.com",
            "versions": {
                "1.x": {
                    "paths": {},
                    "shims": {}
                }
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(400);

            expect(body.validations).toEqual({
                "body": [
                    {
                        "value": {},
                        "property": "request.body.versions[\"1.x\"].paths",
                        "messages": ["does not meet minimum property length of 1"]
                    },
                    {
                        "value": {},
                        "property": "request.body.versions[\"1.x\"].shims",
                        "messages": ["does not meet minimum property length of 1"]
                    }                    
                ]
            });

            done();
        });
    });    

    it("Must fail validating path and shim object types", function(done) {
        var testPackage = {
            "name": "test",
            "author": "fran150",
            "email": "panchi150@gmail.com",
            "versions": {
                "1.x": {
                    "paths": {
                        "test": 1234
                    },
                    "shims": {
                        "test2": "test2"
                    }
                }
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(400);

            expect(body.validations).toEqual({
                "body": [
                    {
                        "value": 1234,
                        "property": "request.body.versions[\"1.x\"].paths.test",
                        "messages": ["is not of a type(s) string"]
                    },
                    {
                        "value": "test2",
                        "property": "request.body.versions[\"1.x\"].shims.test2",
                        "messages": ["is not of a type(s) array"]
                    }                    
                ]
            });

            done();
        });
    });    

    it("Must fail when bower package not found", function(done) {
        var testPackage = {
            "name": "qweqweqwe",
            "author": "fran150",
            "email": "panchi150@gmail.com",
            "versions": {
                "1.x": {
                    "paths": {
                        "test": "test"
                    },
                    "shims": {
                        "test2": ["test2"]
                    }
                }
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(500);

            expect(body.type).toBe("PackageNotFoundInBowerException");

            done();
        });
    });    

    it("Must fail when user is not the package owner or collaborator of github repo", function(done) {
        var testPackage = {
            "name": "bootstrap",
            "email": "panchi150@gmail.com",
            "versions": {
                "1.x": {
                    "paths": {
                        "test": "test"
                    },
                    "shims": {
                        "test": ["test"]
                    }
                }
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "john-spartan" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(403);

            expect(body.type).toBe("UserUnauthorizedException");
            expect(body.login).toBe("john-spartan");

            done();
        });
    });      

    it("Must allow insert when the user is collaborator of the repo", function(done) {
        var testPackage = {
            "name": "test2",
            "email": "panchi150@gmail.com",
            "versions": {
                "1.x": {
                    "paths": {
                        "test": "test"
                    },
                    "shims": {
                        "test": ["test"]
                    }
                }
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "collaborator" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(200);

            request.get({ url: server + '/package/test2', json: true }, function(error, response, body) {
                expect(response.statusCode).toBe(200);

                // Check main body
                expect(body.name).toBe('test2');
                expect(body.author).toBe('collaborator');
                expect(body.dateCreated).not.toBeNull();                
                expect(body.dateModified).toBeNull();
                expect(body.email).toBe('panchi150@gmail.com');
                
                // Check version object
                expect(body.versions).toBeDefined();                
                expect(body.versions["1.x"]).toBeDefined();

                // Check paths
                expect(body.versions["1.x"].paths['test']).toBe('test');

                done();
            })
        });
    });    

    it("Must allow update email and password when the user is the registerer of the package", function(done) {
        var testPackage = {
            "name": "qk-alchemy",
            "author": "pepe",
            "email": "pepe@gmail.com",
            "versions": {
                "1.x": {
                    "paths": {
                        "test": "test"
                    },
                    "shims": {
                        "test": ["test"]
                    }
                }
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "fran150" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(200);

            request.get({ url: server + '/package/qk-alchemy', json: true }, function(error, response, body) {
                expect(response.statusCode).toBe(200);

                // Check main body
                expect(body.name).toBe('qk-alchemy');
                expect(body.author).toBe('pepe');
                expect(body.dateCreated).not.toBeNull();                
                expect(body.dateModified).not.toBeNull();
                expect(body.email).toBe('pepe@gmail.com');
                
                // Check version object
                expect(body.versions).toBeDefined();                
                expect(body.versions["1.x"]).toBeDefined();

                // Check paths
                expect(body.versions["1.x"].paths['test']).toBe('test');

                done();
            })
        });
    });    

    it("Must not change the email and password when the user is NOT the registerer of the package", function(done) {
        var testPackage = {
            "name": "qk-bootstrap",
            "author": "pepe",
            "email": "pepe@gmail.com",
            "versions": {
                "1.x": {
                    "paths": {
                        "test": "test"
                    },
                    "shims": {
                        "test": ["test"]
                    }
                }
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "collaborator" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(200);

            request.get({ url: server + '/package/qk-bootstrap', json: true }, function(error, response, body) {
                expect(response.statusCode).toBe(200);

                // Check main body
                expect(body.name).toBe('qk-bootstrap');
                expect(body.author).toBe('fran150');
                expect(body.dateCreated).not.toBeNull();                
                expect(body.dateModified).not.toBeNull();
                expect(body.email).toBe('panchi150@gmail.com');
                
                // Check version object
                expect(body.versions).toBeDefined();                
                expect(body.versions["1.x"]).toBeDefined();

                // Check paths
                expect(body.versions["1.x"].paths['test']).toBe('test');

                done();
            })
        });
    });    

    it("Must fail when token not specified", function(done) {
        var testPackage = {
            "name": "qk-bootstrap",
            "author": "pepe",
            "email": "pepe@gmail.com",
            "versions": {
                "1.x": {
                    "paths": {
                        "test": "test"
                    },
                    "shims": {
                        "test": ["test"]
                    }
                }
            }
        }

        request.post({ 
            url: server + '/package', 
            json: true, 
            body: testPackage, 
            headers: { token: "" } 
        }, function(error, response, body) {
            expect(response.statusCode).toBe(401);

            expect(body.type).toBe("TokenNotSpecifiedException");

            done();

        });
    });      
})