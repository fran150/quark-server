var Q = require('q');
const octokit = require('@octokit/rest')();

function CollaboratorData() {
    // Validate if the user is the package owner or a collaborator
    this.validateCollaborator = function(package, token) {
        return Q.Promise(function(resolve, reject) {
            logger.data("Authenticating token");
            
            // Sets the authentication method for future requests
            octokit.authenticate({
                type: 'oauth',
                token: token
            });

            // Wait for package info and do a bower lookup
            Q.all([self.getPackage(package.name), bower.lookup(package.name)]).then(function(results) {
                var quarkData = results[0];
                var bowerData = results[1];

                // If not bower data found
                if (!bowerData) {
                    reject(new packageExceptions.PackageNotFoundInBowerException());                    
                    return;
                }

                // Parse the found url in bower (http://github.com/<owner>/<repo>)
                var urlParts = url.parse(bowerData.url);
                var pathParts = urlParts.pathname.split('/');
                
                // Get the owner and repo from the url
                var owner = pathParts[1];
                var repo = path.basename(pathParts[2], '.git');

                logger.data("Get logged user and repository");

                // Get the user's data
                octokit.users.get({}).then(function(user) {
                    var login = user.data.login;
                    
                    if (!user || !user.data || !user.data.login) {
                        reject(new packageExceptions.GetUserDataException());
                    }

                    logger.data("Found logged user: " + login);

                    // If there's is no quark data on the db
                    if (!quarkData) {
                        logger.data("Quark package not found. Will insert new package");

                        // Returns login data, valid user and no quark data
                        resolve({
                            login: login,
                            quarkData: undefined
                        });
                    } else {
                        // If the package is already on the db, check the author
                        if (quarkData.author) {
                            logger.data("Checking if user is who registered the package");

                            // If the author is the logged user
                            if (quarkData.author == login) {
                                logger.data("The specified user is who registered the package");

                                // Returns login data, valid user and quark data
                                resolve({
                                    login: login,
                                    quarkData: quarkData
                                });

                                return
                            } else {
                                logger.data("The specified user is not the owner of the package");
                            }
                        }

                        // If the login is the user of the github repo
                        if (login == owner) {
                            logger.data("The specified user is the owner of the github repo");

                            resolve({
                                login: login,
                                quarkData: quarkData
                            });

                            return
                        }

                        logger.data("Checking if user is a package's repository collaborator");

                        // If user is not the author of the package or the repo check if its a collaborator
                        octokit.repos.getCollaborators({
                            login: login,
                            owner: owner,
                            repo: repo
                        }).then(function(collabs) {
                            // Validate response
                            if (!collabs || !collabs.data || !comp.isArray(collabs.data)) {
                                reject(new authExceptions.CantGetCollaboratorsException("No collaborators data"));
                            }

                            // Iterate over the found collaborators
                            for (var i = 0; i < collabs.data.length; i++) {
                                var collaborator = collabs.data[i].login;

                                // If the logged user is a collaborator in the github repo
                                if (collaborator == login) {
                                    logger.data("The specified user is a collaborator of the repository");
                                    
                                    // Return the user data, valid flag and quark data
                                    resolve({
                                        login: login,
                                        quarkData: quarkData
                                    });

                                    return;
                                }
                            }

                            logger.data("The specified user is NOT a collaborator of the repository");

                            // Return the user data and package data, but valid user flag set to false
                            reject(new authExceptions.UserUnauthorizedException(login));
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
                })
                .catch(function(error) {
                    reject(new authExceptions.GetUserDataException(error));
                });                    
                
            })
            .catch(function(error) {
                reject(error);
            });
        });
    }
}

module.exports = new CollaboratorData();