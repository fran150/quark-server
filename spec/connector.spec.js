var proxyquire = require('proxyquire');

var config = require('./config.json')
var mongodb = require('./mocks/mongodb.mock');

var connector = proxyquire('../data/connector', {
    "mongodb": mongodb,
    "../config.json": config
});

describe('Database connection tests', function() { 
    it('Must correctly connect to the database', function(done) {
        connector.connect().then(function() {
            expect(connector.db()).toBeDefined();
            done();
        })
        .catch(function(ex) {
            fail('Error connecting to the database');
            done();
        })
    });


    it('Must fail when the specified url is incorrect', function(done) {
        connector.connect('mongodb://error:27017').then(function() {
            fail('Must not return a correct connection');
            done();
        })
        .catch(function(ex) {
            expect(ex.type).toBe('CantConnectToDbException');
            done();
        })
    });

    it('Must fail when the specified database is incorrect', function(done) { 
        connector.connect("mongodb://localhost:27017", "error").then(function() {            
            expect(connector.db).toThrowMatching(function(thrown) { return thrown.type == 'CantConnectToDbException'; });
            done();
        })
    })
})