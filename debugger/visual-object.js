var _ = require('underscore');
var async = require('async');

var VisualNode = function(name, type, attributes) {
  this.name = name;
  this.type = type;
  this.attributes = attributes;
};

var VisualObject = function(environment, createActions) {
  // Variable name self might be used in following eval.
  var instance = this;
  this.environment = environment;
  this.visualNodes = [];

  // Create visual nodes using create actions.
  _.each(createActions, function(createAction) {
    var attributes = {};

    _.each(_.pairs(createAction.attributes), function(pair) {
      var name = pair[0];
      var valueStr = pair[1];

      // TODO: Value has three possiblities: visual node, environment variable
      // or javascript expression. Here only handled tree layout.
      if (name === 'from' || name === 'to') {
        attributes[name] =
          environment.getNode(valueStr) || instance.getNode(valueStr);
      } else {
        var value = environment.getValue(valueStr);
        if (_.isNull(value)) value = eval(valueStr);
        attributes[name] = value;
      }
    });

    instance.visualNodes.push(
      new VisualNode(createAction.name, createAction.node_type, attributes));
  });
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
