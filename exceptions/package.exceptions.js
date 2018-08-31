var BaseExceptions = require("./base.exceptions");

function PackageException() {
    BaseExceptions.BusinessException.call(this);
    this.type = 'PackageException';
    this.message = "An error ocurred while trying to read the package";
}

PackageException.prototype = Object.create(BaseExceptions.BusinessException.prototype);
PackageException.prototype.constructor = PackageException;

function NameNotSpecifiedException() {
    PackageException.call(this);
    this.type = 'NameNotSpecifiedException';
    this.message = "The package name is not specified";
}
NameNotSpecifiedException.prototype = Object.create(PackageException.prototype);
NameNotSpecifiedException.prototype.constructor = NameNotSpecifiedException


function InvalidVersionException(version) {
    PackageException.call(this);
    this.type = 'InvalidVersionException';
    this.message = "The specified package version (" + version + ") is invalid";
    this.version = version;
}

InvalidVersionException.prototype = Object.create(PackageException.prototype);
InvalidVersionException.prototype.constructor = InvalidVersionException;

module.exports = {
    "PackageException": PackageException,
    "InvalidVersionException": InvalidVersionException,
    "NameNotSpecifiedException": NameNotSpecifiedException
};