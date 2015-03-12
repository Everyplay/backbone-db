var Db = require('../');
var assert = require('assert');

describe('backbone-db interface tests', function () {
  it('should init a Db', function() {
    var db = new Db('test');
    assert.equal(db.name, 'test');
    assert.equal(typeof db.find, 'function');
  });

  it('should init a NotFound Error', function() {
    var err = new Db.errors.NotFoundError('Foo');
    assert.equal(err.statusCode, 404);
    assert.equal(err.message, 'Foo');
    assert(err instanceof Error);
    assert(err instanceof Db.errors.NotFoundError);
  });
});
