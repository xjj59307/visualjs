var net = require('net');

var Protocal = function(obj) {
    this.port = obj && obj.port || 5858;
    this.host = obj && obj.host || 'localhost';
    this.seq = 0;
    this.sendedRequests = {};
    this.eventHandler = obj && obj.eventHandler;
};

Protocal.prototype._handleResponse = function(body) {
    var response = JSON.parse(body);
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

Protocal.prototype.connect = function(callback) {
    var inHeader = true,
        body = '',
        currentLength = 0;
        self = this;

    process.stdout.write('Connecting');

    var setupConnection = function() {
        self.client = net.connect(self.port, self.host, callback);

        // Try to connect every second
        self.client.on('error', function() {
            process.stdout.write('.');
            setTimeout(setupConnection, 1000);
        });

        self.client.on('data', function(data) {
            var lines = data.toString().split('\r\n');

            lines.forEach(function(line) {
                if (!line) {
                    inHeader = false;
                    return;
                }

                if (inHeader) {
                    var vals = line.split(':');
                    if (vals[0] === 'Content-Length') {
                        currentLength = parseInt(vals[1], 10);
                    }
                } else {
                    body += line;
                }
            });

            if (body.length === currentLength) {
                inHeader = true;
                if (body) {
                    self._handleResponse(body);
                    body = '';
                }
            }
        });

        self.client.on('end', function() {
            process.stdout.write('client disconnected');
        });
    }

    setupConnection();
};

Protocal.prototype.disconnect = function() {
    this.client.end();
};

Protocal.prototype.send = function(request, callback) {
    request.seq = ++this.seq;
    request.type = 'request';

    var str = JSON.stringify(request);
    var header = 'Content-Length:';
    this.client.write(header + str.length + '\r\n\r\n' + str);

    request.callback = callback;
    this.sendedRequests[this.seq] = request;
};

module.exports = Protocal;