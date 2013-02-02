var Client = require('./client');
var repl = require('repl');

var Interface = function (stdin, stdout) {
    this.stdin = stdin;
    this.stdout = stdout;
    this.client = new Client();
};

Interface.prototype.connect = function () {
    this.client.connect();
};

Interface.prototype.setBreakPoint = function (line) {
    this.client.setBreakpoint(line);
}

module.exports = Interface;
