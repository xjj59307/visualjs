var pDebug = require('pDebug').pDebug;
var Command = require('./command');

var addScript = function (response) {
    console.log(response);
};

var eventHandler = function (event) {
    console.log('Event');
    console.log(event);
};

var Debug = function () {
    this.debug = new pDebug({
        eventHandler: eventHandler
    });
};

Debug.prototype.connect = function () {
    var self = this;

    this.debug.connect(function() { 
        console.log('connect!'); 

        var command = new Command(self.debug);
        command.requireScripts(function (request, response) {
            console.log(response.length);
            for (var i = 0; i < response.body.length; ++i) {
                addScript(response.body[i]);
            }
        });
    });
};

var debug = new Debug();
debug.connect();