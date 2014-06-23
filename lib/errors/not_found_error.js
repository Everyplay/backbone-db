var BaseError = require('./base_error');

var error = 'forbidden';
var description = "The resource was not found";
var code = 404;

var NotFoundError = function(msg, options) {
  options = options || {};
  this.message = msg || options.msg || error;
  this.errorCode = options.errorCode;
  this.statusCode = options.statusCode || options.errorCode || code;
};

NotFoundError.prototype = BaseError.prototype;
NotFoundError.constructor = NotFoundError;

module.exports = NotFoundError;