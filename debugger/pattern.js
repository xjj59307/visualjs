var _ = require('underscore');

var Match = function(exec_node) {
    var self = this;

    this.actionName = exec_node.name;
    this.conditionCode = exec_node.condition.code;
    this.environment = {};

    _.each(exec_node.environment, function(variable) {
        self.environment[variable.name] = variable.value;
    });
};

var Pattern = function(pattern_node) {
    var self = this;

    this.name = pattern_node.name;
    this.matches = [];

    _.each(pattern_node.exec_clauses, function(exec_node) {
        self.matches.push(new Match(exec_node));
    });
};

module.exports = Pattern;
