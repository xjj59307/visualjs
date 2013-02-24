var Interface = require('./interface');
var WebSocketServer = require('ws').Server;

// stdin = process.stdin;
// stdout = process.stdout;
// var interface = new Interface(stdin, stdout);

var server = new WebSocketServer({port: 8888});
server.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log(message);
    });
    ws.send('connected');
});




