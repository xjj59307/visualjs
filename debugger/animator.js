var _ = require('underscore');
var visualjs = require('./visualjs');
var Pattern = require('./pattern');
var Action = require('./action');
var VisualObject = require('./visual-object');

// One animator controls animation logic for one object.
// It provides animation initialization and updating interface.
var Animator = function(rootObj, code) {
    // Construct pattern object and action objects from visualjs code.
    var ast = visualjs.parse(code);
    var pattern = new Pattern(ast.pattern);
    var actions = _.reduce(ast.actions, function(actions, actionNode) {
        actions.push(new Action(actionNode));
        return actions;
    }, []);
};

Animator.prototype.initializePlot = function() {
     
};

Animator.prototype.updatePlot = function() {

};

module.exports = Animator;
