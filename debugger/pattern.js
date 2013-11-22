var _ = require('underscore');

var Match = function(actionName, conditionCode) {
    this.actionName = actionName; 
    this.conditionCode = conditionCode;
    this.environment = {};
};

Match.prototype.addEnvironmentVariable = function(name, value){
    this.environment[name] = value;
};

var Pattern = function(tree) {
    var self = this;

    this.name = tree.name;
    this.matches = [];

    _.each(tree.exec_clauses, function(exec_clause) {
        self.parseExecClause(exec_clause);
    });
};

Pattern.prototype.parseExecClause = function(tree) {
    var actionName = tree.name;
    var conditionCode = tree.condition.code;
    var match = new Match(actionName, conditionCode);

    _.each(tree.environment, function(variable) {
        match.addEnvironmentVariable(variable.name, variable.value);
    });

    this.matches.push(match);
};

module.exports = Pattern;
