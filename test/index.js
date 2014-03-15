var _ = require('lodash');
/**
 * Allow this test suite to be used on custom implementations of db, model and collection.
 */
exports.shouldImplementDb = function (done) {
  var modelTests = require('./test.model.js');
  var collectionTests = require('./test.collection.js');
  var d = _.after(2, done);
  collectionTests(d);
  modelTests(d);
};