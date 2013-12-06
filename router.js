var BrowserInterface = require('./debugger/browser-interface');

// create connection with node.js debugger
var browserInterface = new BrowserInterface();
exports.browserInterface = browserInterface;

// main page for debugger GUI
exports.index = function(req, res) {
  res.render('index.html');
};

// visualization
exports.graph = function(req, res) {
  res.render('graph-demo.html');
};

// request object evaluation
exports.evaluate = function(req, res) {
  var expr = req.query.expr;
  browserInterface.evaluate(expr, function(err, obj) {
    if (err) res.json({ error: err });
    else res.json(obj);
  });
};
