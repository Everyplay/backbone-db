var BaseError = require('./base_error');

var error = 'forbidden';
var description = "The resource was not found";
var code = 404;

var NotFoundError = function(msg, options) {
  options = options || {};
  options.statusCode = options.statusCode || options.errorCode || code;
  BaseError.call(this, msg, options);
};

NotFoundError.prototype = BaseError.prototype;
NotFoundError.prototype.constructor = NotFoundError;

module.exports = NotFoundError;