var path = require('path');

// Return number of digits
var numLen = function(num) {
    if (num < 50) {
        return 2;
    } else if (num < 950) {
        return 3;
    } else if (num < 9950) {
        return 4;
    } else {
        return 5;
    }
};

// Adds spaces and prefix to number
var leftPad = function(num, prefix) {
    var strNum = num.toString(),
        nspaces = numLen(num) - strNum.length;

    prefix = prefix || ' ';
    for (var i = 0; i < nspaces; i++) {
        prefix += ' ';
    }

    return prefix + strNum;
};

var SourceUnderline = function(sourceText, position, repl) {
    if (!sourceText) return '';

    var head = sourceText.slice(0, position),
        tail = sourceText.slice(position);

    // Colourize char if stdout supports colours
    if (repl && repl.useColors) {
        tail = tail.replace(/(.+?)([^\w]|$)/, '\u001b[32m$1\u001b[39m$2');
    }

    // Return source line with coloured char at 'position'
    return [head, tail].join('');
};

var SourceInfo = function(body) {
    var result = body.exception ? 'exception in ' : 'break in ';

    if (body.script) {
        if (body.script.name) {
            var name = body.script.name,
                // Get current path
                dir = path.resolve() + '/';

            // Change path to relative, if possible
            if (name.indexOf(dir) === 0) {
                name = name.slice(dir.length);
            }

            result += name;
        } else {
            result += '[unnamed]';
        }
    }

    result += ':';
    result += body.sourceLine + 1;

    if (body.exception) result += '\n' + body.exception.text;

    return result;
};

module.exports.leftPad = leftPad;
module.exports.SourceUnderline = SourceUnderline;
module.exports.SourceInfo = SourceInfo;