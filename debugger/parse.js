var fs = require('fs');
var util = require('util');
var js = require('./visualjs');

fs.readFile('./math.visjs', function (err, input) {
    input = '' + input;
    var tree = js.parse(input);
    util.print(JSON.stringify(tree, null, 2));
});
