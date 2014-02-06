var Db = require('../');
var assert = require('assert');
var _ = require('lodash');
var Backbone = require('backbone');

module.exports = function (cb) {
  after(function () {
    if (cb) cb();
  });

  it('should .find from store', function (t) {
    var m = new this.Model({});
    m.fetch({
      success: function () {
        t();
      },
      error: function (err) {
        // so we get error
        t(err);
      }
    });
  });

  it('should include all the variables when saving a Model', function (t) {
    var Model = this.Model;
    var m = new Model({
      id: 1
    });
    m.save({
      variable: "123",
      counter: 1
    }, {
      success: function () {
        var m2 = new Model({
          id: 1
        });
        m2.fetch({
          success: function () {
            assert.equal(m2.get("variable"), "123");
            assert.equal(m2.get("counter"), 1);
            t();
          },
          error: function (err) {
            console.error(err);
            assert.ok(false);
          }
        });
      }
    });
  });

  it('should inc Model counter', function (t) {
    var m = new this.Model({
      id: 1
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
    m.save(null, opts);
  });

  it('should check that counter was incresed', function (t) {
    var m2 = new this.Model({
      id: 1
    });
    m2.fetch({
      success: function () {
        assert.equal(m2.get("variable"), "123");
        assert.equal(m2.get("counter"), 3);
        t();
      },
      error: function (err) {
        console.error(err);
        assert.ok(false);
      }
    });
  });

  it('should fail inc operation gracefully', function (t) {
    var m = new this.Model({
      id: 2
    });
    var opts = {
      inc: {
        attribute: 'counter',
        amount: 1
      },
      ignoreFailures: true,
      success: function (model) {
        t();
      },
      error: function (model, err) {
        console.error('ERR', err);
        assert.ok(false);
      }
    };
    m.save(null, opts);
  });

  it('should remove the model', function (t) {
    var m2 = new this.Model({
      id: 1
    });

    m2.fetch({
      success: function () {
        assert.equal(m2.get("variable"), "123");
        assert.equal(m2.get("counter"), 3);
        m2.destroy({
          success: function () {
            t();
          }
        });
      },
      error: function (err) {
        console.error(err);
        assert.ok(false);
      }
    });
  });
};