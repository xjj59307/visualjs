var express = require('express'),
    router = require('./router.js'),
    http = require('http'),
    path = require('path'),
    io = require('socket.io'),
    exec = require('child_process').exec,
    BrowserInterface = require('./debugger/browser_interface');

// open debugger in node
var debuggee = process.argv[2] || "debugger/sort.js";
var child = exec('node --debug-brk=8000 ' + debuggee, function (error, stdout, stderr) {
    if (error !== null) {
        console.log('exec error: ' + error);
    }
});

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.engine('html', require('ejs').renderFile);
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
    app.use(express.errorHandler());
});

var server = http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

// map url to handlers
app.get('/', router.index);
app.get('/graph-demo.html', router.graph);

// create socket.io connection
io = io.listen(server);
io.sockets.on('connection', function(socket) {
    // create connection with node.js debugger
    var browserInterface = new BrowserInterface(socket);

    socket.on('step through', function(data) {
        browserInterface[data.action]();
    });

    socket.on('require source', function() {
        browserInterface.requireSource();
    });
});
