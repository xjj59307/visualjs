var _ = require('underscore');

var Match = function(execNode) {
  var self = this;

  this.actionName = execNode.name;
  this.conditionCode = execNode.condition.code;
};

var Pattern = function(patternNode) {
  var self = this;

  this.name = patternNode.name;
  this.matches = [];

  _.each(patternNode.exec_clauses, function(execNode) {
    self.matches.push(new Match(execNode));
  });
};

module.exports = Pattern;
