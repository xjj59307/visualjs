var Client = require('./client'),
    util = require('util')

var RouteInterface = function() {
    var self = this;

    this.stdin = process.stdin;
    this.stdout = process.stdout;
    this.paused = false;

    // Connect to debugger automatically
    this.pause();
    this.client = new Client();

    this.client.on('break', function(res) {
        self.handleBreak(res);
    });

    this.client.on('exception', function(res) {
        self.handleBreak(res);
    });

    this.client.connectToNode(function() {
        self.resume();
    });
};

RouteInterface.prototype.clearline = function() {
    this.stdout.cursorTo(0);
    this.stdout.clearLine(1);
};

RouteInterface.prototype.print = function(text, oneline) {
    this.clearline();

    this.stdout.write(typeof text === 'string' ? text : util.inspect(text));

    if (oneline !== true) {
        this.stdout.write('\n');
    }
};

RouteInterface.prototype.error = function(text) {
    this.print(text);
    this.resume();
};

RouteInterface.prototype.requireConnection = function() {
    if (!this.client) {
        this.error('Connection isn\'t established');
        return false;
    }
    return true;
};

RouteInterface.prototype.handleBreak = function() {
    this.pause();

    this.currentFrame = 0;

    this.resume();
};

RouteInterface.prototype.pause = function() {
    this.paused = true;
};

RouteInterface.prototype.resume = function() {
    this.paused = false;
};

// Returns `true` if "err" is a SyntaxError, `false` otherwise. This function filters out false positives likes JSON.parse() errors and RegExp syntax errors.
RouteInterface.prototype.isSyntaxError = function(err) {
    // Convert error to string
    err = err && (err.stack || err.toString());
    return err && err.match(/^SyntaxError/) &&
        // RegExp syntax error
        !err.match(/^SyntaxError: Invalid regular expression/) &&
        !err.match(/^SyntaxError: Invalid flags supplied to RegExp constructor/) &&
        // JSON.parse() error
        !(err.match(/^SyntaxError: Unexpected (token .*|end of input)/) && err.match(/\n    at Object.parse \(native\)\n/));
};

// Try to evaluate both expressions e.g. '{ a : 1 }' and statements e.g. 'for (var i = 0; i < 10; i++) console.log(i);'
// First attempt to eval as expression with parens. This catches '{a : 1}' properly.
RouteInterface.prototype.evaluate = function(code, callback, isStmt) {
    if (!this.requireConnection()) return;

    if (this.paused) {
        this.error('Wait for last request');
        return;
    }

    var self = this,
        client = this.client,
        frame = client.currentFrame;

    self.pause();

    // Request remote evaluation globally or in current frame
    client.requireFrameEval(isStmt ? code : "(" + code + ")", frame, function(err, res) {
        if (err && !self.isSyntaxError(err)) {
            self.error(err);
            return;
        }

        if (typeof res === 'function' &&
            /^[\r\n\s]*function/.test(code) ||
            err) {
            self.resume();
            self.evaluate(code, callback, true);
        } else {
            // Request object by handles
            client.mirrorObject(res, 3, function(err, mirror) {
                callback(mirror);
                self.resume();
            });
        }
    });
};

module.exports = RouteInterface;
