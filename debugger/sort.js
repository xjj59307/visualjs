var data = [];

for (var i = 1; i <= 25; ++i) {
    var value = Math.random();
    var element = { id: i, value: value };

    data.push(element);
}

data.sort(function(a, b) {
    return b.value - a.value;
});

