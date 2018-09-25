var BaseExceptions = require("./base.exceptions");

function AuthException() {
    BaseExceptions.BusinessException.call(this);
    this.type = 'AuthException';
    this.message = "Database error";
}

AuthException.prototype = Object.create(BaseExceptions.BusinessException.prototype);
AuthException.prototype.constructor = AuthException;

function LoginException() {
    AuthException.call(this);
    this.type = 'LoginException';
    this.message = "Database error";
}

LoginException.prototype = Object.create(AuthException.prototype);
LoginException.prototype.constructor = LoginException;

function InvalidLoginException() {
    LoginException.call(this);
    this.name = 'InvalidLoginException';
    this.type = 'InvalidLoginException';
    this.message = "El nombre de usuario o la contraseña ingresadas son invalidos";
}

InvalidLoginException.prototype = Object.create(LoginException.prototype);
InvalidLoginException.prototype.constructor = InvalidLoginException;

function UserNotSpecifiedException() {
    LoginException.call(this);
    this.type = 'UserNotSpecifiedException';
    this.message = "No ha especificado el nombre de usuario";
}

UserNotSpecifiedException.prototype = Object.create(LoginException.prototype);
UserNotSpecifiedException.prototype.constructor = UserNotSpecifiedException;

function PasswordNotSpecifiedException() {
    LoginException.call(this);
    this.type = 'PasswordNotSpecifiedException';
    this.message = "No ha especificado la contraseña";
}

PasswordNotSpecifiedException.prototype = Object.create(LoginException.prototype);
PasswordNotSpecifiedException.prototype.constructor = PasswordNotSpecifiedException;

function InvalidTokenException(error) {
    AuthException.call(this);
    this.type = 'InvalidTokenException';
    this.message = "No se encuentra correctamente logueado en el sistema";
    this.error = error;
}

InvalidTokenException.prototype = Object.create(AuthException.prototype);
InvalidTokenException.prototype.constructor = InvalidTokenException;

function TokenNotSpecifiedException() {
    AuthException.call(this);
    this.type = 'TokenNotSpecifiedException';
    this.message = "No ha especificado el token de acceso";
}

TokenNotSpecifiedException.prototype = Object.create(AuthException.prototype);
TokenNotSpecifiedException.prototype.constructor = TokenNotSpecifiedException;


function GetUserDataException(error) {
    AuthException.call(this);
    this.type = 'GetUserDataException';
    this.message = "Cannot read the user data from github";
    this.error = error;
}

GetUserDataException.prototype = Object.create(AuthException.prototype);
GetUserDataException.prototype.constructor = GetUserDataException;


function CantGetCollaboratorsException(error) {
    AuthException.call(this);
    this.type = 'CantGetCollaboratorsException';
    this.message = "Cannot read the collaborators from the github repo";
    this.error = error;
}

CantGetCollaboratorsException.prototype = Object.create(AuthException.prototype);
CantGetCollaboratorsException.prototype.constructor = CantGetCollaboratorsException;

function UserUnauthorizedException(login) {
    AuthException.call(this);
    this.type = 'UserUnauthorizedException';
    this.message = "The user is unauthorized. The user must be the quark package author, the github repo owner or a collaborator.";
    this.login = login;
}

UserUnauthorizedException.prototype = Object.create(AuthException.prototype);
UserUnauthorizedException.prototype.constructor = UserUnauthorizedException;

var exceptions = {
    "AuthException": AuthException,
    "LoginException": LoginException,
    "UserNotSpecifiedException": UserNotSpecifiedException,
    "PasswordNotSpecifiedException": PasswordNotSpecifiedException,
    "InvalidLoginException": InvalidLoginException,
    "InvalidTokenException": InvalidTokenException,
    "TokenNotSpecifiedException": TokenNotSpecifiedException,
    "GetUserDataException": GetUserDataException,
    "CantGetCollaboratorsException": CantGetCollaboratorsException,
    "UserUnauthorizedException": UserUnauthorizedException
}    

module.exports = exceptions;