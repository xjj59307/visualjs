Programmable Debugger for NodeJS/V8
====================================

Ever wanted to fully control/program the debugging process?  Now you can using this module to connect and talk to the V8 debugger underyling your running NodeJS code!

To see the protocol check out: [http://code.google.com/p/v8/wiki/DebuggerProtocol]

Start your program like this:

    % node --debug-brk MyScript.js

In another window run a script like this:

    var pDebug = require('./index.js').pDebug
        , debug = new pDebug({ eventHandler: function(event) { console.log('Event'); console.log(event); } })
    ;

    debug.connect(function() { 
        var msg = { command: 'continue' };
        debug.send(msg, function(req, resp) {
                console.log('REQ: ');
                console.log(req);

                console.log('RES: ');
                console.log(resp);
        });
    });

Looking at the V8 Debugger protocol above you can interact with the V8 debugger progammatically, just create message Ojbects that look just like what is documented on the V8 Debugger page and send them off & your callback will get executed when V8 responds.

You can/should also provide an 'eventHandler' to the construtor to handle events that tend to pop up - like 'afterCompile' and breakpoints.

Your NodeJS process running remotely?  No problem!

    new pDebug({host: 'some.other.host'});

Your NodeJS process running on some other port?  No problem!

    % node --debug-brk=9999 MyScript.js

    new pDebug({port: 9999});

API
===

Constructor 
----------

Accepts an optional object containing host (default: 'localhost'), port (default 5858), eventHandler function callback.

The eventHandler callback will get called with one paramter - the event received.

connect
-------

When you are ready to connect to a NodeJS/V8 debugger instance, call this.

One paramter is a function callback to be exercised after the connection is established - now you can start sending/receiving messages

send
----

Send a request to the V8 debugger.  The various messages (and their responses) and their paramters are documented in that first link above.

Accepts up to 3 paramters:

object:  This is the request object and is required.  pDebug will handle sequence numbers for you so do not worry about that

callback: This function will get called back with the V8 response.  The paramter list for this function is (request, response) where 'request' is your original request and 'response' is the V8 response.  'this' for this callback can optionally be set by the next paramter, otherwise 'this' is the pDebug object.

thisp: An optional object paramter, if provided 'this' in your response callback will be thisp, otherwise 'this' in the callback is your pDebug object.

disconnect
----------

Disconnect from the V8 debugger



