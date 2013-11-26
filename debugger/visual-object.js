var _ = require('underscore');

var VisualObject = function(objectHandle, environment) {
    this.objectHandle = objectHandle; 
    this.environment = environment;
};

module.exports = VisualObject;
