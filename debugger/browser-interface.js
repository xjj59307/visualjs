var Client = require('./client'),
    util = require('util'),
    tool = require('./tool'),
    JobQueue = require('./job-queue'),
    JobHandler = require('./job-handler'),
    buckets = require('buckets'),
    TASK = require('./enum').TASK;

var BrowserInterface = function() {
    var self = this;

    this.stdin = process.stdin;
    this.stdout = process.stdout;
    this.jobQueue = new JobQueue(new JobHandler(this));
    this.exprSet = new buckets.Set(); // expression list to evluate when stepping through

    // Connect to debugger automatically
    this.client = new Client();
    this.client.currentLine = 0;
    this.client.currentColumn = 0;

    this.client.on('break', function(res) {
        self.handleBreak(res);
    });

    // TODO: handle exception
    this.client.on('exception', function(res) {
        // self.handleBreak(res);
        self.error('unknown exception');
    });

    this.client.connectToNode();
};

BrowserInterface.prototype.setSocket = function(socket) {
    this.socket = socket;
    this.jobQueue.reset();
};

BrowserInterface.prototype.getSocket = function(socket) {
    return this.socket;
};

BrowserInterface.prototype.addJob = function(job) {
    this.jobQueue.addJob(job);
};

BrowserInterface.prototype.finishTask = function(task) {
    this.jobQueue.finishTask(task);
};

BrowserInterface.prototype.addExpr = function(expr) {
    this.exprSet.add(expr);
};

BrowserInterface.prototype.getExprList = function() {
    return this.exprSet.toArray();
};

BrowserInterface.prototype.clearline = function() {
    this.stdout.cursorTo(0);
    this.stdout.clearLine(1);
};

BrowserInterface.prototype.print = function(text, oneline) {
    this.clearline();

    this.stdout.write(typeof text === 'string' ? text : util.inspect(text));

    if (oneline !== true) {
        this.stdout.write('\n');
    }
};

BrowserInterface.prototype.error = function(text) {
    this.print(text);
};

BrowserInterface.prototype.requireConnection = function() {
    if (!this.client) {
        this.error('Connection isn\'t established');
        return false;
    }
    return true;
};

BrowserInterface.prototype.handleBreak = function(res) {
    var self = this;

    this.client.currentLine = res.sourceLine;
    this.client.currentColumn = res.sourceColumn;
    this.client.currentFrame = 0;

    // inform client to update source
    if (this.socket) this.requireSource(function(source, currentLine) {
        self.socket.emit('update source', {
            source: source,
            currentLine: currentLine
        });
        self.jobQueue.finishTask(TASK.REQUIRE_SOURCE);
    });

    // inform client to update view
    this.exprSet.toArray().forEach(function(expr) {
        self.evaluate(expr, function(obj) {
            self.socket.emit('update view', { expr: expr, result: obj });
            self.jobQueue.finishTask(expr);
        });
    });
};

// Returns `true` if "err" is a SyntaxError, `false` otherwise. This function filters out false positives likes JSON.parse() errors and RegExp syntax errors.
BrowserInterface.prototype.isSyntaxError = function(err) {
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
BrowserInterface.prototype.evaluate = function(code, callback, isStmt) {
    if (!this.requireConnection()) return;

    var self = this,
        client = this.client,
        frame = client.currentFrame;

    // Request remote evaluation globally or in current frame
    client.requireFrameEval(isStmt ? code : "(" + code + ")", frame, function(err, res) {
        if (err && !self.isSyntaxError(err)) {
            self.error(err);
            return;
        }

        if (typeof res === 'function' &&
            /^[\r\n\s]*function/.test(code) ||
            err) {
            self.evaluate(code, callback, true);
        } else {
            // Request object by handles
            client.mirrorObject(res, 3, function(err, mirror) {
                callback(mirror);
            });
        }
    });
};

// Get running code chunk around current line
// TODO: v8 will return whole file even I only require current_line +/- delta
BrowserInterface.prototype.requireSource = function(callback) {
    if (!this.requireConnection()) return;

    var delta = 5;

    var self = this,
        client = this.client,
        from = client.currentLine - delta + 1,
        to = client.currentLine + delta + 1;

    client.requireSource(from, to, function(err, res) {
        if (err || !res) {
            self.error('You can\'t list source code right now');
            return;
        }

        // delete header and tail of node.js wrapper
        var source = res.source,
            wrapper = require('module').wrapper[0];
        source = source.slice(wrapper.length);
        var tailLoc = source.length - 1;
        while (tailLoc--) {
            // location last line
            if (source[tailLoc] === '\n') break;
        }
        source = source.substr(0, tailLoc);

        if (client.currentLine === 0)
            client.currentColumn -= wrapper.length;

        if (callback) callback(source, client.currentLine);
    });
};

// Step commands generator
BrowserInterface.prototype.stepThrough = function(type, count, callback) {
    if (!this.requireConnection()) return;

    var self = this;

    self.client.step(type, count, function(err, res) {
        if (err) self.error(err);
        if (callback) callback();
    });
};

// Step in
BrowserInterface.prototype.in = function(callback) {
    this.stepThrough('in', 1, callback);
};

// Jump to next command
BrowserInterface.prototype.over = function(callback) {
    this.stepThrough('next', 1, callback);
};

// Step out
BrowserInterface.prototype.out = function(callback) {
    this.stepThrough('out', 1, callback);
};

module.exports = BrowserInterface;
