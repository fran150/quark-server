var BaseExceptions = require("./base.exceptions");

function BaseDbException(err) {
    BaseExceptions.InfrastructureException.call(this);
    this.type = "BaseDbException";
    this.message = "";
    this.mongoError = err;
}

BaseDbException.prototype = Object.create(BaseExceptions.InfrastructureException.prototype);
BaseDbException.prototype.constructor = BaseDbException;

function CantConnectToDbException(err) {
    BaseDbException.call(this, err);
    this.type = 'CantConnectToDbException';
    this.message = "Error connecting to the database";
}

CantConnectToDbException.prototype = Object.create(BaseDbException.prototype);
CantConnectToDbException.prototype.constructor = CantConnectToDbException;


function QueryingDbException(err) {
    BaseDbException.call(this, err);
    this.type = 'QueryingDbException';
    this.message = "An error ocurred querying database";
}

QueryingDbException.prototype = Object.create(BaseDbException.prototype);
QueryingDbException.prototype.constructor = QueryingDbException;

function ClosingDbException(err) {
    BaseDbException.call(this, err);
    this.type = 'ClosingDbException';
    this.message = "An error ocurred while closing connection to the database";
}

ClosingDbException.prototype = Object.create(BaseDbException.prototype);
ClosingDbException.prototype.constructor = ClosingDbException;

module.exports = {
    "BaseDbException": BaseDbException,
    "CantConnectToDbException": CantConnectToDbException,
    "QueryingDbException": QueryingDbException,
    "ClosingDbException": ClosingDbException
}