var express = require('express');
var router = require('./router.js');
var http = require('http');
var path = require('path');
var io = require('socket.io');
var exec = require('child_process').exec;

// open debugger in node
var debuggee = process.argv[2] || "debugger/sort.js";
var child = exec('node --debug-brk=8000 ' + debuggee, function (error) {
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
  app.use(express.json());
  app.use(express.urlencoded());
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
app.get('/eval', router.evaluate);

// create socket.io connection
io = io.listen(server);
io.sockets.on('connection', function(socket) {
  router.browserInterface.setSocket(socket);

  socket.on('new job', function(job) {
    router.browserInterface.addJob(job);
  });
});
