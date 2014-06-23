var Db = require('../');
var Backbone = require('backbone');
var _ = require('lodash');
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
  });
});