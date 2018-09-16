var BaseExceptions = require("./base.exceptions");


function PackageException() {
    BaseExceptions.BusinessException.call(this);
    this.type = 'PackageException';
    this.message = "An error ocurred while trying to read the package";
}

PackageException.prototype = Object.create(BaseExceptions.BusinessException.prototype);
PackageException.prototype.constructor = PackageException;

function PackageNotFoundException(name) {
    PackageException.call(this);
    this.type = 'PackageNotFoundException';
    this.message = "The specified package (" + name + ") does not exists";
    this.name = name;
}
PackageNotFoundException.prototype = Object.create(PackageException.prototype);
PackageNotFoundException.prototype.constructor = PackageNotFoundException

function PackagesNotFoundException(packages) {
    PackageException.call(this);
    this.type = 'PackagesNotFoundException';
    this.message = "None of the specified packages was found";
    this.packages = packages;
}
PackagesNotFoundException.prototype = Object.create(PackageException.prototype);
PackagesNotFoundException.prototype.constructor = PackagesNotFoundException

function NameNotSpecifiedException() {
    PackageException.call(this);
    this.type = 'NameNotSpecifiedException';
    this.message = "The package name is not specified";
}
NameNotSpecifiedException.prototype = Object.create(PackageException.prototype);
NameNotSpecifiedException.prototype.constructor = NameNotSpecifiedException


function InvalidVersionException(moduleName, version) {
    PackageException.call(this);
    this.type = 'InvalidVersionException';
    this.message = "The specified package version (" + version + ") is invalid";
    this.version = version;
    this.moduleName = moduleName;
}

InvalidVersionException.prototype = Object.create(PackageException.prototype);
InvalidVersionException.prototype.constructor = InvalidVersionException;


function InvalidSearchParameterException() {
    PackageException.call(this);
    this.type = 'InvalidSearchParameterException';
    this.message = "The specified search parameter is invalid. It must be an object with <package>: <version> pairs";
}

InvalidSearchParameterException.prototype = Object.create(PackageException.prototype);
InvalidSearchParameterException.prototype.constructor = InvalidSearchParameterException;


function PackageNotFoundInBowerException() {
    PackageException.call(this);
    this.type = 'PackageNotFoundInBowerException';
    this.message = "The specified package cannot be found on bower";
}

PackageNotFoundInBowerException.prototype = Object.create(PackageException.prototype);
PackageNotFoundInBowerException.prototype.constructor = PackageNotFoundInBowerException;


function ErrorInsertingPackageException() {
    PackageException.call(this);
    this.type = 'ErrorInsertingPackageException';
    this.message = "Some error ocurred while saving the package";
}

ErrorInsertingPackageException.prototype = Object.create(PackageException.prototype);
ErrorInsertingPackageException.prototype.constructor = ErrorInsertingPackageException;


function ErrorInPackageFormatException(propertyName) {
    PackageException.call(this);
    this.type = 'ErrorInPackageFormatException';
    this.message = "The package definition has a property missing or with an invalid format";

    if (propertyName) {
        this.message += " (" + propertyName + ")";
    }
}

ErrorInPackageFormatException.prototype = Object.create(PackageException.prototype);
ErrorInPackageFormatException.prototype.constructor = ErrorInPackageFormatException;

function ErrorRegisteringPackageException(subtype, error) {
    PackageException.call(this);
    this.type = 'ErrorRegisteringPackageException';
    this.subtype = subtype;
    this.message = "The specified user is not valid or can't edit this quark package";
    this.error = error;
}

ErrorRegisteringPackageException.prototype = Object.create(PackageException.prototype);
ErrorRegisteringPackageException.prototype.constructor = ErrorRegisteringPackageException;

module.exports = {
    "PackageException": PackageException,
    "PackageNotFoundException": PackageNotFoundException,
    "PackagesNotFoundException": PackagesNotFoundException,
    "InvalidVersionException": InvalidVersionException,
    "NameNotSpecifiedException": NameNotSpecifiedException,
    "InvalidSearchParameterException": InvalidSearchParameterException,
    "PackageNotFoundInBowerException": PackageNotFoundInBowerException,
    "ErrorInsertingPackageException": ErrorInsertingPackageException,
    "ErrorInPackageFormatException": ErrorInPackageFormatException,
    "ErrorRegisteringPackageException": ErrorRegisteringPackageException
};