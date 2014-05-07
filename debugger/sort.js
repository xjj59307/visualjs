// Generate a math expression tree with height 4.
var generate = function(depth) {
  // Every leaf is valued 1.
  if (depth > 0) return { value: 1 };

  var operator = Math.floor(Math.random()*10) % 4;
  return { op: operator, left: generate(depth+1), right: generate(depth+1) };
};

var root = generate(0);
root.left.value = 200000000;
root.right.value *= 2;

root.left = { op: 2, left: { value: 1 }, right: { value: 1 } };
