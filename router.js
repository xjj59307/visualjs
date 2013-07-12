// main page for debugger GUI
exports.index = function(req, res) {
    res.render('index.html');
};

// visualization
exports.graph = function(req, res) {
    res.render('graph-demo.html');
};
