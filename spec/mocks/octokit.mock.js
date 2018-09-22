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
        getCollaborators: function() {
            return Q.Promise(function(resolve) {
                resolve({
                    data: [
                        { login: "collaborator" }
                    ]
                })
            });
        }
    }
}

module.exports = function() {
    return new OctokitMock();
};