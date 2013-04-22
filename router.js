exports.index = function(req, res) {
    res.render('index.html');
};

exports.graph = function(req, res) {
    res.render('graph-demo.html')
};

exports.repl = function(req, res) {
    res.send();
};
