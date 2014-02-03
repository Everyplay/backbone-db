var Backbone = require('backbone');
var _ = require('lodash');
var debug = require('debug')('backbone-db');
var jsonquery = require('jsonquery');

var self = this;

function getStorage(name) {
  var storage = self.localStorage;
  var database = {};
  if (!storage) {
    // "localStorage"
    debug('creating mock storage');
    storage = {
      getItem: function (key, cb) {
        debug('getItem: ' + key);
        cb(null, database[key]);
        return database[key];
      },
      setItem: function (key, value, cb) {
        debug('setItem: ' + key + ' = ' + value);
        database[key] = value;
        cb(null, value);
      },
      removeItem: function (key, cb) {
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
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
    return result * sortOrder;
  };
}

function filterModels(models, filterOptions, callback) {
  if (!filterOptions.where) return callback(null, models);

  var filteredModels = [];
  var jq = jsonquery(filterOptions.where);

  jq.on('data', function (model) {
    filteredModels.push(model);
  });

  jq.on('end', function () {
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
  filterModels(models, options, function (err, models) {
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

var Db = Backbone.Db = function Db(name) {
  var self = this;
  if (!(self instanceof Db)) return new Db(name);
  this.name = name;
  this.storage = getStorage(this.name);
  this.store().getItem(this.name, function (err, records) {
    self.records = (records && records.split(',')) || [];
  });
};


_.extend(Backbone.Db.prototype, Backbone.Events, {
  save: function (cb) {
    this.store().setItem(this.name, JSON.stringify(this.records), function () {
      cb(null);
    });
  },
  create: function (model, options, cb) {
    debug('CREATE: ' + JSON.stringify(model));
    var self = this;
    if (model.isNew()) {
      this.createId(model, options, function (err, id) {
        model.set(model.idAttribute, id);
        store(model);
      });
    } else {
      store(model);
    }

    function store(model) {
      self.store().setItem(model.get(model.idAttribute), JSON.stringify(model), function (err, res) {
        self.records.push(model.get(model.idAttribute));
        self.save(function (err) {
          return cb(err, model.toJSON(), res);
        });
      });
    }
  },
  find: function (model, options, cb) {
    debug("FIND: " + JSON.stringify(model));
    this.store().getItem(model.get(model.idAttribute), function (err, data) {
      data = data && JSON.parse(data);
      return cb(data ? null : new Error(), data);
    });
  },
  findAll: function (model, options, cb) {
    debug("FINDALL: " + JSON.stringify(options));
    var self = this;
    var models = [];
    var done;

    if (this.records.length > 0) {
      done = _.after(this.records.length, function () {
        queryModels(models, options, cb);
      });
    } else {
      return cb(null, []);
    }

    this.records.forEach(function (id) {
      self.store().getItem(id, function (err, data) {
        data = data && JSON.parse(data);
        models.push(data);
        done();
      });
    });
  },
  destroy: function (model, options, cb) {
    debug("DESTROY: " + JSON.stringify(model));
    var self = this;
    if (model.isNew()) {
      return false;
    }
    this.store().removeItem(model.get(model.idAttribute), function () {
      self.records = _.reject(self.records, function (id) {
        return id == model.get(model.idAttribute);
      });
      self.save(function (err) {
        cb(err, model);
      });
    });
  },
  update: function (model, options, cb) {
    var self = this;
    debug('UPDATE: ' + JSON.stringify(model));
    if (model.isNew()) {
      debug('new');
      return this.create(model, options, cb);
    }
    if (options.inc) {
      return this.inc(model, options, cb);
    }
    this.store().setItem(model.get(model.idAttribute), JSON.stringify(model), function (err, res) {
      // if models created with id.
      if (self.records.indexOf(model.get(model.idAttribute)) === -1) {
        self.records.push(model.get(model.idAttribute));
      }
      cb(err, model.toJSON(), res);
    });
  },
  createId: (function (id) {
    return function (model, options, cb) {
      debug('createId: ' + id);
      cb(null, id++);
    };
  })(1),
  inc: function (model, options, cb) {
    debug('INC:', options.inc);
    var self = this;
    var attribute = options.inc.attribute;
    var amount = options.inc.amount;
    var key = model.get(model.idAttribute);
    this.store().getItem(key, function (err, data) {
      data = JSON.parse(data);
      var value = data.hasOwnProperty(attribute) ? data[attribute] : 0;
      value += amount;
      data[attribute] = value;
      self.store().setItem(key, JSON.stringify(data), function (err, res) {
        cb(err, data, res);
      });
    });
  },
  // expose "raw" storage backend.
  store: function () {
    return this.storage;
  },
  sync: function (method, model, options) {
    options = options || {};
    var self = this;
    var db;
    if (!(self instanceof Db)) {
      db = model.db || options.db ||  new Backbone.Db(model.type || model.name || model.kind || "model");
      debug('using db from model');
    } else {
      debug('using self as database');
      db = self;
    }
    debug("sync %s %s", method, JSON.stringify(options));

    function callback(err, res, resp) {
      debug('callback ' + err + " " + JSON.stringify(res));
      if ((err && options.error) || (!err && !res && options.error)) {
        err = err || new Error("not found");
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
      if (typeof model.get(model.idAttribute) !== "undefined") {
        return db.find(model, options, callback);
      } else {
        return db.findAll(model, options, callback);
      }
    }
  }
});

Db.sync = Db.prototype.sync;
module.exports = Db;