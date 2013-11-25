var _ = require('underscore');

var CreateAction = function(sub_action_node) {
    var self = this;

    this.name = _.has(sub_action_node.node, 'name') ?
        sub_action_node.node.name : null;
    this.node_type = sub_action_node.node.node_type;
    this.attributes = {};

    _.each(sub_action_node.attributes, function(attribute) {
        self.attributes[attribute.name] = attribute.value;   
    });
};

var NextAction = function(sub_action_node) {
    this.next = sub_action_node.object; 
};

var Action = function(action_node) {
    var self = this;

    this.name = action_node.name;
    this.create_actions = [];
    this.next_actions = [];

    _.each(action_node.action_clauses, function(sub_action_node) {
        switch (sub_action_node.type) {
            case 'create_clause':
                self.create_actions.push(new CreateAction(sub_action_node));
                break;
            case 'next_clause':
                self.next_actions.push(new NextAction(sub_action_node));
                break;
            default:
                throw new Error('Unknown type of action clause.');
        } 
    });
};

module.exports = Action;
