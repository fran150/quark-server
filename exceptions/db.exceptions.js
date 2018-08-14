var BaseExceptions = require("./base.exceptions");

function BaseDbException(err) {
    BaseExceptions.InfrastructureException.call(this);
    this.type = "BaseDbException";
    this.message = "";
    this.mysqlError = err;
}

BaseDbException.prototype = Object.create(BaseExceptions.InfrastructureException.prototype);
BaseDbException.prototype.constructor = BaseDbException;

function ConnectionPoolNotCreatedException() {
    BaseDbException.call(this);
    this.type = 'ConnectionPoolNotCreatedException';
    this.message = "Error creating connection pool. Verify the parameters in the config.json file";
}

ConnectionPoolNotCreatedException.prototype = Object.create(BaseDbException.prototype);
ConnectionPoolNotCreatedException.prototype.constructor = ConnectionPoolNotCreatedException;

function ErrorGettingConnection(err) {
    BaseDbException.call(this, err);
    this.type = 'ErrorGettingConnection';
    this.message = "Error getting connection from the connection pool";
}

ErrorGettingConnection.prototype = Object.create(BaseDbException.prototype);
ErrorGettingConnection.prototype.constructor = ErrorGettingConnection;

function ErrorGettingConnectionPool(err) {
    BaseDbException.call(this, err);
    this.type = 'ErrorGettingConnectionPool';
    this.message = "Connection pool not created, call the method createConnectionPool before issuing any database command";
}

ErrorGettingConnectionPool.prototype = Object.create(BaseDbException.prototype);
ErrorGettingConnectionPool.prototype.constructor = ErrorGettingConnectionPool;

function QueryingDbException(err) {
    BaseDbException.call(this, err);
    this.type = 'QueryingDbException';
    this.message = "An error ocurred querying database";
}

QueryingDbException.prototype = Object.create(BaseDbException.prototype);
QueryingDbException.prototype.constructor = QueryingDbException;

function TransactionException(err) {
    BaseDbException.call(this, err);
    this.type = 'TransactionException';
    this.message = "An error ocurred managing the transaction";
}

TransactionException.prototype = Object.create(BaseDbException.prototype);
TransactionException.prototype.constructor = TransactionException;

module.exports = {
    "BaseDbException": BaseDbException,
    "ConnectionPoolNotCreatedException": ConnectionPoolNotCreatedException,
    "ErrorGettingConnection": ErrorGettingConnection,
    "QueryingDbException": QueryingDbException,
    "TransactionException": TransactionException
}