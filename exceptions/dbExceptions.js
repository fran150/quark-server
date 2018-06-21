var StandardException = require("./standardException");

function ConnectException(err) {
    this.name = 'ConnectException';
    this.message = "Error connecting to the specified database. Check the connection and database properties on config.js";
    this.mongoDbError = err;
}

ConnectException.prototype = new StandardException;

function DisconnectedException() {
    this.name = 'DisconnectedException';
    this.message = "You must first connect with the database using the connect method";
}

DisconnectedException.prototype = new StandardException;

function SelectingDbException(databaseName, err) {
    this.name = 'SelectingDbException';
    this.message = "An error ocurred selecting database " + databaseName;
    this.databaseName = databaseName;
    this.innerError = err;
}

SelectingDbException.prototype = new StandardException;


module.exports = {
    "ConnectException": ConnectException,
    "DisconnectedException": DisconnectedException,
    "SelectingDbException": SelectingDbException
}