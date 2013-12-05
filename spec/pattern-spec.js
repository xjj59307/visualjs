var _ = require('underscore');
var Pattern = require('../debugger/pattern');

describe('Pattern', function() {
  var tree = require('../debugger/ast.json');
  var pattern = new Pattern(tree.pattern);

  it('operator pattern: name', function() {
    expect(pattern.name).toBe('operator');
  });

  it('operator pattern: exec action', function() {
    var match = _.first(pattern.matches); 
    expect(match.actionName).toBe('plus');
    expect(match.conditionCode).toBe('this.op === 0');

    var environment = {
      op: '\'+\'',
      parent: 'node'
    };
    expect(match.environment).toEqual(environment);
  });
});

