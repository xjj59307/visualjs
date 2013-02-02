var pDebug = require('pDebug').pDebug;

var Client = function () {
	var eventHandler = function (event) {
	    console.log("Event: " + event);
	};

    this.debug = new pDebug({
        eventHandler: eventHandler
    });

    this.scripts = {};
    this.currentScript = null;
};

Client.prototype.connect = function () {
	var self = this;

    this.debug.connect(function() { 
        console.log('connect!'); 

        self.requireScripts();
    });
}

Client.prototype.requireScripts = function () {
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

Client.prototype.setBreakpoint = function (scriptName, line, condition) {
	var request = {
		command: 'script',
		target: scriptName,
		line: line,
		condition: condition
	};

	this.debug.send(request);
};

Client.prototype.continue = function () {
	var request = {
		command: 'continue'
	};

	this.debug.send(request);
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