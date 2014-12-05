var Backbone = require('backdash');
var _ = require('lodash');
var debug = require('debug')('backbone-db');
var errors = require('./errors');
var pff = require('pff');

var Db = Backbone.Db = function Db(name) {
  var self = this;
  if (!(self instanceof Db)) return new Db(name);
  this.name = name;
};

_.extend(Backbone.Db.prototype, Backbone.Events, {
  save: function(cb) {
    throw new Error('save is not implemented');
  },

  create: function(model, options, cb) {
    throw new Error('create is not implemented');
  },

  find: function(model, options, cb) {
    throw new Error('find is not implemented');
  },

  findAll: function(model, options, cb) {
    throw new Error('findAll is not implemented');
  },

  destroy: function(model, options, cb) {
    throw new Error('destroy is not implemented');
  },

  update: function(model, options, cb) {
    throw new Error('update is not implemented');
  },

  sync: function(method, model, options) {
    options = options || {};
    var self = this;
    var db;
    if (!(self instanceof Db)) {
      db = model.db || options.db;
      debug('using db from model');
    } else {
      debug('using self as database');
      db = self;
    }

    debug('sync %s %s %s %s',
      method,
      model.type,
      JSON.stringify(model.toJSON(options)),
      JSON.stringify(options)
    );

    var start = Date.now();

    function callback(err, res, resp) {
      debug('callback ' + err + ' ' + JSON.stringify(res));
      var elapsed = Date.now() - start;
      var syncInfo = {
        method: method,
        type: model.type,
        elapsed: elapsed,
        model: model.toJSON(options),
        res: JSON.stringify(res)
      };
      if (err) {
        syncInfo.error = err;
      }
      if (options && options.where) {
        syncInfo.where = _.clone(options.where);
      }
      if (db.trigger) {
        db.trigger('sync_info', syncInfo);
      }
      if ((err && options.error) || (!err && !res && options.error)) {
        var errorMsg = pff('%s (%s) not found', model.type, model.id);
        err = err || new errors.NotFoundError(errorMsg);
        return options.error(err, resp);
      } else if (options.success && res) {
        debug('success %s', JSON.stringify(res));
        return options.success(res, resp);
      }
    }

    switch (method) {
      case 'create':
        return db.create(model, options, callback);
      case 'update':
        return db.update(model, options, callback);
      case 'delete':
        return db.destroy(model, options, callback);
      case 'read':
        if (typeof model.get(model.idAttribute) !== 'undefined') {
          return db.find(model, options, callback);
        } else {
          return db.findAll(model, options, callback);
        }
    }
  }
});

Db.sync = Db.prototype.sync;
Db.errors = errors;
module.exports = Db;
