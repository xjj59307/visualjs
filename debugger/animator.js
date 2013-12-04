var _ = require('underscore');
var util = require('util');
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

// TODO: Solve the problem of name collision.
Animator.prototype.getInitialPlot = function(getInitialPlotCallback) {
    var self = this;
    var root = true;
    var taskIndex = 0;
    var evaluate = self.browserInterface.evaluate.bind(self.browserInterface);

    // Create job queue for async iteration.
    var queue = async.queue(function(task, callback) {
        iterate(task, callback);
    });
    queue.drain = function() {
        getInitialPlotCallback();
    };
    var rootTask = {
        index: taskIndex,
        object: self.root
    };
    queue.push(rootTask, function(err) {
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

    function iterate(task, iterateCallback) {
        var roll = function(callback) {
            var code = 'parents = nextParents.slice(0)';
            evaluate(code, function() {
                taskIndex = 0;
                callback();
            });
        };

        // Bind local self keyword to eval environment.
        var bind = function(callback) {
            var code;

            if (root) {
                code = util.format('self = %s, nextParents = [], handles = {}', task.object);
                root = false;
            } else {
                code = util.format('self = parents[%d], self = %s', task.index, task.object);
            }

            evaluate(code, function(obj) { callback(); });
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
                            handle.handle,
                            matched.environment,
                            action.createActions
                        );
                        self.visualObjects.push(visualObject);

                        // Create new iteration task of next actions.
                        var nextTasks = _.map(action.nextActions,
                            function(nextAction) {
                                var nextTask = {
                                    index: taskIndex++,
                                    object: nextAction.next
                                };
                                queue.push(nextTask, function(err) {
                                    if (err) throw new Error(err);
                                });

                                return nextTask;
                            }
                        );

                        // Call callback to emit termination signal.
                        evaluate(util.format('handles[%d] = self', handle.handle), function() {
                            async.each(nextTasks, function(nextTask, _callback) {
                                var code = util.format(
                                    'nextParents[%d] = handles[%d]',
                                    nextTask.index, handle.handle
                                );
                                evaluate(code, function() {
                                    _callback();
                                });
                            }, function() { callback(); });
                        });
                    });
                });
            });
        };

        // Execute above processes seriesly.
        var finial = function(err) { iterateCallback(err); }
        var tasks;

        if (!root && task.index === 0) tasks = [roll, bind, match];
        else tasks = [bind, match];    

        async.series(tasks, finial);
    }
};

module.exports = Animator;
