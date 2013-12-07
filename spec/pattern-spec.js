var _ = require('underscore');
var Pattern = require('../debugger/pattern');

describe('Pattern', function() {
  var tree = require('../debugger/ast.json');
  var pattern = new Pattern(tree.pattern);

  it('operator pattern: name', function() {
    expect(pattern.name).toBe('operator');
  });

  it('operator pattern: exec action', function() {
    var firstMatch = pattern.matches[0]; 
    expect(firstMatch.actionName).toBe('plus');
    expect(firstMatch.conditionCode).toBe('self.op === 0');

    var secondMatch = pattern.matches[1];
    expect(secondMatch.actionName).toBe('minus');
    expect(secondMatch.conditionCode).toBe('self.op === 1');

    var thirdMatch = pattern.matches[2];
    expect(thirdMatch.actionName).toBe('times');
    expect(thirdMatch.conditionCode).toBe('self.op === 2');

    var fourthMatch = pattern.matches[3];
    expect(fourthMatch.actionName).toBe('divide');
    expect(fourthMatch.conditionCode).toBe('self.op === 3');
  });
});

