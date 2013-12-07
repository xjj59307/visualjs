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
    var firstCreateAction = plusAction.createActions[0];
    expect(firstCreateAction.name).toBe('node');
    expect(firstCreateAction.node_type).toBe('tree_node');

    var attributes = { label: 'op' };
    expect(firstCreateAction.attributes).toEqual(attributes);

    var secondCreateAction = plusAction.createActions[1];
    expect(secondCreateAction.name).toBeNull();
    expect(secondCreateAction.node_type).toBe('tree_edge');

    var attributes = { from: 'parent', to: 'node' };
    expect(secondCreateAction.attributes).toEqual(attributes);
  });

  it('plus action: next aciton', function() {
    var firstNextAction = plusAction.nextActions[0];
    expect(firstNextAction.next).toBe('self.left');

    var environment = { op: '\'+\'', parent: 'node' };
    expect(firstNextAction.environment).toEqual(environment);

    var secondNextAction = plusAction.nextActions[1];
    expect(secondNextAction.next).toBe('self.right');

    var environment = { op: '\'+\'', parent: 'node' };
    expect(secondNextAction.environment).toEqual(environment);
  });
});
