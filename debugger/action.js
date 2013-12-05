var _ = require('underscore');

var CreateAction = function(subActionNode) {
  var self = this;

  this.name = _.has(subActionNode.node, 'name') ?
    subActionNode.node.name : null;
  this.node_type = subActionNode.node.node_type;
  this.attributes = {};

  _.each(subActionNode.attributes, function(attribute) {
    self.attributes[attribute.name] = attribute.value;   
  });
};

var NextAction = function(subActionNode) {
  this.next = subActionNode.object; 
};

var Action = function(actionNode) {
  var self = this;

  this.name = actionNode.name;
  this.createActions = [];
  this.nextActions = [];

  _.each(actionNode.action_clauses, function(subActionNode) {
    switch (subActionNode.type) {
      case 'create_clause':
        self.createActions.push(new CreateAction(subActionNode));
      break;
      case 'next_clause':
        self.nextActions.push(new NextAction(subActionNode));
      break;
      default:
        throw new Error('Unknown type of action clause.');
    } 
  });
};

module.exports = Action;
