var assert = require('assert');

module.exports = function (cb) {
  var m;
  after(function () {
    if (cb) cb();
  });

  it('should not .find empty model from store', function (t) {
    var m = new this.Model({});
    m.fetch({
      success: function () {
        t(new Error('should no success'));
      },
      error: function (model, err) {
        t();
      }
    });
  });

  it('should include all the variables when saving a Model', function (t) {
    var Model = this.Model;
    m = new Model();
    m.save({
      variable: '123',
      counter: 1
    }, {
      success: function () {
        var m2 = new Model({
          id: m.get(m.idAttribute)
        });
        m2.fetch({
          success: function () {
            assert.equal(m2.get('variable'), '123');
            assert.equal(m2.get('counter'), 1);
            t();
          },
          error: function (model, err) {
            console.error(err);
            assert.ok(false);
          }
        });
      }
    });
  });

  it('should inc Model counter', function (t) {
    var m2 = new this.Model({
      id: m.get(m.idAttribute)
    });
    var opts = {
      inc: {
        attribute: 'counter',
        amount: 2
      },
      success: function () {
        t();
      },
      error: function (model, err) {
        console.error(err);
        assert.ok(false);
      }
    };
    m2.save(null, opts);
  });

  it('should check that counter was incresed', function (t) {
    var m2 = new this.Model({
      id: m.get(m.idAttribute)
    });
    m2.fetch({
      success: function () {
        assert.equal(m2.get('variable'), '123');
        assert.equal(m2.get('counter'), 3);
        t();
      },
      error: function (model, err) {
        t(err);
      }
    });
  });

  it('should fail inc operation gracefully', function (t) {
    var m2 = new this.Model({
      id: m.get(m.idAttribute)+'asd'
    });
    var opts = {
      inc: {
        attribute: 'counter',
        amount: 1
      },
      ignoreFailures: true,
      success: function () {
        t();
      },
      error: function (model, err) {
        t(err);
      }
    };
    m2.save(null, opts);
  });

  it('should remove the model', function (t) {
    var m2 = new this.Model({
      id: m.get(m.idAttribute)
    });

    m2.fetch({
      success: function () {
        assert.equal(m2.get('variable'), '123');
        assert.equal(m2.get('counter'), 3);
        m2.destroy({
          success: function () {
            t();
          }
        });
      },
      error: function (model, err) {
        t(err);
      }
    });
  });

  it('should not fetch removed model', function(t) {
    var m2 = new this.Model({
      id: m.get(m.idAttribute)
    });

    m2.fetch({
      success: function () {
        assert.ok(false);
      },
      error: function (model, err) {
        assert.equal(err.message, 'not found');
        t();
      }
    });
  });

  it('should give error if trying to destroy non-existent model', function(t) {
    var m2 = new this.Model({
      id: m.get(m.idAttribute)
    });

    m2.destroy({
      success: function () {
        t(new Error('should not succeed destroying non-existent model'));
      },
      error: function (model, err) {
        assert.equal(err.message, 'not found');
        t();
      }
    });
  });

  it('should support custom createId function', function(t) {
    var NM = this.Model.extend({
      createId: function(cb) {
        cb(null, 'test_id');
      }
    });
    var m = new NM();
    m.save(null, {success: function() {
      assert.equal(m.id, 'test_id');
      t();
    }});
  });
};