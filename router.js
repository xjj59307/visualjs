var RouteInterface = require('./debugger/route_interface');

// create connection with node.js debugger
var routeInterface = new RouteInterface();
exports.routeInterface = routeInterface;

// main page for debugger GUI
exports.index = function(req, res) {
    res.render('index.html');
};

// visualization
exports.graph = function(req, res) {
    res.render('graph-demo.html');
};

// request object evaluation
exports.eval = function(req, res) {
    var expr = req.query.expr;
    routeInterface.evaluate(expr, function(obj) {
        res.json(obj);
    });
};

exports.step = function(req) {
    var action = req.action;
    routeInterface[action]();
};

exports.requireSource = function() {
    routeInterface.requireSource();
};
