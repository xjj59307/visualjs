var data = [];

var swap = function(lIndex, rIndex) {
  data[rIndex] = [data[lIndex], data[lIndex] = data[rIndex]][0];
};

for (var i = 1; i <= 25; ++i)
  data.push({ value: Math.random() });

swap(0, 1);
swap(2, 3);

data[0].value /= 2;
data[1].value /= 2;
