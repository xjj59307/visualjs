var _ = require('underscore');
var format = require('util').format;
var visualjs = require('./visualjs');
var Pattern = require('./pattern');
var Action = require('./action');
var VisualObject = require('./visual-object');
var Environment = require('./environment');
var TARGET = '__visualObject__'; 

// One animator controls animation logic for one object.
// It provides animation initialization and updating interface.
var Animator = function(objectStr, code, browserInterface, callback) {
  var self = this;
  this.browserInterface = browserInterface;
  this.visualObjects = [];

  // Construct pattern object and action objects from visualjs code.
  var ast = visualjs.parse(code);
  this.pattern = new Pattern(ast.pattern);
  this.actions = _.reduce(ast.actions, function(actions, actionNode) {
    actions.push(new Action(actionNode));
    return actions;
  }, []);

  // Get deep copy of the object and update its visual objects.
  this._assignGUID(objectStr, function(err, object) {
    if (!err) self._update(object);

    callback(err);
  });
};

Animator.prototype._assignGUID = function(target, callback) {
  // generation of RFC 4122 UUIDS
  var guid = function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

  var assign = function assign(object) {
    if (typeof object !== 'object') return;

    if (!object.__handle__) object.__handle__ = guid();

    for (prop in object)
      if (typeof object[prop] === 'object') assign(object[prop]);
  }; 

  var code = format('%s = %s;', TARGET, target) + guid.toString() +
    assign.toString() + format('assign(%s);', TARGET) + TARGET;

  // Get deep copy of the object and update its visual objects.
  this.browserInterface.evaluate(code, callback);
};

Animator.prototype.update = function(callback) {
  var self = this;
  this.visualObjects = [];

  this._assignGUID(TARGET, function(err, object) {
    if (!err) self._update(object);

    callback(err);
  });
};

// Update visual objects.
// TODO: Handle exception thrown by eval calling.
Animator.prototype._update = function(object) {
  // Variable name self might be used in following eval.
  // Avoid using any variable naming self in realted code!
  var instance = this;

  var iterate = function(target, environment) {
    // Bind self keyword for current node.
    eval(format('global.self = %s;', target));
    if (_.isUndefined(global.self) || _.isNull(global.self)) return;

    // Filter exec actions based on its condition code.
    var matched = _.find(instance.pattern.matches, function(match) {
      var result = eval(match.conditionCode);
      return (typeof result === 'boolean') ? result : false;
    });
    if (_.isUndefined(matched)) return;

    // Get action to be executed.
    var matchedAction = _.find(instance.actions, function(action) {
      return action.name === matched.actionName;
    });

    // Create visual object and push it back.
    var visualObject = new VisualObject(
      global.self.__handle__, environment, matchedAction.createActions);
    instance.visualObjects.push(visualObject);

    var currentSelf = global.self;

    // Handle next iterations.
    _.each(matchedAction.nextActions, function(nextAction) {
      var environment = new Environment(nextAction.environment, visualObject);
      iterate(nextAction.next, environment);
      global.self = currentSelf;
    });
  };

  // Create an empty environment at first.
  iterate('object', new Environment({}));
};

// Generate initial graph based on visual objects.
Animator.prototype.getInitialGraph = function() {
  var visualNodes = [];
  var id = 0;

  // Generate unique id for each visual node.
  _.each(this.visualObjects, function(visualObject) {
    _.each(visualObject.visualNodes, function(visualNode) {
      visualNode.id = id++;
      visualNodes.push(visualNode);
    });
  });

  // Use id to replace object reference.
  _.each(visualNodes, function(visualNode) {
    var attributes = visualNode.attributes;
    _.each(['from', 'to'], function(name) {
      if (_.has(attributes, name) && attributes[name])
        attributes[name] = attributes[name].id;
    });
  });

  return visualNodes;
};

module.exports = Animator;
