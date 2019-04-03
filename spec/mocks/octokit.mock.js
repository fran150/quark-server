var Q = require('q');

// Mockup of the used octokit functions
function OctokitMock() {
    var token = "";

    // Sets as user the string sent as token
    this.authenticate = function(data) {
        token = data.token;
    };

    // Users object mock
    this.users = {
        // Get users mockup
        get: function() {
            return Q.Promise(function(resolve) {
                resolve({
                    data: {
                        login: token
                    }
                });
            });
        }
    }

    // Repos object mock
    this.repos = {
        // Get the collaborators mockup
        getCollaborators: function(options) {
            return Q.Promise(function(resolve, reject) {
                if (options.login == "collaborator") {
                    resolve({
                        data: [
                            { login: "collaborator" }
                        ]
                    })    
                } else if (options.login == "empty") {
                    resolve();
                } else if (options.login == "john-spartan") {
                    reject({
                        code: 403
                    })
                
                } else {
                    reject("Error getting collaborators");
                }
            });
        }
    }
}

module.exports = function() {
    return new OctokitMock();
};