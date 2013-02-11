var Protocol = require('./protocol');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var NO_FRAME = -1;

// Client inherits from Protocol
var Client = function() {
    Protocol.call(this, {
        eventHandler: this.onResponse
    });

    this.emitter = new EventEmitter();

    this.currentFrame = NO_FRAME;
    this.scripts = {};
    this.breakpoints = [];
};
util.inherits(Client, Protocol);

Client.prototype.onResponse = function(response) {
    switch (response.event) {
        case 'break':
            this.emitter.emit('break', response.body);
            break;
        case 'afterCompile':
            console.log('Event: afterCompile');
            break;
        default:
            this.emitter.emit('exception', response.body);
            break;
    }
};

var natives = process.binding('natives');

Client.prototype._addScript = function(script) {
    this.scripts[script.id] = script;
    if (script.name) {
        script.isNative = (script.name.replace('.js', '') in natives) || script.name === 'node.js';

        // Here is some bad smell when debugging multiple scripts
        if (script.isNative === false) {
            this.currentScript = script.name;
            this.currentLine = 0;
        }
    }
};

Client.prototype.requireScripts = function(callback) {
    var self = this;
    callback = callback || function() {};

    var request = {
        command: 'scripts'
    };
    this.send(request, function(err, response) {
        if (err) return callback(err);

        for (var i = 0; i < response.body.length; ++i) {
            self._addScript(response.body[i]);
        }
        callback();
    });
};

Client.prototype.requireSource = function(from, to, callback) {
    var request = {
        command: 'source',
        fromLine: from,
        toLine: to
    };

    this.send(request, callback);
};

Client.prototype.step = function(action, count, callback) {
    var request = {
        command: 'continue',
        arguments: {
            stepaction: action,
            stepcount: count
        }
    };

    this.currentFrame = NO_FRAME;
    this.send(request, callback);
};

Client.prototype.requireContinue = function(callback) {
    this.currentFrame = NO_FRAME;

    var request = {
        command: 'continue'
    };
    this.send(request, callback);
};

Client.prototype.setBreakpoint = function(request, callback) {
    var request = {
        command: 'setbreakpoint',
        arguments: request
    };

    this.send(request, callback);
};

Client.prototype.continue = function(callback) {
    var request = {
        command: 'continue'
    };

    this.send(request, callback);
};

Client.prototype.listBreakpoints = function(callback) {
    var request = {
        command: 'listbreakpoints'
    };

    this.send(request, callback);
};

module.exports = Client;