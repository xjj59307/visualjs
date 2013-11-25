var _ = require('underscore');

var CreateAction = function() {
    this.attributes = {};
}

var Action = function(tree) {
    var self = this;

    this.name = tree.name;
    this.create_actions = [];
    this.next_actions = [];

    _.each(tree.action_clauses, function() {

    });
};

