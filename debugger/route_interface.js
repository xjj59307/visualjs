var Client = require('./client'),
    util = require('util'),
    tool = require('./tool');

var RouteInterface = function() {
    var self = this;

    this.stdin = process.stdin;
    this.stdout = process.stdout;
    this.paused = 0;

    // Connect to debugger automatically
    this.pause();
    this.client = new Client();
    this.client.currentLine = 0;
    this.client.currentColumn = 0;

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

RouteInterface.prototype.handleBreak = function(res) {
    this.pause();

    this.client.currentLine = res.sourceLine;
    this.client.currentColumn = res.sourceColumn;
    this.client.currentFrame = 0;
    this.list();

    this.resume();
};

RouteInterface.prototype.pause = function() {
    this.paused++;
};

RouteInterface.prototype.resume = function() {
    this.paused--;
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

    if (this.paused !== 0) {
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

// List source code
RouteInterface.prototype.list = function(delta) {
    if (!this.requireConnection()) return;

    delta = delta || 5;

    var self = this,
        client = this.client,
        from = client.currentLine - delta + 1,
        to = client.currentLine + delta + 1;

    self.pause();
    client.requireSource(from, to, function(err, res) {
        if (err || !res) {
            self.error('You can\'t list source code right now');
            self.resume();
            return;
        }

        var lines = res.source.split('\n');
        var srcClip = '';
        for (var i = 0; i < lines.length; ++i) {
            var lineNo = res.fromLine + i + 1;
            if (lineNo < from || lineNo > to) continue;

            var isCurrent = (lineNo === client.currentLine + 1);

            // The first line needs to have the module wrapper filtered out of it
            if (lineNo === 1) {
                var wrapper = require('module').wrapper[0];
                lines[i] = lines[i].slice(wrapper.length);

                client.currentColumn -= wrapper.length;
            }

            // Highlight executing statement
            var line;
            line = lines[i];

            var prefix = isCurrent && '*';
            srcClip += tool.leftPad(lineNo, prefix) + ' ' + line + '\n';
        }

        console.log(srcClip);
        self.resume();
    });
};

// Step commands generator
RouteInterface.stepGenerator = function(type, count) {
    return function() {
        if (!this.requireConnection()) return;

        if (this.paused !== 0) {
            this.error('Wait for last request');
            return;
        }

        var self = this;

        self.pause();
        self.client.step(type, count, function(err, res) {
            if (err) self.error(err);
            self.resume();
        });
    };
};

// Jump to next command
RouteInterface.prototype.over = RouteInterface.stepGenerator('next', 1);

// Step in
RouteInterface.prototype.in = RouteInterface.stepGenerator('in', 1);

// Step out
RouteInterface.prototype.out = RouteInterface.stepGenerator('out', 1);

module.exports = RouteInterface;
