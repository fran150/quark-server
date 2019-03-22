var comp = require('../utils/comparsion');
var config = require('./config.json');

function Utils() {
    this.getConfig = function(url, body, token) {
        var req = config.server.config;
        req.url = config.server.base + url;

        if (body) {
            req.body = body;
        }

        if (token) {
            req.headers = { token: token };
        }

        return req;
    }

    this.map = function(source, target) {
        for (var name in source) {
            if (comp.isObject(source[name])) {
                if (source[name] instanceof Date) {
                    target[name] = source[name];
                } else {
                    if (!target[name]) {
                        target[name] = {};
                    }
    
                    this.map(source[name], target[name]);    
                }                
            } else {
                target[name] = source[name];
            }
        }

        return target;
    }
}

module.exports = new Utils();