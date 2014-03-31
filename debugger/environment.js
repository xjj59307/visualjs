var _ = require('underscore');
var async = require('async');

// TODO: Nested environment.
var Environment = function(origin, visualObject) {
  // Variable name self might be used in following eval.
  var instance = this;
  this.nodeTable = {};
  this.variableTable = {};

  _.each(_.pairs(origin), function(pair) {
    var name = pair[0];
    var valueStr = pair[1];

    if (visualObject.isNode(valueStr))
      instance.nodeTable[name] = visualObject.getNode(valueStr);
    else
      instance.variableTable[name] = eval(valueStr); 
  });
};

Environment.prototype.getValue = function(name) {
  return _.has(this.variableTable, name) ? this.variableTable[name] : null;
};

Environment.prototype.getNode = function(name) {
  return _.has(this.nodeTable, name) ? this.nodeTable[name] : null;
};

module.exports = Environment;
