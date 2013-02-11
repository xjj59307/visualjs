var Client = require('./client'),
    repl = require('repl'),
    vm = require('vm'),
    path = require('path'),
    util = require('util'),
    tool = require('./tool');

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
        ignored = ['clearline', 'print', 'error', 'handleBreak', 'requireConnection', 'controlEval', 'pause', 'resume'],
        shortcut = {
            'cont': 'c',
            'next': 'n',
            'step': 's',
            'out': 'o',
            'setBreakpoint': 'sb'
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

    this.paused = 0;
    this.waiting = null;

    // Connect to debugger automatically
    this.pause();
    this.client = new Client();

    this.client.emitter.on('break', function(response) {
        self.handleBreak(response);
    });

    this.client.emitter.on('exception', function(response) {
        self.handleBreak(response);
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
}

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

Interface.prototype.handleBreak = function(response) {
    var self = this;

    this.pause();

    // Save execution context's data
    this.client.currentLine = response.sourceLine;
    this.client.currentSourceColumn = response.sourceColumn;
    this.client.currentFrame = 0;
    this.client.currentScript = response.script && response.script.name;

    // Print break data
    this.print(tool.SourceInfo(response));

    // TODO: Show watches' values
    this.list(2);
    this.resume();
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

Interface.prototype.scripts = function() {
    if (!this.requireConnection()) return;

    var client = this.client,
        displayNatives = arguments[0] || false,
        scripts = [];

    this.pause();
    for (var id in client.scripts) {
        var script = client.scripts[id];
        if (typeof script === 'object' && script.name) {
            if (displayNatives === true ||
                script.name === client.currentScript ||
                script.isNative === false) {
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
    client.requireSource(from, to, function(err, response) {
        if (err || !response.body) {
            self.error('You can\'t list source code right now');
            self.resume();
            return;
        }

        var body = response.body;
        var lines = body.source.split('\n');
        for (var i = 0; i < lines.length; ++i) {
            var lineNo = body.fromLine + i + 1;
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
                line = tool.SourceUnderline(lines[i], client.currentSourceColumn, self.repl);
            } else {
                line = lines[i];
            }

            self.print(tool.leftPad(lineNo, hasBreakpoint && '*') + ' ' + line);
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
        self.client.step(type, count, function(err, response) {
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

Interface.prototype.setBreakpoint = function(script, line, condition, slient) {
    if (!this.requireConnection()) return;

    var self = this,
        scriptId,
        ambiguous;

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
        var request = {
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

        var request = {
            type: 'scriptId',
            target: scriptId,
            line: line - 1,
            condition: condition
        };
    }

    self.pause();
    self.client.setBreakpoint(request, function(err, response) {
        if (err) {
            if (!slient) {
                self.error(err);
            }
        } else {
            if (!slient) {
                self.list(5);
            }

            // Load scriptId and line when function breakpoint is set
            if (!scriptId) {
                scriptId = response.body.script_id;
                line = response.body.line;
            }

            // If we finally have one, remember this breakpoint
            if (scriptId) {
                self.client.breakpoints.push({
                    id: response.body.breakpoint,
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

Interface.prototype.breakpoints = function() {
    if (!this.requireConnection()) return;

    this.pause();
    var self = this;
    this.client.listBreakpoints(function(err, response) {
        if (err) {
            self.error(err);
        } else {
            self.print(response.body);
            self.resume();
        }
    });
};

module.exports = Interface;
