var Db = require('../');
var Backbone = require('backbone');
var _ = require('lodash');
describe('backbone-db', function () {
  before(function () {
    this.db = new Db('mymodels');
    this.Model = Backbone.Model.extend({
      url: function () {
        if (this.isNew()) {
          return 'mymodels';
        }
        return 'mymodels:' + this.get(this.idAttribute);
      },
      db: this.db,
      sync: this.db.sync
    });
    this.Collection = Backbone.Collection.extend({
      url: function () {
        return 'mymodels';
      },
      model: this.Model,
      db: this.db,
      sync: this.db.sync
    });
  });


  describe('Model', function () {
    require('./test.model.js')();
    after(function () {
      this.db = new Db('mymodels');
      this.Collection.prototype.db = this.db;
      this.Model.prototype.db = this.db;
    });
  });

  describe('Collection', function () {
    require('./test.collection.js')();
    after(function () {
      this.db = new Db('mymodels');
      this.Collection.prototype.db = this.db;
      this.Model.prototype.db = this.db;
    });
  });
});