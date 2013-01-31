var pDebug = require('./index.js').pDebug;
var debug = new pDebug({
    eventHandler: function(event) {
        console.log('Event');
        console.log(event);
    }
});

debug.connect(function() { 
    console.log('connect!'); 

    var brkMsg = {
        command: 'setbreakpoint',
        arguments: {
            type: 'script',
            target: '/Users/junjianxu/Dropbox/projects/visualjs/debugger/source.js',
            line: 4
        }
    };
    debug.send(brkMsg, function(req, resp) {
        console.log('REQ: ');
        console.log(req);

        console.log('RES: ');
        console.log(resp);
    });

    var ctnMsg = {
        command: 'continue'
    };
    debug.send(ctnMsg, function(req, resp) {
        console.log('REQ: ');
        console.log(req);

        console.log('RES: ');
        console.log(resp);
    });

    setTimeout(function () {
        var evalMsg = {
            command: 'evaluate',
            arguments: { 
                expression: 'greet("xu")'
            }
        };
        debug.send(evalMsg, function(req, resp) {
            console.log('REQ: ');
            console.log(req);

            console.log('RES: ');
            console.log(resp);
        });
    }, 3000);
});


