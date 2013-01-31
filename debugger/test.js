var pDebug = require('./index.js').pDebug
    , debug = new pDebug({ eventHandler: function(event) { console.log('Event'); console.log(event); } })
;

debug.connect(function() { 
        console.log('connect!'); 
                //var msg = { command: 'source', arguments: { fromLine: 10, toLine: 20 } };
                var msg = { command: 'continue' };
                debug.send(msg, function(req, resp) {
                        console.log('REQ: ');
                        console.log(req);

                        console.log('RES: ');
                        console.log(resp);
                });
        
        });


