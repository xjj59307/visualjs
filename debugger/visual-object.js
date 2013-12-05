var _ = require('underscore');

var VisualNode = function(name) {
  this.name = name;
};

var VisualObject = function(objectHandle, environment, createActions) {
  this.objectHandle = objectHandle; 
  this.environment = environment;
  this.visualNodes = [];

  // Create visual nodes using create action.
};

module.exports = VisualObject;
