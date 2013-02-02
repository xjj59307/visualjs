var Client = require('./client');
var repl = require('repl');
var vm = require('vm');

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
    // Emulate Ctrl+C
    if (!this.stdout.isTTY) {
    	process.on('SIGINT', function() {
    		self.repl.rli.emit('SIGINT');
    	});
    }
    this.repl = repl.start(opts);

    // Kill process when main repl dies
    this.repl.on('exit', function() {
    	process.exit(0);
    });

    this.paused = 0;
    this.waiting = null;

    // Run script automatically
    this.pause();
    this.client = new Client();
    this.resume();
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

Interface.prototype.connect = function() {
    this.client.connect();
};

Interface.prototype.setBreakPoint = function(line) {
    this.client.setBreakpoint(this.client.currentSource.name, line);
};

module.exports = Interface;
