var pDebug = require('pDebug').pDebug;

var NO_FRAME = -1;

var Client = function() {
    this.debug = new pDebug({
        eventHandler: this._onResponse
    });

    this.currentSource = null;
    this.scripts = {};
};

var natives = process.binding('natives');

Client.prototype._addScript = function(script) {
    this.scripts[script.id] = script;
    if (script.name) {
        script.isNative = (script.name.replace('.js', '') in natives) || script.name === 'node.js';
        this.currentSource = !script.isNative && script;
    }
};

Client.prototype._onResponse = function(event) {
	console.log("Event: " + event);
};

Client.prototype.connect = function() {
	var self = this;

    this.debug.connect(function() { 
        // self.requireScripts();
    });
}

Client.prototype.requireScripts = function() {
	var request = {
		command: 'scripts'
	};

	var self = this;

	this.debug.send(request, function(request, response) {
        for (var i = 0; i < response.body.length; ++i) {
            self._addScript(response.body[i]);
        }
    });											
};

Client.prototype.setBreakpoint = function(scriptName, line, condition) {
	var request = {
		command: 'script',
		target: scriptName,
		line: line,
		condition: condition
	};

	this.debug.send(request);
};

Client.prototype.continue = function() {
	var request = {
		command: 'continue'
	};

	this.debug.send(request);
};

module.exports = Client;