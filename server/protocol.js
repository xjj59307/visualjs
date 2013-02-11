var net = require('net');
var util = require('util');

var Protocol = function(obj) {
    net.Stream.call(this);

    this.port = obj && obj.port || 5858;
    this.host = obj && obj.host || 'localhost';
    this.seq = 0;
    this.sendedRequests = {};
    this.eventHandler = obj && obj.eventHandler;
    this._newResponse();
};
util.inherits(Protocol, net.Stream);

Protocol.prototype._handleResponse = function(response) {
    var requestSeq = response.request_seq;
    if (self.sendedRequests[requestSeq]) {
        // Response for sended request
        var request = self.sendedRequests[requestSeq];
        if (request.callback) {
            var err;
            if (response.success === false) {
                err = response.message || true;
            } else if (response.body && response.body.success === false) {
                err = response.body.message || true;
            }

            request.callback.call(self, err, response);
        }
        delete self.sendedRequests[requestSeq];
    } else {
        // Response by event
        if (response.type === 'event' && self.eventHandler) {
            self.eventHandler.call(self, response);
        } else {
            process.stdout.write('unknown message from server');
            process.stdout.write(response);
        }
    }
};

Protocol.prototype._newResponse = function(raw) {
    this.response = {
        raw: raw || '',
        headers: {}
    };
    this.state = 'headers';
    this._execute('');
};

Protocol.prototype._execute = function(data) {
    var response = this.response;
    response.raw += data;

    switch (this.state) {
        case 'headers':
            var endHeaderIndex = response.raw.indexOf('\r\n\r\n');
            if (endHeaderIndex < 0) break;

            var rawHeader = response.raw.slice(0, endHeaderIndex);
            var endHeaderByteIndex = Buffer.byteLength(rawHeader, 'utf8');
            var lines = rawHeader.split('\r\n');
            for (var i = 0; i < lines.length; ++i) {
                var vals = lines[i].split(/: +/);
                response.headers[vals[0]] = vals[1];
            }

            // use + symbol to convert string to number
            this.contentLength = +response.headers['Content-Length'];
            this.bodyStartByteIndex = endHeaderByteIndex + 4;

            this.state = 'body';

            var len = Buffer.byteLength(response.raw, 'utf8');
            if (len - this.bodyStartByteIndex < this.contentLength) break;
            // No break for passing through
        case 'body':
            var resRawByteLength = Buffer.byteLength(response.raw, 'utf8');

            if (resRawByteLength - this.bodyStartByteIndex >= this.contentLength) {
                var buf = new Buffer(resRawByteLength);
                buf.write(response.raw, 0, resRawByteLength, 'utf8');
                response.body = buf.slice(this.bodyStartByteIndex, this.bodyStartByteIndex + this.contentLength).toString('utf8');
                response.body = response.body.length ? JSON.parse(response.body) : {};

                if (this.contentLength) {
                    this._handleResponse(response.body);
                }

                this._newResponse(buf.slice(this.bodyStartByteIndex + this.contentLength).toString('utf8'));
            }
            break;
        default:
            throw new Error('Unknown state');
            break;
    }
};

Protocol.prototype.connectToNode = function(callback) {
    var inHeader = true,
        body = '',
        currentLength = 0;
        self = this;

    self.setEncoding('utf8');
    self.on('error', function() {
        process.stdout.write('.');
        setTimeout(setupConnection, 2000);
    });

    // self.setEncoding('utf8');
    self.on('data', function(data) {
        self._execute(data);
    });

    self.on('end', function() {
        process.stdout.write('client disconnected');
    });

    // Try to connect every second
    process.stdout.write('connecting');
    var setupConnection = function() {
        self.connect(self.port, self.host, callback);
    }
    setupConnection();
};

Protocol.prototype.disconnect = function() {
    this.end();
};

Protocol.prototype.send = function(request, callback) {
    request.seq = ++this.seq;
    request.type = 'request';
    var str = JSON.stringify(request);
    var header = 'Content-Length:';

    // Following statements must be executed before write, otherwise it is possible that response returns back before their execution
    request.callback = callback;
    this.sendedRequests[this.seq] = request;

    this.write(header + str.length + '\r\n\r\n' + str);
};

module.exports = Protocol;