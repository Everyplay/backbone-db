var assert = require('assert');

module.exports = function(cb) {
  /*eslint no-unused-vars: 0*/
  var m1, m2, m3;
  var sortedCollection;
  var currentId;

  after(function() {
    if (cb) cb();
  });

  it('should .find from store', function(t) {
    var m = new this.Collection();
    m.fetch({
      success: function() {
        assert(m.length === 0, 'Collection should be empty');
        t();
      },
      error: function(collection, err) {
        t(err);
      }
    });
  });

  it('should .create from store', function(t) {
    var m = new this.Collection();
    assert(m.length === 0);
    m.create({
      'test': 1
    }, {
      success: function(model) {
        assert(model.get('test') === 1);
        m1 = model;
        m.fetch({
          success: function() {
            assert(m.length === 1, 'Collection shuld have 1 model');
            t();
          },
          error: function(err) {
            assert(err);
          }
        });

      },
      error: function(err) {
        assert(err);
      }
    });
  });

  it('should .create 2 models', function(t) {
    var m = new this.Collection();
    assert(m.length === 0);
    m.create({
      test: 1,
      arr: ['foo', 'bar'],
      d: new Date()
    }, {
      success: function(model) {
        m2 = model;
        m.create({
          test: 2,
          d: new Date()
        }, {
          success: function(_model) {
            m3 = _model;
            m.fetch({
              success: function() {
                assert(m.length === 3, 'Collection shuld have 3 model');
                t();
              },
              error: function(__model, err) {
                t(err);
              }
            });
          },
          error: function(_model, err) {
            t(err);
          }
        });
      },
      error: function(model, err) {
        t(err);
      }
    });
  });

  it('should fetch collection', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      success: function() {
        assert.equal(collection.length, 3);
        t();
      },
      error: function(coll, err) {
        t(err);
      }

    });
  });

  it('should fetch collection with limit', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      success: function() {
        assert.equal(collection.length, 2);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with offset', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      offset: 2,
      success: function() {
        var at0 = collection.at(0);
        assert.equal(collection.length, 1);
        assert.ok('' + at0.get(at0.idAttribute) === '' + m3.get(m3.idAttribute));
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection sorted ascending', function(t) {
    sortedCollection = new this.Collection();
    sortedCollection.fetch({
      sort: 'id',
      success: function() {
        currentId = sortedCollection.at(1).id;
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with after_id when sorting ascending', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      sort: 'id',
      after_id: currentId,
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).id, sortedCollection.at(2).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with after_id when sorting ascending with first id', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      sort: 'id',
      after_id: sortedCollection.at(0).id,
      success: function() {
        assert.equal(collection.length, 2);
        assert.equal(collection.at(0).id, sortedCollection.at(1).id);
        assert.equal(collection.at(1).id, sortedCollection.at(2).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with before_id when sorting ascending', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      sort: 'id',
      before_id: currentId,
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).id, sortedCollection.at(0).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with before_id when sorting ascending with last id', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      limit: 2,
      sort: 'id',
      before_id: sortedCollection.at(2).id,
      success: function() {
        assert.equal(collection.length, 2);
        assert.equal(collection.at(0).id, sortedCollection.at(0).id);
        assert.equal(collection.at(1).id, sortedCollection.at(1).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection sorted by given field', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      sort: '-test',
      success: function() {
        assert.equal(collection.at(0).get('test'), 2);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection sorted by multiple fields', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      sort: ['test', 'id'],
      success: function() {
        assert.equal(collection.at(1).id, 4);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection sorted descending', function(t) {
    sortedCollection = new this.Collection();
    sortedCollection.fetch({
      sort: ['-id'],
      success: function() {
        currentId = sortedCollection.at(1).id;
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with after_id when sorted descending', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      sort: ['-id'],
      after_id: currentId,
      limit: 1,
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).id, sortedCollection.at(2).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with after_id (first) when sorted descending', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      sort: ['-id'],
      after_id: sortedCollection.at(0).id,
      success: function() {
        assert.equal(collection.length, 2);
        assert.equal(collection.at(0).id, sortedCollection.at(1).id);
        assert.equal(collection.at(1).id, sortedCollection.at(2).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with after_id (first) & limit when sorted descending', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      sort: ['-id'],
      limit: 1,
      after_id: sortedCollection.at(0).id,
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).id, sortedCollection.at(1).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });
  it('should fetch collection with before_id when sorted descending', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      sort: ['-id'],
      before_id: currentId,
      limit: 1,
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).id, sortedCollection.at(0).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with before_id (last) when sorted descending', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      sort: ['-id'],
      before_id: sortedCollection.at(2).id,
      success: function() {
        assert.equal(collection.length, 2);
        assert.equal(collection.at(0).id, sortedCollection.at(0).id);
        assert.equal(collection.at(1).id, sortedCollection.at(1).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection with before_id (last) & limit when sorted descending', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      sort: ['-id'],
      before_id: sortedCollection.at(2).id,
      limit: 1,
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).id, sortedCollection.at(1).id);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection filtered with given attributes', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      where: {
        test: 2
      },
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 2);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection filtered with array value', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      where: {
        arr: {
          $in: ['foo']
        }
      },
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 1);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should fetch collection filtered with multiple array values', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      where: {
        arr: {
          $in: ['foo', 'bar']
        }
      },
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 1);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should query models with $ne', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      where: {
        test: {
          $ne: 1
        }
      },
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 2);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should query models with Date & $lte', function(t) {
    var collection = new this.Collection();
    collection.fetch({
      where: {
        d: {
          $lte: new Date()
        }
      },
      success: function() {
        assert.equal(collection.length, 2);
        t();
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });

  it('should remove a model from collection when destroyed', function(t) {
    var m = new this.Collection();
    m.fetch({
      success: function() {
        assert(m.length === 3);
        var model = m.at(2);
        model.destroy({
          success: function() {
            assert(m.length === 2, 'model was not removed from collection');
            m.fetch({
              success: function() {
                assert(m.length === 2, 'model was not removed from collection when fetched');
                t();
              },
              error: function(_model, err) {
                t(err);
              }
            });
          },
          error: function(_model, err) {
            t(err);
          },
          wait: true
        });
      },
      error: function(coll, err) {
        t(err);
      }
    });
  });
};
