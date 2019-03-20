var config = require('./config.json');

function Utils() {
    this.getConfig = function(url, body) {
        var res = config.server.config;
        res.url = config.server.base + url;

        if (body) {
            res.body = body;
        }

        return res;
    }
}

module.exports = new Utils();