var pDebug = require('pDebug').pDebug;
var Client = require('./client');
var repl = require('repl');

var eventHandler = function (event) {
    console.log("Event: " + event);
};

var Interface = function (stdin, stdout) {
    this.debug = new pDebug({
        eventHandler: eventHandler
    });
    this.stdin = stdin;
    this.stdout = stdout;
    this.client = new Client(this.debug);
};

Interface.prototype.connect = function () {
    var self = this;

    this.debug.connect(function() { 
        console.log('connect!'); 

        self.client.requireScripts();
    });
};

Interface.prototype.setBreakPoint = function (line) {
    this.client.setBreakpoint(line);
}

module.exports = Interface;
