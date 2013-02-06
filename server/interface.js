var Client = require('./client'),
	repl = require('repl'),
	vm = require('vm'),
	path = require('path'),
	util = require('util');

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
    	ignored = ['clearline', 'print', 'error', 'requireConnection', 'controlEval', 'pause', 'resume'],
    	shortcut = {
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
    this.client.connect(function() {
        self.resume();
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

Interface.prototype.setBreakpoint = function(script, line, condition) {
    if (!this.requireConnection()) return;

	var self = this,
		scriptId,
		ambiguous;

	// TODO: setBreakpoint() should insert breakpoint on current line when parameter is undefined

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
	self.client.setBreakpoint(request, function(request, response) {
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

		self.resume();
	});
};

Interface.prototype.breakpoints = function() {
    if (!this.requireConnection()) return;

    this.pause();
    var self = this;
    this.client.listBreakpoints(function(resquest, response) {
        self.print(response.body);
        self.resume();
    });
};

module.exports = Interface;
