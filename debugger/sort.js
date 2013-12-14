var data = [];

(function() {
    for (var i = 1; i <= 10; ++i) {
        var value = Math.random();
        var element = { id: i, value: value };

        data.push(element);
    }
})();

data.sort(function(a, b) {
    return b.value - a.value;
});

/*
var data = [],
    length = 10;

(function() {
    for (var i = 0; i < length; ++i) {
        // var value = Math.random();
        var value = i;
        var element = { id: i, value: value };
        data.push(element);
    }
})();

var swap = function(left, right) {
    var middle = data[left];
    data[left] = data[right];
    data[right] = middle;
};

for (var lIndex = 0; lIndex < length; lIndex++) {
    for (var rIndex = lIndex + 1; rIndex < length; rIndex++) {
        if (data[lIndex].value < data[rIndex].value) {
            swap(lIndex, rIndex);
        }
    }
}
*/
