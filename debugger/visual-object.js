var _ = require('underscore');
var async = require('async');

var VisualNode = function(name, type, attributes) {
  this.name = name;
  this.type = type;
  this.attributes = attributes;
};

var VisualObject =
  function(objectHandle, environment, createActions, evaluate, callback) {
  callback = callback || function() {};

  var self = this;
  this.objectHandle = objectHandle; 
  this.environment = environment;
  this.visualNodes = [];

  // Create visual nodes using create actions.
  async.eachSeries(createActions, function(createAction, createCallback) {
    var attributes = {};
    async.each(_.pairs(createAction.attributes), function(pair, evalCallback) {
      var name = pair[0];
      // TODO: Value has three possiblities: visual node, environment variable
      // or javascript expression. Here only handled tree layout.
      var value;
      if (name === 'from' || name === 'to') {
        attributes[name] = environment.getNode(pair[1]);
        evalCallback();
      } else {
        value = environment.getValue(pair[1]);
        if (!value) {
          evaluate(pair[1], function(err, value) {
            if (!err) attribute[name] = value;
            evalCallback(err);
          });
        }
      }
    }, function(err) {
      if (!err) self.visualNodes.push(
        new VisualNode(createAction.name, createAction.node_type, attributes)
      );
      createCallback(err);
    });
  }, function(err) { callback(err); });
};

VisualObject.prototype.isNode = function(name) {
  return _.some(this.visualNodes, function(node) {
    return node.name === name;
  });
};

VisualObject.prototype.getNode = function(name) {
  return _.find(this.visualNodes, function(node) {
    return node.name === name; 
  });
};

module.exports = VisualObject;
