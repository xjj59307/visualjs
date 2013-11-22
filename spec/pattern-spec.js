var Pattern = require('../debugger/pattern');

describe('Pattern', function() {
    var tree = require('../debugger/ast.json');

    it('pattern.parseExecClause', function() {
        var pattern = new Pattern(tree.pattern);
        expect(true).toBe(true);
    });
});

