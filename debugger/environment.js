var _ = require('underscore');
var async = require('async');

var Environment = function(environment, visualObject, evaluate, callback) {
  callback = callback || function() {};

  var self = this;
  this.nodeTable = {};
  this.variableTable = {};

  async.each(_.pairs(environment), function(pair, _callback) {
    var name = pair[0];
    var valueStr = pair[1];

    if (visualObject.isNode(name)) {
      self.nodeTable[name] = visualObject.getNode(name);
      _callback();
    } else {
      evaluate(valueStr, function(err, value) {
        self.variableTable[name] = value; 
        _callback(err);
      });
    }
  }, function(err) { callback(err); });
};

Environment.prototype.getValue = function(name) {
  return _.has(this.variableTable, name) ? this.variableTable[name] : null;
};

Environment.prototype.getNode = function(name) {
  return _.has(this.nodeTable, name) ? this.nodeTable[name] : null;
};

module.exports = Environment;
