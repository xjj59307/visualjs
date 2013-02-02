var Client = function (debug) {
	this.debug = debug;
    this.scripts = {};
    this.currentScript = null;
};

Client.prototype.requireScripts = function (callback) {
	var request = {
		command: 'scripts'
	};

	var self = this;
	
	this.debug.send(request, function (request, response) {
        for (var i = 0; i < response.body.length; ++i) {
            self._addScript(response.body[i]);
        }
    });	
};

Client.prototype.setBreakpoint = function (scriptName, line, condition, callback) {
	var request = {
		command: 'script',
		target: scriptName,
		line: line,
		condition: condition
	};

	this.debug.send(request, callback);
};

Client.prototype.continue = function (callback) {
	var request = {
		command: 'continue'
	};

	this.debug.send(request, callback);
};

var natives = process.binding('natives');

Client.prototype._addScript = function (script) {
    this.scripts[script.id] = script;
    if (script.name) {
        script.isNative = (script.name.replace('.js', '') in natives) || script.name === 'node.js';
        this.currentScript = !script.isNative && script;
    }
};

module.exports = Client;