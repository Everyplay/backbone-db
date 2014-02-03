/**
 * Allow this test suite to be used on custom implementations of db, model and collection.
 */
var _ = require('lodash');
exports.shouldImplementDb = function (done) {
  var d = _.after(2, done);
  require('./test.model.js')(d);
  require('./test.collection.js')(d);
};