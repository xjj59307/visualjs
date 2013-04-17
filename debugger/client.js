// https://code.google.com/p/v8/wiki/DebuggerProtocol

var Protocol = require('./protocol');
var util = require('util');

var NO_FRAME = -1;

// Client inherits from Protocol
var Client = function() {
    Protocol.call(this, {
        eventHandler: this.onResponse
    });

    this.currentFrame = NO_FRAME;
    this.scripts = {};
    this.handles = {};
    this.breakpoints = [];
};
util.inherits(Client, Protocol);

Client.prototype.onResponse = function(res) {
    switch (res.event) {
        case 'break':
            this.emit('break', res.body);
            break;
        case 'afterCompile':
            this._addHandle(res.body.script);
            break;
        default:
            this.emit('exception', res.body);
            break;
    }
};

Client.prototype._addHandle = function(desc) {
    if (typeof desc !== 'object' || typeof desc.handle !== 'number') {
        return;
    }

    this.handles[desc.handle] = desc;
    if (desc.type === 'script') {
        this._addScript(desc);
    }
};

var natives = process.binding('natives');

Client.prototype._addScript = function(desc) {
    this.scripts[desc.id] = desc;
    if (desc.name) {
        desc.isNative = (desc.name.replace('.js', '') in natives) || desc.name === 'node.js';

        // Here is some bad smell when debugging multiple scripts
        if (desc.isNative === false) {
            this.currentScript = desc.name;
            this.currentLine = 0;
        }
    }
};

Client.prototype.requireScripts = function(cb) {
    var self = this;
    cb = cb || function() {};

    var req = {
        command: 'scripts'
    };
    this.send(req, function(err, res) {
        if (err) return cb(err);

        for (var i = 0; i < res.length; ++i) {
            self._addHandle(res[i]);
        }
        cb();
    });
};

/*
{ "seq"         : <number>,
  "type"        : "response",
  "request_seq" : <number>,
  "command"     : "lookup",
  "body"        : <array of serialized objects indexed using their handle>
  "running"     : <is the VM running after sending this response>
  "success"     : true
}
*/
Client.prototype.requireLookup = function(refs, cb) {
    var self = this;

    var req = {
        command: 'lookup',
        arguments: { handles: refs }
    };

    cb = cb || function() {};
    this.send(req, function(err, res) {
        if (err) return cb(err);

        for (var ref in res) {
            if (typeof res[ref] === 'object') {
                self._addHandle(res[ref]);
            }
        }

        cb(null, res);
    });
};

Client.prototype.requireScopes = function(cb) {
    var self = this,
        req = {
            command: 'scopes',
            arguments: {}
        };

    cb = cb || function() {};
    this.send(req, function(err, res) {
        if (err) return cb(err);

        var refs = res.scopes.map(function(scope) {
            return scope.object.ref;
        });

        self.requireLookup(refs, function(err, res) {
            if (err) return cb(err);

            var globals = Object.keys(res).map(function(key) {
                return res[key].properties.map(function(property) {
                    return property.name;
                });
            });

            cb(null, globals.reverse());
        });
    });
};

Client.prototype.requireFrameEval = function(expression, frame, cb) {
    var self = this;
    var req = {
        command: 'evaluate',
        arguments: { expression: expression }
    };

    if (frame === NO_FRAME) {
        req.arguments.global = true;
    } else {
        req.arguments.frame = frame;
    }

    cb = cb || function() {};
    this.send(req, function(err, res) {
        // What is the response here
        if (!err) self._addHandle(res);
        cb(err, res);
    });
};

/*
{ "seq"         : <number>,
  "type"        : "response",
  "request_seq" : <number>,
  "command"     : "backtrace",
  "body"        : { "fromFrame" : <number>
                    "toFrame" : <number>
                    "totalFrames" : <number>
                    "frames" : <array of frames>
                  }
  "running"     : <is the VM running after sending this response>
  "success"     : true
}
*/
Client.prototype.requireBacktrace = function(cb) {
    var req = {
        command: 'backtrace',
        arguments: { inlineRefs: true }
    };

    this.send(req, cb);
};

Client.prototype.requireSource = function(from, to, cb) {
    var req = {
        command: 'source',
        fromLine: from,
        toLine: to
    };

    this.send(req, cb);
};

Client.prototype.step = function(action, count, cb) {
    var req = {
        command: 'continue',
        arguments: {
            stepaction: action,
            stepcount: count
        }
    };

    this.currentFrame = NO_FRAME;
    this.send(req, cb);
};

Client.prototype.mirrorObject = function(handle, depth, cb) {
    var self = this;

    var value;

    if (handle.type === 'object') {
        var propertyRefs = handle.properties.map(function(property) {
            return property.ref;
        });

        cb = cb || function() {};
        this.requireLookup(propertyRefs, function(err, res) {
            if (err) {
                console.error('problem with requireLookup');
                cb(null, handle);
                return;
            }

            var mirror,
                waiting = 1;

            if (handle.className === 'Array') {
                mirror = [];
            } else if (handle.className === 'Date') {
                mirror = new Date(handle.value);
            } else {
                mirror = {};
            }

            var keyValues = [];
            handle.properties.forEach(function(property, index) {
                var value = res[property.ref];
                var mirrorValue;
                if (value) {
                    mirrorValue = value.value ? value.value : value.text;
                } else {
                    mirrorValue = '[?]';
                }

                if (Array.isArray(mirror) && typeof property.name !== 'number') {
                    // Skip the 'length' property
                    return;
                }

                keyValues[index] = {
                    name: property.name,
                    value: mirrorValue
                };
                if (value && value.handle && depth > 0) {
                    waiting++;
                    self.mirrorObject(value, depth - 1, function(err, result) {
                        if (!err) keyValues[index].value = result;
                        waitForOthers();
                    });
                }
            });

            waitForOthers();
            function waitForOthers() {
                if (--waiting === 0 && cb) {
                    keyValues.forEach(function(pair) {
                        mirror[pair.name] = pair.value;
                    });
                    cb(null, mirror);
                }
            };
        });
        return;
    } else if (handle.type === 'function') {
        // value = function() {};
        value = '[Function]';
    } else if (handle.type === 'null') {
        value = null;
    } else if (handle.value !== undefined) {
        value = handle.value;
    } else if (handle.type === 'undefined') {
        value = undefined;
    } else {
        value = handle;
    }
    process.nextTick(function() {
        cb(null, value);
    });
};

Client.prototype.requireContinue = function(cb) {
    this.currentFrame = NO_FRAME;

    var req = {
        command: 'continue'
    };
    this.send(req, cb);
};

Client.prototype.setBreakpoint = function(req, cb) {
    var req = {
        command: 'setbreakpoint',
        arguments: req
    };

    this.send(req, cb);
};

Client.prototype.clearBreakpoint = function(req, cb) {
    var req = {
        command: 'clearbreakpoint',
        arguments: req
    };

    this.send(req, cb);
};

Client.prototype.continue = function(cb) {
    var req = {
        command: 'continue'
    };

    this.send(req, cb);
};

Client.prototype.listBreakpoints = function(cb) {
    var req = {
        command: 'listbreakpoints'
    };

    this.send(req, cb);
};

Client.prototype.fullTrace = function(cb) {
    var self = this;

    cb = cb || function() {};
    this.requireBacktrace(function(err, trace) {
        if (err) return cb(err);
        if (trace.totalFrames <= 0) return cb(Error('No frames'));

        var refs = [];

        for (var i = 0; i < trace.frames.length; i++) {
            var frame = trace.frames[i];
            refs.push(frame.script.ref);
            refs.push(frame.func.ref);
            refs.push(frame.receiver.ref);
        }

        self.requireLookup(refs, function(err, res) {
            if (err) return cb(err);

            for (var i = 0; i < trace.frames.length; i++) {
                var frame = trace.frames[i];
                frame.script = res[frame.script.ref];
                frame.func = res[frame.func.ref];
                frame.receiver = res[frame.receiver.ref];
            }

            cb(null, trace);
        });
    });
};

module.exports = Client;