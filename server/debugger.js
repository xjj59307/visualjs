var pDebug = require('pDebug').pDebug;
var Command = require('./command');

var eventHandler = function (event) {
    // console.log("Event: " + event);
};

var Debug = function () {
    this.debug = new pDebug({
        eventHandler: eventHandler
    });
    this.scripts = {};
};

var natives = process.binding('natives');

Debug.prototype._addScript = function (script) {
    this.scripts[script.id] = script;
    if (script.name) {
        script.isNative = (script.name.replace('.js', '') in natives) || script.name === 'node.js';
    }
};

Debug.prototype.connect = function () {
    var self = this;

    this.debug.connect(function() { 
        console.log('connect!'); 

        var command = new Command(self.debug);
        command.requireScripts(function (request, response) {
            for (var i = 0; i < response.body.length; ++i) {
                self._addScript(response.body[i]);
            }
        });
    });
};

module.exports = Debug;