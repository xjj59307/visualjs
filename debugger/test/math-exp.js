// Generate a math expression tree with height 4.
var generate = function(depth) {
  // Every leaf is valued 1.
  if (depth > 1) return { value: 1 };

  var operator = Math.floor(Math.random()*10) % 4;
  return { op: operator, left: generate(depth+1), right: generate(depth+1) };
};

var modify = function(node) {
  if (typeof node !== 'object') return;

  if (node.value) 
    node.value *= 10;
  else
    modify(node.left);
};

var node = generate(0);
modify(node);
console.log(root);
