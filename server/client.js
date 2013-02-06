var pDebug = require('pDebug').pDebug;

var NO_FRAME = -1;

var Client = function() {
    this.debug = new pDebug({
        eventHandler: this._onResponse
    });

    this.scripts = {};
    this.breakpoints = [];
};

var natives = process.binding('natives');

Client.prototype._addScript = function(script) {
    this.scripts[script.id] = script;
    if (script.name) {
        script.isNative = (script.name.replace('.js', '') in natives) || script.name === 'node.js';

        // Here is some bad smell when debugging multiple scripts
        if (script.isNative === false) {
        	this.currentScript = script.name;
        }
    }
};

Client.prototype._onResponse = function(event) {
	console.log("Event: " + event);
};

Client.prototype.connect = function() {
	var self = this;

    this.debug.connect(function() { 
        self.requireScripts();
    });
}

Client.prototype.requireScripts = function() {
	var self = this;

	var request = {
		command: 'scripts'
	};
	this.debug.send(request, function(request, response) {
        for (var i = 0; i < response.body.length; ++i) {
            self._addScript(response.body[i]);
        }
    });											
};

Client.prototype.setBreakpoint = function(request, callback) {
	var request = {
        command: 'setbreakpoint',
        arguments: request
	};

	this.debug.send(request, callback);
};

Client.prototype.continue = function() {
	var request = {
		command: 'continue'
	};

	this.debug.send(request);
};

module.exports = Client;