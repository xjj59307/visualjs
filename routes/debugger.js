var util = require('util');

exports.repl = function(req, res) {
    res.send(util.inspect(req.query));
};