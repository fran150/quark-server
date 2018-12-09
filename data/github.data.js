var Q = require('q');
const octokit = require('@octokit/rest')();

var packageExceptions = require('../exceptions/package.exceptions');
var authExceptions = require('../exceptions/auth.exceptions');


function CollaboratorData() {
    // Gets the repo collaborators
    this.getCollaborators = function(token, login, owner, repo) {
        // Sets the authentication method for future requests
        octokit.authenticate({
            type: 'oauth',
            token: token
        });

        // If user is not the author of the package or the repo check if its a collaborator
        octokit.repos.getCollaborators({
            login: login,
            owner: owner,
            repo: repo
        })
        .then(function(collab) {
            // Validate response
            if (!collabs || !collabs.data || !comp.isArray(collabs.data)) {
                reject(new authExceptions.CantGetCollaboratorsException("No collaborators data"));
            } else {
                resolve(collab);
            }
        })
        .catch(function(error) {
            // If can't get the collborators because of user throw unauthorized
            if (error.code == 403) {
                reject(new authExceptions.UserUnauthorizedException(login));
            } else {
                reject(new authExceptions.CantGetCollaboratorsException(error));
            }            
        });
    }

    // Validate if the user is the package owner or a collaborator
    this.getUser = function(token) {
        return Q.Promise(function(resolve, reject) {
            // Sets the authentication method for future requests
            octokit.authenticate({
                type: 'oauth',
                token: token
            });

            // Get the user's data
            octokit.users.get({}).then(function(user) {                    
                // If no user data received
                if (!user || !user.data || !user.data.login) {
                    reject(new packageExceptions.GetUserDataException());
                } else {
                    // Return the found user data
                    resolve(user);
                }
            })
            .catch(function(error) {
                reject(new authExceptions.GetUserDataException(error));
            });
        });
    }
}

module.exports = new CollaboratorData();