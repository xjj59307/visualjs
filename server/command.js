var Command = function (debug) {
	this.debug = debug;
};

Command.prototype.requireScripts = function (callback) {
	var request = {
		command: 'scripts'
	};

	this.debug.send(request, callback);
};

Command.prototype.setBreakpoint = function (scriptName, line, condition, callback) {
	var request = {
		command: 'script',
		target: scriptName,
		line: line,
		condition: condition
	};

	this.debug.send(request, callback);	
};

Command.prototype.continue = function (callback) {
	var request = {
		command: 'continue'
	};

	this.debug.send(request, callback);
};

module.exports = Command;