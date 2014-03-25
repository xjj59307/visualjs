var _ = require('underscore');
var visualjs = require('./visualjs');
var Pattern = require('./pattern');
var Action = require('./action');
var VisualObject = require('./visual-object');
var Environment = require('./environment');

// One animator controls animation logic for one object.
// It provides animation initialization and updating interface.
var Animator = function(root, code, browserInterface, callback) {
  // Construct pattern object and action objects from visualjs code.
  var ast = visualjs.parse(code);
  this.pattern = new Pattern(ast.pattern);
  this.actions = _.reduce(ast.actions, function(actions, actionNode) {
    actions.push(new Action(actionNode));
    return actions;
  }, []);

  browserInterface.evaluate(root, callback, false, -1)
};

module.exports = Animator;
