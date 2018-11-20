var mongoose = require('mongoose');

var packageSchema = new mongoose.Schema({
    name: String,
    author: String,
    email: String,
    versions: {
        type: Map,
        of: {
            paths: {
                type: Map,
                of: String
            },
            shims: {
                type: Map,
                of: [String]
            }
        }
    }
});

var Package = new mongoose.model('Package', packageSchema);

module.exports = {
    schema: packageSchema,
    model: Package
}