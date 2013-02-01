var pDebug = require('pDebug').pDebug;
var Command = require('./command');

var eventHandler = function (event) {
    console.log("Event: " + event);
};

var Debug = function () {
    this.debug = new pDebug({
        eventHandler: eventHandler
    });
    this.command = new Command(this.debug);
    this.scripts = {};
    this.currentScript = null;
};

var natives = process.binding('natives');

Debug.prototype._addScript = function (script) {
    this.scripts[script.id] = script;
    if (script.name) {
        script.isNative = (script.name.replace('.js', '') in natives) || script.name === 'node.js';
        this.currentScript = !script.isNative && script;
    }
};

Debug.prototype.connect = function () {
    var self = this;

    this.debug.connect(function() { 
        console.log('connect!'); 

        self.command.requireScripts(function (request, response) {
            for (var i = 0; i < response.body.length; ++i) {
                self._addScript(response.body[i]);
            }
        });
    });
};

Debug.prototype.setBreakPoint = function (line) {
    var self = this;
    
    // this.command.setBreakpoint(this.currentScript.name, line);
    // this.command.continue();
}

module.exports = Debug;