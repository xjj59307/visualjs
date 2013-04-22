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

// Parsing commond sended from browser
RouteInterface.prototype.parse = function(cmd) {
    if (this.paused) {
        this.error('Wait for last request');
        return;
    }

    var code = cmd;
    return this.evaluate(code);
};

RouteInterface.prototype.evaluate = function(code, callback) {
    if (!this.requireConnection()) return;

    var self = this,
        client = this.client,
        frame = client.currentFrame;

    self.pause();

    // Request remote evaluation globally or in current frame
    client.requireFrameEval(code, frame, function(err, res) {
        if (err) {
            callback(err);
            self.resume();
            return;
        }

        // Request object by handles
        client.mirrorObject(res, 3, function(err, mirror) {
            callback(null, mirror);
            self.resume();
        });
    });
};