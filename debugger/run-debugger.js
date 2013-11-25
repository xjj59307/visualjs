var Interface = require('./cmd-interface'),
    exec = require('child_process').exec;

// Open debugger in node.
var debuggee = process.argv[2] || "debugger/sort.js";
var child = exec('node --debug-brk=8000 ' + debuggee, function (error, stdout, stderr) {
    if (error !== null) {
        console.log('exec error: ' + error);
    }
});

// Start client for debugger in terminal.
var stdin = process.stdin;
var stdout = process.stdout;
var interface = new Interface(stdin, stdout);
