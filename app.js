var express = require('express'),
    router = require('./router.js'),
    http = require('http'),
    path = require('path'),
    io = require('socket.io'),
    exec = require('child_process').exec;

var child = exec('node --debug-brk=8000 debugger/sort.js',
  function (error, stdout, stderr) {
    // console.log('stdout: ' + stdout);
    // console.log('stderr: ' + stderr);
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

// Map url to handlers
app.get('/', router.index);
app.get('/graph-demo.html', router.graph);
app.get('/repl', router.repl);
// app.post('/step/:action', router.step);

io = io.listen(server);
io.sockets.on('connection', function(socket) {
    socket.on('step', function(data) {
        router.step(data);
    });
});

