var _ = require('underscore');
var Action = require('../debugger/action');

describe('Action', function() {
    var tree = require('../debugger/ast.json');
    var actions = _.reduce(tree.actions, function(actions, action_node) {
        actions.push(new Action(action_node));
        return actions;
    }, []);
    var plus_action = _.first(actions);

    it('plus action: name', function() {
        expect(plus_action.name).toBe('plus');
    });

    it('plus action: create action', function() {
        var first_create_sub_action = _.first(plus_action.create_actions);
        expect(first_create_sub_action.name).toBe('node');
        expect(first_create_sub_action.node_type).toBe('tree_node');

        var attributes = { label: 'op' };
        expect(first_create_sub_action.attributes).toEqual(attributes);
    });

    it('plus action: next aciton', function() {
        var first_next_action = _.first(plus_action.next_actions);
        expect(first_next_action.next).toBe('this.left');
    });
});
