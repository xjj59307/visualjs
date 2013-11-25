var _ = require('underscore');
var Action = require('../debugger/action');

describe('Action', function() {
    var tree = require('../debugger/ast.json');
    var actions = _.reduce(tree.actions, function(actions, actionNode) {
        actions.push(new Action(actionNode));
        return actions;
    }, []);
    var plusAction = _.first(actions);

    it('plus action: name', function() {
        expect(plusAction.name).toBe('plus');
    });

    it('plus action: create action', function() {
        var firstCreateAction = _.first(plusAction.createActions);
        expect(firstCreateAction.name).toBe('node');
        expect(firstCreateAction.node_type).toBe('tree_node');

        var attributes = { label: 'op' };
        expect(firstCreateAction.attributes).toEqual(attributes);
    });

    it('plus action: next aciton', function() {
        var firstNextAction = _.first(plusAction.nextActions);
        expect(firstNextAction.next).toBe('this.left');
    });
});
