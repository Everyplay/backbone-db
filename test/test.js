var Db = require('../lib/db');
var Backbone = require('backbone');

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
    this.IndexedModel = this.Model.extend({
      type: 'indexed',
      indexes: [
        {property: 'some_id'}
      ]
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
    after(function () {
      this.db = new Db('mymodels');
      this.Collection.prototype.db = this.db;
      this.Model.prototype.db = this.db;
    });
    require('./test.model.js')();
  });

  describe('Collection', function () {
    after(function () {
      this.db = new Db('mymodels');
      this.Collection.prototype.db = this.db;
      this.Model.prototype.db = this.db;
    });
    require('./test.collection.js')();
  });
});
