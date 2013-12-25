VisualJS
========

Bind visual elements with program dynamic information from `node --debug-brk` using v8 protocol, and make algorithm animation in browser using d3.js

## Installation and Running 

1. Install project dependencies with `npm install`.
2. Start debugger on target with `node app file-to-debug.js`.
3. Open http://localhost:3000/.

## Example

The javascript program generates a math expression tree.
```js
// Generate a math expression tree with height 4.
var generate = function(depth) {
  // Every leaf is valued 1.
  if (depth > 2) return 1;

  var operator = Math.floor(Math.random()*10) % 4;
  return { op: operator, left: generate(depth+1), right: generate(depth+1) };
};

var root = generate(0);
var left = root.left;
var right = root.right;
```

The script showed how to create program driven visualization.
```
operator: pattern {
  exec plus when (self.op === 0),
  exec minus when (self.op === 1),
  exec times when (self.op === 2),
  exec divide when (self.op === 3),
  exec value when (typeof self === 'number')
}

plus: action {
  create node=tree_node(label = '+'),
  create tree_edge(from = parent, to = node),
  next self.left(op = '+', parent = node),
  next self.right(op = '+', parent = node)
}

minus: action {
  create node=tree_node(label = '-'),
  create tree_edge(from = parent, to = node),
  next self.left(op = '-', parent = node),
  next self.right(op = '-', parent = node)
}

times: action {
  create node=tree_node(label = '*'),
  create tree_edge(from = parent, to = node),
  next self.left(op = '*', parent = node),
  next self.right(op = '*', parent = node)
}

divide: action {
  create node=tree_node(label = '/'),
  create tree_edge(from = parent, to = node),
  next self.left(op = '/', parent = node),
  next self.right(op = '/', parent = node)
}

value: action {
  create node=tree_node(label = self),
  create tree_edge(from = parent, to = node)
}
```

Screenshot of above example. 
![ScreenShot](https://raw.github.com/xjj59307/visualjs/master/screenshots/screenshot-mathexpression.png)
