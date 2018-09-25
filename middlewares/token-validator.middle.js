var authExceptions = require('../exceptions/auth.exceptions');

function TokenValidator(req, res, next) {
    if ((req.headers && req.headers.token)) {
        next();
    } else {
        var ex = new authExceptions.TokenNotSpecifiedException();

        res.status(401);
        res.json(ex);        
    }
}

module.exports = TokenValidator;