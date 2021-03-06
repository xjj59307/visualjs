var require = {
  baseUrl: "../javascripts",
  paths: {
    "layout": "object-graph/layout",
    "utility": "object-graph/utility",
    "graph": "object-graph/graph",
    "acyclic": "object-graph/acyclic",
    "rank": "object-graph/rank",
    "order": "object-graph/order",
    "normalize": "object-graph/normalize",
    "position": "object-graph/position",
    "prim": "object-graph/prim"
  },
  shim: {
    "lib/d3.v3": { exports: "d3" },
    "lib/underscore": { exports: "_" },
    "lib/buckets": { exports: "buckets" },
    "lib/priority-queue": { exports: "priorityQueue" },
    "lib/jquery-1.8.2": { exports: "$" },
    "lib/ace/ace": { exports: "ace" },
    "lib/jquery.terminal-0.8.7": { deps: ["lib/jquery-1.8.2"] },
    "lib/jquery.mousewheel": { deps: ["lib/jquery-1.8.2"] }
  }
};

