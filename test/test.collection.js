var Db = require('../');
var assert = require('assert');
var _ = require('lodash');
var Backbone = require('backbone');

module.exports = function (cb) {
  var m1, m2, m3, m4;
  after(function () {
    if (cb) cb();
  });

  it('should .find from store', function (t) {
    var m = new this.Collection();
    m.fetch({
      success: function () {
        assert(m.length === 0, "Collection should be empty");
        t();
      },
      error: function (err) {
        t(err);
      }
    });
  });

  it('should .create from store', function (t) {
    var m = new this.Collection();
    assert(m.length === 0);
    m.create({
      "test": 1
    }, {
      success: function (model) {
        assert(model.get("test") === 1);
        m1 = model;
        m.fetch({
          success: function () {
            assert(m.length === 1, "Collection shuld have 1 model");
            t();
          },
          error: function (err) {
            assert(err);
          }
        });

      },
      error: function (err) {
        assert(err);
      }
    });
  });



  it('should .create 2 models', function (t) {
    var m = new this.Collection();
    assert(m.length === 0);
    m.create({
      test: 1,
      arr: ['foo', 'bar']
    }, {
      success: function (model) {
        m2 = model;
        m.create({
          test: 2
        }, {
          success: function (model) {
            m3 = model;
            m.fetch({
              success: function () {
                assert(m.length === 3, "Collection shuld have 3 model");
                t();
              },
              error: function (err) {
                assert(err);
              }
            });
          },
          error: function (err) {
            assert(err);
          }
        });
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should fetch collection with limit', function (t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      success: function () {
        assert.equal(collection.length, 2);
        t();
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should fetch collection with offset', function (t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      offset: 2,
      success: function () {
        var at0 = collection.at(0);
        assert.equal(collection.length, 1);
        assert.equal(at0.get(at0.idAttribute), m3.get(m3.idAttribute));
        t();
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should fetch collection with after_id', function (t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      after_id: m2.get(m2.idAttribute),
      success: function () {
        assert.equal(collection.at(0).get(collection.at(0).idAttribute), m3.get(m3.idAttribute));
        assert.equal(collection.length, 1);
        t();
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should fetch collection with before_id', function (t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      before_id: m3.get(m3.idAttribute),
      success: function () {
        var at0 = collection.at(0);
        var at1 = collection.at(1);
        assert.equal(at0.get(at0.idAttribute), m1.get(m1.idAttribute));
        assert.equal(at1.get(at0.idAttribute), m2.get(m1.idAttribute));
        t();
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should fetch collection sorted by given field', function (t) {
    var collection = new this.Collection();
    collection.fetch({
      sort: '-test',
      success: function () {
        assert.equal(collection.at(0).get('test'), 2);
        t();
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should fetch collection filtered with given attributes', function (t) {
    var collection = new this.Collection();
    collection.fetch({
      where: {
        test: 2
      },
      success: function () {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 2);
        t();
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should fetch collection filtered with array value', function (t) {
    var collection = new this.Collection();
    collection.fetch({
      where: {
        arr: {
          $in: ['foo']
        }
      },
      success: function () {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 1);
        t();
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should fetch collection filtered with multiple array values', function (t) {
    var collection = new this.Collection();
    collection.fetch({
      where: {
        arr: {
          $in: ['foo', 'bar']
        }
      },
      success: function () {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 1);
        t();
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should query models with $ne', function (t) {
    var collection = new this.Collection();
    collection.fetch({
      where: {
        test: {
          $ne: 1
        }
      },
      success: function () {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 2);
        t();
      },
      error: function (err) {
        assert(err);
      }
    });
  });

  it('should remove a model from collection when destroyed', function (t) {
    var m = new this.Collection();
    m.fetch({
      success: function () {
        assert(m.length === 3);
        var model = m.at(2);
        model.destroy({
          success: function (model, response) {
            assert(m.length === 2, 'model was not removed from collection');
            m.fetch({
              success: function () {
                assert(m.length === 2, 'model was not removed from collection when fetched');
                t();
              },
              error: function (err) {
                assert(err);
              }
            });
          },
          error: function () {
            assert(err);
          },
          wait: true
        });
      },
      error: function (err) {
        assert(err);
      }
    });
  });
};