var util = require('util');
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
    browserInterface.getExprList().forEach(function(expr) {
      jobQueue.addTask(expr);
    });
  };

  jobQueue.on(JOB.STEP_IN, function() {
    handleStepJob(TASK.STEP_IN);

    browserInterface.in(function() {
      browserInterface.finishTask(TASK.STEP_IN);
    });
  });

  jobQueue.on(JOB.STEP_OVER, function() {
    handleStepJob(TASK.STEP_OVER);

    browserInterface.over(function() {
      browserInterface.finishTask(TASK.STEP_OVER);
    });
  });

  jobQueue.on(JOB.STEP_OUT, function() {
    handleStepJob(TASK.STEP_OUT);

    browserInterface.out(function() {
      browserInterface.finishTask(TASK.STEP_OUT);
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

    var expr = job.data;
    browserInterface.addExpr(expr, function(visualNodes) {
      browserInterface.getSocket().emit('update view', visualNodes);
      browserInterface.finishTask(TASK.NEW_EXPRESSION);
    });
  });
};

var BrowserInterface = function() {
  var self = this;

  // expression list to evluate when stepping through
  this.exprSet = new buckets.Set();
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
  var fs = require('fs');
  var code = '' + fs.readFileSync('./debugger/math.visjs');

  var animator = new Animator(expr, code, this, function() {
    self.exprSet.add(expr);
    callback(animator.getInitialGraph());
  });
};

BrowserInterface.prototype.getExprList = function() {
  return this.exprSet.toArray();
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
  if (this.socket) this.requireSource(function(source, currentLine) {
    self.socket.emit('update source', {
      source: source,
      currentLine: currentLine
    });
    self.jobQueue.finishTask(TASK.REQUIRE_SOURCE);
  });

  // inform client to update view
  this.getExprList().forEach(function(expr) {
    self.evaluate(expr, function(err, obj) {
      if (err) {
        // TODO: Handle server error on the client side.
        self.emit('server error', err);
      } else {
        self.socket.emit('update view', { expr: expr, result: obj });
        self.jobQueue.finishTask(expr);
      }
    });
  });
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

// Try to evaluate both expressions e.g. '{ a : 1 }' and
// statements e.g. 'for (var i = 0; i < 10; i++) console.log(i);'
// First attempt to evaluate as expression with parens.
// This catches '{a : 1}' properly.
BrowserInterface.prototype.evaluate = function(code, callback, isStmt) {
  if (!this._requireConnection()) return;

  var self = this,
  client = this.client,
  frame = client.currentFrame;

  // Request remote evaluation globally or in current frame
  client.requireFrameEval(
    isStmt ? code : "(" + code + ")",
    frame,
    function(err, res) {
      if (err && !isSyntaxError(err)) callback(err);

      if (typeof res === 'function' &&
          /^[\r\n\s]*function/.test(code) ||
          err) {
        self.evaluate(code, callback, true);
      } else {
        // Request object by handles
        client.mirrorObject(res, 3, function(err, mirror) {
          if (err) callback(err);
          callback(null, mirror);
        });
      }
    }
  );
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

module.exports = BrowserInterface;
