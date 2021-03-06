var _ = require('underscore');
var util = require('util');
var async = require('async');
var buckets = require('buckets');
var Client = require('./client');
var JobQueue = require('./job-queue');
var JOB = require('./enum').JOB;
var TASK = require('./enum').TASK;
var Animator = require('./animator');

var addListeners = function(browserInterface, jobQueue) {
  var handleStepJob = function(task) {
    jobQueue.addTask(task);
    jobQueue.addTask(TASK.REQUIRE_SOURCE);
    jobQueue.addTask(TASK.UPDATE_VIS);
  };

  jobQueue.on(JOB.RUN, function(job) {
    handleStepJob(TASK.RUN);

    browserInterface.run(function() {
      browserInterface.handles = job.data;
      browserInterface.finishTask(TASK.RUN);
    });
  });

  jobQueue.on(JOB.STEP_IN, function(job) {
    handleStepJob(TASK.STEP_IN);

    browserInterface.in(function() {
      browserInterface.handles = job.data;
      browserInterface.finishTask(TASK.STEP_IN);
    });
  });

  jobQueue.on(JOB.STEP_OVER, function(job) {
    handleStepJob(TASK.STEP_OVER);

    browserInterface.over(function() {
      browserInterface.handles = job.data;
      browserInterface.finishTask(TASK.STEP_OVER);
    });
  });

  jobQueue.on(JOB.STEP_OUT, function(job) {
    handleStepJob(TASK.STEP_OUT);

    browserInterface.out(function() {
      browserInterface.handles = job.data;
      browserInterface.finishTask(TASK.STEP_OUT);
    });
  });

  jobQueue.on(JOB.SET_BREAKPOINT, function(job) {
    browserInterface.setBreakpoint(job.data, function(err, line) {
      browserInterface.getSocket().emit('set breakpoint', err || line);
      browserInterface.finishTask(TASK.SET_BREAKPOINT);
    });
  });

  jobQueue.on(JOB.CLEAR_BREAKPOINT, function(job) {
    browserInterface.clearBreakpoint(job.data, function(err, line) {
      browserInterface.getSocket().emit('clear breakpoint', err || line);
      browserInterface.finishTask(TASK.CLEAR_BREAKPOINT);
    });
  });

  jobQueue.on(JOB.REQUIRE_SOURCE, function() {
    jobQueue.addTask(TASK.REQUIRE_SOURCE);

    browserInterface.requireSource(function(source, currentLine) {
      browserInterface.getSocket().emit('update source', {
        source: source,
        currentLine: currentLine
      });
      browserInterface.finishTask(TASK.REQUIRE_SOURCE);
    });
  });

  jobQueue.on(JOB.NEW_EXPRESSION, function(job) {
    jobQueue.addTask(TASK.NEW_EXPRESSION);

    var expr = job.data.expr;
    browserInterface.addExpr(expr, function(err, visualNodes) {
      if (visualNodes.length === 0) err = err || 'target object has no shape';

      browserInterface.getHandles(job.data.watch, function(handles) {
        browserInterface.getSocket().emit(
          'update view', err, visualNodes, handles);

        if (err) delete browserInterface.animator;
        browserInterface.finishTask(TASK.NEW_EXPRESSION);
      });
    });
  });

  jobQueue.on(JOB.HIGHLIGHT, function(job) {
    jobQueue.addTask(TASK.HIGHLIGHT);

    browserInterface.getHandles(job.data, function(handles) {
      browserInterface.getSocket().emit('highlight', handles);

      browserInterface.finishTask(TASK.HIGHLIGHT);
    });
  });

  jobQueue.on(JOB.EVALUATE, function(job) {
    jobQueue.addTask(TASK.EVALUATE);

    var expr = job.data;
    browserInterface.evaluate(expr, 1, function(err, object) {
      // delete __handle__ from object
      (function removeHandle(object) {
        if (typeof object !== 'object') return;

        delete object.__handle__;

        // typeof null is 'object'
        _.each(_.values(object), function(value) {
          if (typeof value === 'object' && value) removeHandle(value);
        });
      })(object);

      browserInterface.getSocket().emit('evaluate', err || object);

      browserInterface.finishTask(TASK.EVALUATE);
    });
  });
};

var BrowserInterface = function() {
  var self = this;

  // expression list to evluate when stepping through
  this.jobQueue = new JobQueue();
  addListeners(this, this.jobQueue);

  // Connect to debugger automatically
  this.client = new Client();
  this.client.currentLine = 0;
  this.client.currentColumn = 0;

  this.client.on('break', function(res) {
    self._handleBreak(res);
  });

  // TODO: handle exception
  this.client.on('exception', function(res) {
    throw new Error(res);
  });

  this.client.connectToNode();
};

BrowserInterface.prototype.setSource = function(source) {
  this.source = source;
};

BrowserInterface.prototype.setSocket = function(socket) {
  this.socket = socket;
  this.jobQueue.reset();
};

BrowserInterface.prototype.getSocket = function() {
  return this.socket;
};

BrowserInterface.prototype.getClient = function() {
  return this.client;
};

BrowserInterface.prototype.addJob = function(job) {
  this.jobQueue.addJob(job);
};

BrowserInterface.prototype.finishTask = function(task) {
  this.jobQueue.finishTask(task);
};

BrowserInterface.prototype.addExpr = function(expr, callback) {
  var self = this;

  // TODO: Read visjs file from client.
  // the filename of visjs file must be consistent with js file
  var code =
    '' + require('fs').readFileSync(this.source.slice(0, -2) + 'visjs');

  this.animator = new Animator(expr, code, this, function(err) {
    callback(err, self.animator.getInitialGraph());
  });
};

BrowserInterface.prototype._requireConnection = function() {
  if (!this.client) {
    console.log('Connection isn\'t established'.red);  
    return false;
  }
  return true;
};

BrowserInterface.prototype._handleBreak = function(res) {
  var self = this;

  this.client.currentLine = res.sourceLine;
  this.client.currentColumn = res.sourceColumn;
  this.client.currentFrame = 0;

  // inform client to update source
  if (_.has(this, 'socket'))
    this.requireSource(function(source, currentLine) {
      self.socket.emit('update source', {
        source: source,
        currentLine: currentLine
      });
      self.finishTask(TASK.REQUIRE_SOURCE);
    });

  // inform client to update view
  if (_.has(this, 'animator'))
    this.animator.update(function(err) {
      self.getHandles(self.handles, function(handles) {
        var visualNodes = self.animator.getInitialGraph();
        if (visualNodes.length === 0) err = err || 'target object has no shape';

        self.getSocket().emit('update view', err, visualNodes, handles);
        self.finishTask(TASK.UPDATE_VIS); 
      });
    });
  else
    self.finishTask(TASK.UPDATE_VIS);
};

// Returns `true` if "err" is a SyntaxError, `false` otherwise.
// This function filters out false positives likes JSON.parse() errors and
// RegExp syntax errors.
var isSyntaxError = function(err) {
  // Convert error to string
  err = err && (err.stack || err.toString());
  return err &&
    err.match(/^SyntaxError/) &&
    // RegExp syntax error
    !err.match(/^SyntaxError: Invalid regular expression/) &&
    !err.match(/^SyntaxError: Invalid flags supplied to RegExp constructor/) &&
    // JSON.parse() error
    !(err.match(/^SyntaxError: Unexpected (token .*|end of input)/) &&
    err.match(/\n    at Object.parse \(native\)\n/));
};

BrowserInterface.prototype.evaluate = function(code, depth, callback) {
  if (!this._requireConnection()) return;

  var self = this;
  var client = this.client;
  var frame = client.currentFrame;

  client.requireFrameEval(code, frame, function(err, res) {
    if (err) { callback(err); return; }

    client.mirrorObject(res, depth, function(err, mirror) {
      callback(err, mirror);
    });
  });
};

BrowserInterface.prototype.getHandles = function(watch, callback) {
  if (!this._requireConnection()) return;

  var self = this;
  var client = this.client;
  var frame = client.currentFrame;

  var iterator = function(object, callback) {
    client.requireFrameEval(object + '.__handle__', frame, function(err, res) {
      callback(undefined, res && res.value);
    });
  };

  async.map(watch, iterator, function(err, handles) {
    callback(_.uniq(_.reject(handles, function(handle) {
      return _.isUndefined(handle);
    })));
  });
};

// Get running code chunk around current line
// TODO: v8 will return whole file even I only require current_line +/- delta
BrowserInterface.prototype.requireSource = function(callback) {
  if (!this._requireConnection()) return;

  var delta = 5;

  var client = this.client;
  var from = client.currentLine - delta + 1;
  var to = client.currentLine + delta + 1;

  client.requireSource(from, to, function(err, res) {
    if (err || !res)
      throw new Error('You can\'t list source code right now');

    // delete header and tail of node.js wrapper
    var source = res.source,
    wrapper = require('module').wrapper[0];
    source = source.slice(wrapper.length);
    var tailLoc = source.length - 1;
    while (tailLoc--) {
      // location last line
      if (source[tailLoc] === '\n') break;
    }
    source = source.substr(0, tailLoc);

    if (client.currentLine === 0)
      client.currentColumn -= wrapper.length;

    if (callback) callback(source, client.currentLine);
  });
};

// Step commands generator
BrowserInterface.prototype._stepThrough = function(type, count, callback) {
  if (!this._requireConnection()) return;

  this.client.step(type, count, function(err) {
    if (err) throw new Error(err);
    if (callback) callback();
  });
};

// Step in
BrowserInterface.prototype.in = function(callback) {
  this._stepThrough('in', 1, callback);
};

// Jump to next command
BrowserInterface.prototype.over = function(callback) {
  this._stepThrough('next', 1, callback);
};

// Step out
BrowserInterface.prototype.out = function(callback) {
  this._stepThrough('out', 1, callback);
};

BrowserInterface.prototype.run = function(callback) {
  if (!this._requireConnection()) return;

  this.client.requireContinue(callback);
};

BrowserInterface.prototype.setBreakpoint = function(line, callback) {
  if (!this._requireConnection()) return;

  var self = this;
  var script = this.client.currentScript;
  var scriptId = _.find(_.pairs(this.client.scripts), function(pair) {
    return pair[1].name.indexOf(script) !== -1;
  })[0];

  var request = {
    type: 'scriptId',
    target: scriptId,
    line: line,
  };

  this.client.setBreakpoint(request, function(err, res) {
    if (err) { callback(err); return; }

    self.client.breakpoints.push({
      id: res.breakpoint,
      scriptId: res.actual_locations[0].script_id,
      line: res.actual_locations[0].line
    });

    callback(err, res.actual_locations[0].line);
  });
};

BrowserInterface.prototype.clearBreakpoint = function(line, callback) {
  if (!this._requireConnection()) return;

  var self = this;
  var script = this.client.currentScript;
  var scriptId = parseInt(_.find(_.pairs(this.client.scripts), function(pair) {
    return pair[1].name.indexOf(script) !== -1;
  })[0]);

  var breakpointId;
  var breakpointIndex;

  _.each(this.client.breakpoints, function(breakpoint, index) {
    if (breakpoint.scriptId === scriptId && breakpoint.line === line)
      breakpointId = breakpoint.id;
      breakpointIndex = index;
  });

  self.client.clearBreakpoint({ breakpoint: breakpointId }, function(err) {
    if (err) { callback(err); return; }

    self.client.breakpoints.splice(breakpointIndex, 1);

    callback(err, line);
  });
};

module.exports = BrowserInterface;
