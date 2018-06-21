describe("MongoDB Connector tests", function() {
    // Get logger and disable
    require("../../utils/logger").disableLog();

    var exceptions = require("../../exceptions/dbExceptions");

    // Get connector instance
    var connector = require("../../data/connector");

    it("Must connect to database", function(done) {
        connector.connect()
            .then(done)
            .catch(function(err) {
                if (err instanceof exceptions.ConnectException) {
                    fail("Expected error");    
                }
                fail("Error connecting to database");
                done();
            });
    }, 20000);
});