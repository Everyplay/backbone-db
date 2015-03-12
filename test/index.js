/*
 * Allow this test suite to be used on custom implementations of db, model and collection.
 */
exports.shouldImplementDb = function (done) {
  require('./test.model.js')(function() {
    require('./test.collection.js')(done);
  });
};
