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

Animator.prototype.getInitialPlot = function(getInitialPlotCallback) {
    var self = this;
    var firstTask = true;
    var evaluate = self.browserInterface.evaluate.bind(self.browserInterface);

    // Create job queue for async iteration.
    var queue = async.queue(function(object, callback) {
        iterate(object, callback);
    });
    queue.drain = function() {
        getInitialPlotCallback();
    };
    queue.push(self.root, function(err) {
        if (err) throw new Error(err);
    });

    // Evaluate condition code.
    var iterator = function(match, callback) {
        var code = match.conditionCode;
        evaluate(code, function(result) {
            // Call callback to emit termination signal.
            if (typeof result !== 'boolean') callback(false);
            else callback(result);
        });
    };

    function iterate(object, iterateCallback) {
        var firstStore = function(callback) { callback(); }
        var store = function(callback) {
            var code = 'parent = self';
            evaluate(code, function() { callback(); });
        };

        // Bind local self keyword to eval environment.
        var bind = function(callback) {
            var code = 'self = ' + object;
            evaluate(code, function() { callback(); });
        };

        var match = function(callback) {
            // Filter exec actions based on its condition code.
            async.filter(self.pattern.matches, iterator, function(matchedes) {
                _.each(matchedes, function(matched) {
                    var client = self.browserInterface.getClient();
                    var frame = client.currentFrame;

                    // Get object handle of current object.
                    client.requireFrameEval('self', frame, function(err, handle) {
                        // Stop iteration when type of object isn't 'object'.
                        if (err || handle.type !== 'object') {
                            callback(err);
                            return;
                        }

                        // Get action to be executed.
                        var action = _.find(self.actions, function(action) {
                            return action.name === matched.actionName;
                        });

                        // Create visual object and push it back.
                        var visualObject = new VisualObject(
                            handle,
                            matched.environment,
                            action.createActions
                        );
                        self.visualObjects.push(visualObject);

                        // Create new iteration task of next actions.
                        _.each(action.nextActions, function(action) {
                            queue.push(action.next, function(err) {
                                if (err) throw new Error(err);
                            });
                        });

                        // Call callback to emit termination signal.
                        callback();
                    });
                });
            });
        };

        var firstRestore = function(callback) {
            firstTask = false;
            callback();
        }
        var restore = function(callback) {
            var code = 'self = parent';
            evaluate(code, function() { callback(); });
        };

        // Execute above processes seriesly.
        var finial = function(err) { iterateCallback(err); }

        if (firstTask)
            async.series([firstStore, bind, match, firstRestore], finial);
        else 
            async.series([store, bind, match, restore], finial);
    }
};

module.exports = Animator;
