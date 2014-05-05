// Generate a math expression tree with height 4.
var generate = function(depth) {
  // Every leaf is valued 1.
  if (depth > 0) return { value: 1 };

  var operator = Math.floor(Math.random()*10) % 4;
  return { op: operator, left: generate(depth+1), right: generate(depth+1) };
};

var node = generate(0);

node.left.value *= 2;

console.log(node);

