var Backbone = require('backbone');
var _ = require('lodash');
var debug = require('debug')('backbone-db');
var jsonquery = require('jsonquery');

var self = this;

function getStorage() {
  var storage = self.localStorage;
  var database = {};
  if (!storage) {
    // "localStorage"
    debug('creating mock storage');
    storage = {
      getItem: function(key, cb) {
        debug('getItem: ' + key);
        cb(null, database[key]);
        return database[key];
      },
      setItem: function(key, value, cb) {
        debug('setItem: ' + key + ' = ' + value);
        database[key] = value;
        cb(null, value);
      },
      removeItem: function(key, cb) {
        debug('removeItem: ' + key);
        delete database[key];
        cb(null, true);
      }
    };
  }
  return storage;
}

// in-memory sort, just for mocking db functionality
function sort(property) {
  // sort by multiple properties
  function multisort(properties) {
    return function multiCompare(a, b) {
      var i = 0;
      var result = 0;
      var numberOfProperties = properties.length;
      while(result === 0 && i < numberOfProperties) {
          result = sort(properties[i])(a, b);
          i++;
      }
      return result;
    };
  }

  if (_.isArray(property)) return multisort(property);
  debug('sorting by %s', property || '');
  var sortOrder = 1;
  if (property[0] === '-') {
    sortOrder = -1;
    property = property.substr(1);
  }
  function compare(a, b) {
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  }
  return compare;
}

function filterModels(models, filterOptions, callback) {
  if (!filterOptions.where) return callback(null, models);
  debug('filtering results: %s', JSON.stringify(filterOptions));
  var filteredModels = [];

  filterOptions.where = _.mapValues(filterOptions.where, function(val) {
    if (typeof val === 'object' && val.toString && val.toString().length === 24) {
      return val.toString();
    } else {
      return val;
    }
  });

  var jq = jsonquery(filterOptions.where);

  jq.on('data', function(model) {
    filteredModels.push(model);
  });

  jq.on('end', function() {
    callback(null, filteredModels);
  });

  _.map(models, jq.write);
  jq.end();
}

// mock sort, offset, after_id, before_id, limit & filtering
function queryModels(models, options, callback) {
  var i;
  var offset = options.offset ? options.offset : 0;
  var limit = options.limit ? options.limit : models.length;
  filterModels(models, options, function(err, models) {
    if (options.sort) models.sort(sort(options.sort));
    if (options.after_id) {
      for (i = 0; i < models.length; i++) {
        if (models[i].id === options.after_id) {
          offset = i + 1;
          break;
        }
      }
    }
    if (options.before_id) {
      for (i = 0; i < models.length; i++) {
        if (models[i].id === options.before_id) {
          offset = i - limit;
          if (offset < 0) offset = 0;
          break;
        }
      }
    }
    models = models.splice(offset, limit);
    callback(err, models);
  });

}

var getKey = function(model) {
  if (!model.url) return getKey(model);
  return _.isFunction(model.url) ? model.url() : model.url;
};

var Db = Backbone.Db = function Db(name) {
  var self = this;
  if (!(self instanceof Db)) return new Db(name);
  this.name = name;
  this.storage = getStorage(this.name);
  this.store().getItem(this.name, function(err, records) {
    self.records = (records && records.split(',')) || [];
  });
};


_.extend(Backbone.Db.prototype, Backbone.Events, {
  save: function(cb) {
    this.store().setItem(this.name, JSON.stringify(this.records), function() {
      cb(null);
    });
  },

  create: function(model, options, cb) {
    debug('CREATE: ' + JSON.stringify(model));
    var self = this;

    function store(model) {
      self.store().setItem(getKey(model), JSON.stringify(model), function(err, res) {
        self.records.push(getKey(model));
        self.save(function(err) {
          return cb(err, model.toJSON(options), res);
        });
      });
    }

    if (model.isNew()) {
      this.createId(model, options, function(err, id) {
        store(model);
      });
    } else {
      store(model);
    }
  },

  find: function(model, options, cb) {
    debug('FIND: ' + JSON.stringify(model));
    this.store().getItem(getKey(model), function(err, data) {
      data = data && JSON.parse(data);
      var error = err || data ? null : new Error('not found');
      return cb(error, data);
    });
  },

  findAll: function(model, options, cb) {
    debug('FINDALL: ' + JSON.stringify(options));
    var self = this;
    var models = [];
    var done;

    if (!model.model) {
      debug('fetch model');
      var indexedKeys = _.pluck(model.indexes, 'property');
      var objectKeys = Object.keys(model.attributes);
      var searchAttrs = {};
      var allIndexed = _.each(objectKeys, function(attr) {
        if (indexedKeys.indexOf(attr) > -1) {
          searchAttrs[attr] = model.get(attr);
        }
      });
      if (!Object.keys(searchAttrs).length) {
        var err = new Error('Cannot fetch model with given attributes');
        return cb(err);
      }
      options.where = searchAttrs;
    }

    if (this.records.length > 0) {
      done = _.after(this.records.length, function() {
        queryModels(models, options, function(err, results) {
          if (!model.model) {
            if (!results || results.length === 0) {
              err = err || new Error('not found');
            }
            return cb(err, results && results.length && results[0]);
          }
          cb(err, results);
        });
      });
    } else {
      return cb(null, []);
    }

    this.records.forEach(function(id) {
      self.store().getItem(id, function(err, data) {
        data = data && JSON.parse(data);
        models.push(data);
        done();
      });
    });
  },

  destroy: function(model, options, cb) {
    debug('DESTROY: ' + JSON.stringify(model));
    var self = this;
    if (model.isNew()) {
      return false;
    }
    this.store().removeItem(getKey(model), function() {
      var found = false;
      self.records = _.reject(self.records, function(id) {
        var itemFound = id === getKey(model);
        if (!found) found = itemFound;
        return itemFound;
      });
      if (!found) return cb(new Error('not found'));
      self.save(function(err) {
        cb(err, model);
      });
    });
  },

  update: function(model, options, cb) {
    var self = this;
    debug('UPDATE: ' + JSON.stringify(model));
    if (model.isNew()) {
      debug('new');
      return this.create(model, options, cb);
    }
    if (options.inc) {
      return this.inc(model, options, cb);
    }
    var id = getKey(model);
    this.store().getItem(id, function(err, data) {
      data = data && JSON.parse(data);
      var modelData = model.toJSON(options);
      // Support for non plain object JSON types.
      if (_.isPlainObject(data) && _.isPlainObject(modelData)) {
        _.merge(data, modelData);
      } else {
        data = modelData;
      }
      self.store().setItem(id, JSON.stringify(data), function(err, res) {
        // if models created with id.
        if (self.records.indexOf(getKey(model)) === -1) {
          self.records.push(getKey(model));
        }
        cb(err, model.toJSON(options), res);
      });
    });
  },

  _createDefaultId: (function(id) {
    return function(callback) {
      debug('_createDefaultId');
      callback(null, id++);
    };
  })(1),

  createId: function(model, options, callback) {
    debug('createId');
    var createIdFn = model.createId ? _.bind(model.createId, model) : this._createDefaultId;
    createIdFn(function(err, id) {
      model.set(model.idAttribute, id);
      callback(err);
    });
  },

  inc: function(model, options, cb) {
    debug('INC:', options.inc);
    var self = this;
    var attribute = options.inc.attribute;
    var amount = options.inc.amount;
    var key = getKey(model);
    this.store().getItem(key, function(err, data) {
      if (err || !data) {
        if (options.ignoreFailures) {
          return cb(null, model);
        }
        return cb(err || new Error('Cannot INC, not found.'));
      }
      data = JSON.parse(data);
      var value = data.hasOwnProperty(attribute) ? data[attribute] : 0;
      value += amount;
      data[attribute] = value;
      self.store().setItem(key, JSON.stringify(data), function(err, res) {
        cb(err, data, res);
      });
    });
  },

  // expose "raw" storage backend.
  store: function() {
    return this.storage;
  },

  sync: function(method, model, options) {
    options = options || {};
    var self = this;
    var db;
    if (!(self instanceof Db)) {
      db = model.db || options.db || new Backbone.Db(model.type || model.name || model.kind || 'model');
      debug('using db from model');
    } else {
      debug('using self as database');
      db = self;
    }
    debug('sync %s %s %s %s', method, model.type, JSON.stringify(model.toJSON(options)), JSON.stringify(options));

    function callback(err, res, resp) {
      debug('callback ' + err + ' ' + JSON.stringify(res));
      if ((err && options.error) || (!err && !res && options.error)) {
        err = err || new Error('not found');
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
module.exports = Db;