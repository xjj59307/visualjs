var _ = require('underscore');

var VisualNode = function(name, type) {
  this.name = name;
  this.type = type;
};

var VisualObject = function(objectHandle, environment, createActions) {
  this.objectHandle = objectHandle; 
  this.environment = environment;
  this.visualNodes = [];

  // Create visual nodes using create action.
};

VisualObject.prototype.isNode = funciton(name) {
  return _.some(this.visualNodes, function(node) {
    return node.name === name;
  });
};

VisualObject.prototype.getNode = function(name) {
  return _.find(this.visualNodes, function(node) {
    return node.name === name; 
  });
}

module.exports = VisualObject;
