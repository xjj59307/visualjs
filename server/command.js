var Command = function (debug) {
	this.debug = debug;
};

Command.prototype.requireScripts = function (callback) {
	var request = {
		command: 'scripts'
	};

	this.debug.send(request, callback);
};

module.exports = Command;