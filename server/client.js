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

Client.prototype.onResponse = function(response) {
    switch (response.event) {
        case 'break':
            this.emit('break', response.body);
            break;
        case 'afterCompile':
            this._addHandle(response.body.script);
            break;
        default:
            this.emit('exception', response.body);
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

Client.prototype.requireScripts = function(callback) {
    var self = this;
    callback = callback || function() {};

    var request = {
        command: 'scripts'
    };
    this.send(request, function(err, response) {
        if (err) return callback(err);

        for (var i = 0; i < response.length; ++i) {
            self._addHandle(response[i]);
        }
        callback();
    });
};

Client.prototype.requireLookup = function(refs, callback) {
    var self = this;

    var request = {
        command: 'lookup',
        arguments: { handles: refs }
    };

    callback = callback || function() {};
    this.send(request, function(err, response) {
        if (err) return callback(err);

        for (var ref in response) {
            if (typeof response[ref] === 'object') {
                self._addHandle(response[ref]);
            }
        }

        callback(null, response);
    });
};

Client.prototype.requireScopes = function(callback) {
    var self = this,
        request = {
            command: 'scopes',
            arguments: {}
        };

    callback = callback || function() {};
    this.send(request, function(err, response) {
        if (err) return callback(err);

        var refs = response.scopes.map(function(scope) {
            return scope.object.ref;
        });

        self.requireLookup(refs, function(err, response) {
            if (err) return callback(err);

            var globals = Object.keys(response).map(function(key) {
                return response[key].properties.map(function(property) {
                    return property.name;
                });
            });

            callback(null, globals.reverse());
        });
    });
};

Client.prototype.requireEval = function(expression, callback) {
    var self = this;

    if (this.currentFrame === NO_FRAME) {
        // Only need to eval in global scope
        this.requireFrameEval(expression, NO_FRAME, callback);
        return;
    }

    callback = callback || function() {};
    // Otherwise we need to get the current frame to see which scopes it has
    this.requireBacktrace(function(err, backtrace) {
        if (err || !backtrace.frames) {
            return callback(null, {});
        }

        var frame = backtrace.frames[self.currentFrame];

        var evalFrames = frames.scopes.map(function(scope) {
            if (!scope) return;
            var frame = backtrace.frames[scope.index];
            if (!frame) return;
            return frame.index;
        });

        self._requireFrameEval(expression, evalFrames, callback);
    });
};

Client.prototype._requireFrameEval = function(expression, evalFrames, callback) {
    if (evalFrames.length === 0) {
        // Just eval in global scope
        this.requireFrameEval(expression, NO_FRAME, callback);
        return;
    }

    var self = this;
    var i = evalFrames.shift();

    callback = callback || function() {};
    this.requireFrameEval(expression, i, function(err, response) {
        if (!err) return callback(null, response);
        self._requireFrameEval(expression, evalFrames, callback);
    });
};

Client.prototype.requireFrameEval = function(expression, frame, callback) {
    var self = this;
    var request = {
        command: 'evaluate',
        arguments: { expression: expression }
    };

    if (frame === NO_FRAME) {
        request.arguments.global = true;
    } else {
        request.arguments.frame = frame;
    }

    callback = callback || function() {};
    this.send(request, function(err, response) {
        // What is the response here
        if (!err) self._addHandle(response);
        callback(err, response);
    });
};

Client.prototype.requireBacktrace = function(callback) {
    var request = {
        command: 'backtrace',
        arguments: { inlineRefs: true }
    };

    this.send(request, callback);
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

Client.prototype.mirrorObject = function(handle, depth, callback) {
    var self = this;

    var value;

    if (handle.type === 'object') {
        var propertyRefs = handle.properties.map(function(property) {
            return property.ref;
        });

        callback = callback || function() {};
        this.requireLookup(propertyRefs, function(err, response) {
            if (err) {
                console.error('problem with requireLookup');
                callback(null, handle);
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
                var value = response[property.ref];
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

                keyValues[i] = {
                    name: property.name,
                    value: mirrorValue
                };
                if (value && value.handle && depth > 0) {
                    waiting++;
                    self.mirrorObject(value, depth - 1, function(err, result) {
                        if (!err) keyValues[i].value = result;
                        waitForOthers();
                    });
                }
            });

            waitForOthers();
            function waitForOthers() {
                if (--waiting === 0 && callback) {
                    keyValues.forEach(function(pair) {
                        mirror[pair.name] = pair.value;
                    });
                    callback(null, mirror);
                }
            };
        });
        return;
    } else if (handle.type === 'function') {
        val = function() {};
    } else if (handle.type === 'null') {
        val = null;
    } else if (handle.value !== undefined) {
        val = handle.value;
    } else if (handle.type === 'undefined') {
        val = undefined;
    } else {
        val = handle;
    }
    process.nextTick(function() {
        callback(null, val);
    });
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

Client.prototype.fullTrace = function(callback) {
    var self = this;

    callback = callback || function() {};
    this.requireBacktrace(function(err, trace) {
        if (err) return callback(err);
        if (trace.totalFrames <= 0) return callback(Error('No frames'));

        var refs = [];

        for (var i = 0; i < trace.frames.length; i++) {
            var frame = trace.frames[i];
            refs.push(frame.script.ref);
            refs.push(frame.func.ref);
            refs.push(frame.receiver.ref);
        }

        self.requireLookup(refs, function(err, response) {
            if (err) return callback(err);

            for (var i = 0; i < trace.frames.length; i++) {
                var frame = trace.frames[i];
                frame.script = response[frame.script.ref];
                frame.func = response[frame.func.ref];
                frame.receiver = response[frame.receiver.ref];
            }

            callback(null, trace);
        });
    });
};

module.exports = Client;