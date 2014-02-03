var DB = require('../');
var _ = require('lodash');
var Backbone = require('backbone');


/* invokes the correct DB interface methods on this or this.db


// backbone-db .sync delegates CREATE, READ, UPDATE and DELETE to this interface
_.extend(DB.prototype, Backbone.Events, {
  find: function(model, options, cb) {},
  findAll: function(model, options, cb) {},
  read: function(model, options, cb) {},
  update: function(model, options, cb) {},
  destroy: function(model, options, cb) {},
  sync: function(method, model ,options) {} // sync delegates ti the methods above, should not be extended.
});
*/

var store = new DB('mymodels');

var MyModel = Backbone.Model.extend({
  url: function() {
    if(this.isNew()) {
      return '/mymodels';
    }
    return '/mymodels/' + this.get(this.idAttribute);
  },
  db: store,
  sync: store.sync
});

var me = new MyModel({username:"Nomon"});

me.save(null, {success: function() {
  var me2 = new MyModel({id:me.get(me.idAttribute)});
  me2.fetch({success: function(model) {
    console.log("My username:",model.get('username'));
  }});
}, error: function(err) {
  console.error(err);
}});