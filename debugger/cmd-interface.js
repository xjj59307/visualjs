var Client = require('./client');
var repl = require('repl');
var vm = require('vm');
var path = require('path');
var util = require('util');
var tool = require('./tool');

var NO_FRAME = -1;

var Interface = function(stdin, stdout) {
  var self = this;

  this.stdin = stdin;
  this.stdout = stdout;

  var opts = {
    prompt: 'debug> ',
    input: this.stdin,
    output: this.stdout,
    terminal: true,
    eval: this.controlEval.bind(this),
    useGlobal: false,
    ignoreUndefined: true
  };
  this.repl = repl.start(opts);

  // Kill process when main repl dies
  this.repl.on('exit', function() {
    process.exit(0);
  });

  var proto = Interface.prototype,
  ignored = ['clearline', 'print', 'error', 'handleBreak', 'requireConnection', 'controlEval', 'debugEval', 'pause', 'resume', 'exitRepl'],
  shortcut = {
    'cont': 'c',
    'next': 'n',
    'step': 's',
    'out': 'o',
    'backtrace': 'bt',
    'setBreakpoint': 'sb',
    'clearBreakpoint': 'cb'
  };

  var defineProperty = function(key, protoKey) {
    var func = proto[protoKey].bind(self);

    // Setup prototype methods with no parameters as getters
    if (proto[protoKey].length === 0) {
      Object.defineProperty(self.repl.context, key, {
        get: func,
        enumerable: true,
        configurable: false
      });
    } else {
      self.repl.context[key] = func;
    }
  };

  // Copy all prototype methods in repl context
  for (var i in proto) {
    if (Object.prototype.hasOwnProperty.call(proto, i) &&
      ignored.indexOf(i) === -1) {
      defineProperty(i, i);
      if (shortcut[i]) defineProperty(shortcut[i], i);
    }
  }

  this.waiting = null;
  this.paused = 0;
  this.context = this.repl.context;
  this.history = {
    debug: [],
    control: []
  };
  this._watchers = [];

  // Connect to debugger automatically
  this.pause();
  this.client = new Client();

  this.client.on('break', function(res) {
    self.handleBreak(res);
  });

  this.client.on('exception', function(res) {
    self.handleBreak(res);
  });

  this.client.connectToNode(function() {
    self.client.requireScripts(function() {
      self.resume();
    });
  });
};

Interface.prototype.clearline = function() {
  this.stdout.cursorTo(0);
  this.stdout.clearLine(1);
};

Interface.prototype.print = function(text, oneline) {
  this.clearline();

  this.stdout.write(typeof text === 'string' ? text : util.inspect(text));

  if (oneline !== true) {
    this.stdout.write('\n');
  }
};

Interface.prototype.error = function(text) {
  this.print(text);
  this.resume();
};

Interface.prototype.handleBreak = function(res) {
  var self = this;

  this.pause();

  // Save execution context's data
  this.client.currentLine = res.sourceLine;
  this.client.currentSourceColumn = res.sourceColumn;
  this.client.currentFrame = 0;
  this.client.currentScript = res.script && res.script.name;

  // Print break data
  this.print(tool.SourceInfo(res));

  // Show watches' values
  this.watchers(true, function(err) {
    if (err) return self.error(err);

    self.list(2);
    self.resume();
  });
};

Interface.prototype.requireConnection = function() {
  if (!this.client) {
    this.error('Connection isn\'t established');
    return false;
  }
  return true;
};

Interface.prototype.controlEval = function(code, context, filename, callback) {
  try {
    // Repeat last command if empty line are going to be evaluated
    if (this.repl.rli.history && this.repl.rli.history.length > 0) {
      if (code === '(\n)') {
        code = '(' + this.repl.rli.history[0] + '\n)';
      }
    }

    var result = vm.runInContext(code, context, filename);

    // Repl should not ask for next command
    // if current one was asynchronous
    if (this.paused === 0) return callback(null, result);

    // Add a callback for asynchronous command
    // it will be automatically invoked by resume() method
    this.waiting = function() {
      callback(null, result);
    };
  } catch (e) {
    callback(e);
  }
};

// Input line will be automatically wrapped in '(' and '\n)'.
Interface.prototype.debugEval = function(code, context, filename, callback) {
  if (!this.requireConnection()) return;

  var self = this,
  client = this.client;

  // Repl asked for scope variables
  if (code.substr(0, code.length - 2) === '(_scope') {
    console.log('scope');
    client.requireScopes(callback);
    return;
  }

  // var frame = client.currentFrame === NO_FRAME ? frame : undefined;
  var frame = client.currentFrame;

  self.pause();

  // Request remote evaluation globally or in current frame
  client.requireFrameEval(code, frame, function(err, res) {
    if (err) {
      callback(err);
      self.resume(true);
      return;
    }

    // Request object in first level by handles.
    client.mirrorObject(res, 0, function(err, mirror) {
      callback(null, mirror);
      self.resume(true);
    });
  });
};

Interface.prototype.pause = function() {
  if (this.paused++ > 0) return false;
  this.repl.rli.pause();
  this.stdin.pause();
};

Interface.prototype.resume = function(silent) {
  if (this.paused === 0 || --this.paused !== 0) return false;
  this.repl.rli.resume();
  if (silent !== true) {
    this.repl.displayPrompt();
  }
  this.stdin.resume();

  if (this.waiting) {
    this.waiting();
    this.waiting = null;
  }
};

Interface.prototype.enterRepl = function() {
  if (!this.requireConnection()) return;

  var self = this;

  self.print('Press Ctrl + C to leave debug repl');

  // Don't display any default messages
  var listeners = this.repl.rli.listeners('SIGINT').slice(0);
  this.repl.rli.removeAllListeners('SIGINT');

  // Exit debug repl on Ctrl + C
  this.repl.rli.once('SIGINT', function() {
    // Restore all listeners
    process.nextTick(function() {
      listeners.forEach(function(listener) {
        self.repl.rli.on('SIGINT', listener);
      });
    });

    // Exit debug repl
    self.exitRepl();
  });

  // Set new
  this.repl.eval = this.debugEval.bind(this);
  this.repl.context = {};

  // Swap history
  this.history.control = this.repl.rli.history;
  this.repl.rli.history = this.history.debug;

  this.repl.prompt = '> ';
  this.repl.rli.setPrompt('> ');
  this.repl.displayPrompt();
};

Interface.prototype.exitRepl = function() {
  // Restore eval
  this.repl.eval = this.controlEval.bind(this);

  // Swap history
  this.history.debug = this.repl.rli.history;
  this.repl.rli.history = this.history.control;

  this.repl.context = this.context;
  this.repl.prompt = 'debug> ';
  this.repl.rli.setPrompt('debug> ');
  this.repl.displayPrompt();
};

Interface.prototype.scripts = function() {
  if (!this.requireConnection()) return;

  var client = this.client,
  displayNatives = arguments[0] || false,
  scripts = [];

  this.pause();
  for (var id in client.scripts) {
    var script = client.scripts[id];
    if (typeof script === 'object' && script.name) {
      if (
        displayNatives === true ||
        script.name === client.currentScript ||
        script.isNative === false
      ) {
        scripts.push(
          (script.name === client.currentScript ? '* ' : '  ') +
          id + ': ' +
          path.basename(script.name)
        );
      }
    }
  }
  this.print(scripts.join('\n'));
  this.resume();
};

// List source code
Interface.prototype.list = function(delta) {
  if (!this.requireConnection()) return;

  delta = delta || 5;

  var self = this,
  client = this.client,
  from = client.currentLine - delta + 1,
  to = client.currentLine + delta + 1;

  self.pause();
  client.requireSource(from, to, function(err, res) {
    if (err || !res) {
      self.error('You can\'t list source code right now');
      self.resume();
      return;
    }

    var lines = res.source.split('\n');
    for (var i = 0; i < lines.length; ++i) {
      var lineNo = res.fromLine + i + 1;
      if (lineNo < from || lineNo > to) continue;

      var isCurrent = (lineNo === client.currentLine + 1),
      hasBreakpoint = client.breakpoints.some(function(bp) {
        return bp.script === client.currentScript && bp.line === lineNo;
      });

      // The first line needs to have the module wrapper filtered out of it
      if (lineNo === 1) {
        var wrapper = require('module').wrapper[0];
        lines[i] = lines[i].slice(wrapper.length);

        client.currentSourceColumn -= wrapper.length;
      }

      // Highlight executing statement
      var line;
      if (isCurrent) {
        line = tool.SourceUnderline(
          lines[i],
          client.currentSourceColumn,
          self.repl
        );
      } else {
        line = lines[i];
      }

      self.print(tool.leftPad(lineNo, hasBreakpoint && '*') + ' ' + line);
    }
    self.resume();
  });
};

Interface.prototype.backtrace = function() {
  if (!this.requireConnection()) return;

  var self = this,
  client = this.client;

  self.pause();
  client.fullTrace(function(err, bt) {
    if (err) {
      self.error('Can\'t request backtrace now');
      self.resume();
      return;
    }

    if (bt.totalFrames === 0) {
      self.print('empty stack');
    } else {
      var trace = [],
      firstFrameNative = bt.frames[0].script.isNative;

      for (var i = 0; i < bt.frames.length; ++i) {
        var frame = bt.frames[i];
        if (!firstFrameNative && frame.script.isNative) break;

        var text = '#' + i + ' ';
        if (frame.func.inferredName && frame.func.inferredName.length > 0) {
          text += frame.func.inferredName + ' ';
        }
        text += path.basename(frame.script.name) +':';
        text += (frame.line + 1) + ':' + (frame.column + 1);

        trace.push(text);
      }

      self.print(trace.join('\n'));
    }

    self.resume();
  });
};

Interface.prototype.cont = function() {
  if (!this.requireConnection()) return;

  this.pause();
  var self = this;
  this.client.requireContinue(function() {
    self.resume();
  });
};

// Step commands generator
Interface.stepGenerator = function(type, count) {
  return function() {
    if (!this.requireConnection()) return;

    var self = this;

    self.pause();
    self.client.step(type, count, function(err, res) {
      if (err) self.error(err);
      self.resume();
    });
  };
};

// Jump to next command
Interface.prototype.next = Interface.stepGenerator('next', 1);

// Step in
Interface.prototype.step = Interface.stepGenerator('in', 1);

// Step out
Interface.prototype.out = Interface.stepGenerator('out', 1);

Interface.prototype.watch = function(expr) {
  this._watchers.push(expr);
};

Interface.prototype.unwatch = function(expr) {
  var index = this._watchers.indexOf(expr);

  this._watchers.splice(index !== -1 ? index : +expr, 1);
};

Interface.prototype.watchers = function() {
  var self = this,
  verbose = arguments[0] || false,
  callback = arguments[1] || function() {},
  waiting = this._watchers.length,
  values = [];

  this.pause();

  if (!waiting) {
    this.resume();

    return callback();
  }

  this._watchers.forEach(function(watcher, index) {
    self.debugEval(watcher, null, null, function(err, value) {
      values[index] = err ? '<error>': value;
      wait();
    });
  });

  function wait() {
    if (--waiting === 0) {
      if (verbose) self.print('Watchers:');

      self._watchers.forEach(function(watcher, index) {
        self.print(
          tool.leftPad(index, ' ') + ': ' + watcher + ' = ' + 
          JSON.stringify(values[index])
        );
      });

      if (verbose) self.print('');
      self.resume();
      callback(null);
    }
  }
};

Interface.prototype.setBreakpoint = function(script, line, condition, slient) {
  if (!this.requireConnection()) return;

  var self = this;
  var request;
  var scriptId;
  var ambiguous;

  // setBreakpoint() should insert breakpoint on current line
  if (script === undefined) {
    script = this.client.currentScript;
    line = this.client.currentLine + 1;
  }

  // setBreakpoint(line-number) should insert breakpoint in current script
  if (line === undefined && typeof script === 'number') {
    line = script;
    script = this.client.currentScript;
  }

  if (/\(\)$/.test(script)) {
    // setBreakpoint('functionname()');
    request = {
      type: 'function',
      target: script.replace(/\(\)$/, ''),
      condition: condition
    };
  } else {
    // setBreakpoint('scriptname');
    if (typeof script === 'string' && !this.client.scripts[script]) {
      var scripts = this.client.scripts;
      Object.keys(scripts).forEach(function(id) {
        if (scripts[id] && scripts[id].name.indexOf(script) !== -1) {
          if (scriptId) {
            ambiguous = true;
          }
          scriptId = id;
        }
      });
    } else {
      scriptId = script;
    }

    if (!scriptId) return this.error('Script: ' + script + ' not found');
    if (ambiguous) return this.error('Script name is ambiguous');
    if (line <= 0) return this.error('Line should be a positive value');

    request = {
      type: 'scriptId',
      target: scriptId,
      line: line - 1,
      condition: condition
    };
  }

  self.pause();
  self.client.setBreakpoint(request, function(err, res) {
    if (err) {
      if (!slient) self.error(err);
    } else {
      if (!slient) self.list(5);

      // Load scriptId and line when function breakpoint is set
      if (!scriptId) {
        scriptId = res.script_id;
        line = res.line;
      }

      // If we finally have one, remember this breakpoint
      if (scriptId) {
        self.client.breakpoints.push({
          id: res.breakpoint,
          scriptId: scriptId,
          script: (self.client.scripts[scriptId] || {}).name,
          line: line,
          condition: condition
        });
      }
    }
    self.resume();
  });
};

Interface.prototype.clearBreakpoint = function(script, line) {
  if (!this.requireConnection()) return;

  var ambiguous,
  breakpoint,
  index;

  this.client.breakpoints.some(function(bp, i) {
    if (bp.scriptId === script || bp.script.indexOf(script) !== -1) {
      if (index !== undefined) {
        ambiguous = true;
      }
      if (bp.line === line) {
        index = i;
        breakpoint = bp.id;
        return true;
      }
    }
  });

  if (ambiguous) return this.error('Script name is ambiguous');

  if (breakpoint === undefined) {
    return this.error('Script : ' + script + ' not found');
  }

  var self = this,
  req = {
    breakpoint: breakpoint
  };

  self.pause();
  self.client.clearBreakpoint(req, function(err, res) {
    if (err) {
      self.error(err);
    } else {
      self.client.breakpoints.splice(index, 1);
      self.list(5);
    }
    self.resume();
  });
};

Interface.prototype.breakpoints = function() {
  if (!this.requireConnection()) return;

  this.pause();
  var self = this;
  this.client.listBreakpoints(function(err, res) {
    if (err) {
      self.error(err);
    } else {
      self.print(res);
      self.resume();
    }
  });
};

module.exports = Interface;
