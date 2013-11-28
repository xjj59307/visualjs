var _ = require('underscore');
var async = require('async');
var visualjs = require('./visualjs');
var Pattern = require('./pattern');
var Action = require('./action');
var VisualObject = require('./visual-object');

// One animator controls animation logic for one object.
// It provides animation initialization and updating interface.
var Animator = function(root, code, browserInterface) {
    this.root = root;
    this.browserInterface = browserInterface;
    this.visualObjects = [];

    // Construct pattern object and action objects from visualjs code.
    var ast = visualjs.parse(code);
    this.pattern = new Pattern(ast.pattern);
    this.actions = _.reduce(ast.actions, function(actions, actionNode) {
        actions.push(new Action(actionNode));
        return actions;
    }, []);

    return this.getInitialPlot();
};

Animator.prototype.getInitialPlot = function() {
    var self = this;

    // Bind this to eval environment.
    var code = 'self = ' + this.root;
    var evaluateTask = function(callback) {
        self.browserInterface.evaluate(code, function() {
            callback();
        });
    };
    var iterateTask = function(callback) {
        self._iterate(self.root, callback);
    };

    async.series([evaluateTask, iterateTask]);
};

Animator.prototype.getPlotUpdate = function() {

};

Animator.prototype._iterate = function(object, callback) {
    var self = this;
    var iterator = function(match, _callback) {
        var code = match.conditionCode;
        self.browserInterface.evaluate(code, function(result) {
            if (typeof result === "boolean") _callback(false);
            _callback(result);
        });
    };

    async.filter(this.pattern.matches, iterator, function(matched) {
        // Construct visual object based on matched exec action.
        var client = self.getClient();           
        var frame = client.currentFrame;
        var environment = matched.environment;
        var action = _.find(this.actions, function(action) {
            return action.name === matched.actionName;  
        });

        client.requireFrameEval(self.root, frame, function(err, handle) {
            if (err || handle.type !== 'object')
                callback(err || 'Visual object is only based on object.');  

            var visualObject = new VisualObject(handle, environment, action);
            self.visualObjects.push(visualObject);
            callback();
        });
    });
};

module.exports = Animator;
