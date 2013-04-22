var RouteInterface = require('./debugger/route_interface');

// create connection with node.js debugger
var routeInterface = new RouteInterface();

// main page for debugger GUI
exports.index = function(req, res) {
    res.render('index.html');
};

// visualization
exports.graph = function(req, res) {
    res.render('graph-demo.html')
};

// request object evaluation
exports.repl = function(req, res) {
    var code = req.query.code;
    routeInterface.evaluate(code, function(result) {
        res.send(JSON.stringify(result));
    });
};
