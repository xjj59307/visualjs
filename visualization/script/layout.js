define(["lib/underscore", "utility", "graph", "acyclic", "rank", "order", "normalize", "position"], function (_, util, Graph, acyclic, rank, order, normalize, position) {

	var config = {
		nodeSep: 50,
		edgeSep: 10,
		universalSep: null,
		rankSep: 30,
		rankDir: "TD",

		// Nodes to lay out, at least must have "width" and "height" properties
		nodes: [],

		// Edges to lay out, at least must have "source" and "target" properties
		edges: []
	};

	var self = {};

	self.nodes = util.propertyAccessor(self, config, "nodes");
	self.edges = util.propertyAccessor(self, config, "edges");
	
	self.nodeSep = util.delegateProperty(self, position.nodeSep);
	self.edgeSep = util.delegateProperty(self, position.edgeSep);
	self.universalSep = util.delegateProperty(self, position.universalSep);
	self.rankSep = util.delegateProperty(self, position.rankSep);
	self.rankDir = util.delegateProperty(self, position.rankDir);

	var init = function () {
		var graph = Graph();
		var nextId = 0;

		config.nodes.forEach(function (node) {
			var id = (_.has(node, "id") ? node.id: "_N" + nextId++);
			node.content = {
				id: id,
				width: node.width,
				height: node.height
			};
			graph.addNode(id, node.content);
		});

		config.edges.forEach(function (edge) {
			var source = edge.source.content.id;
			if (!graph.hasNode(source)) {
				throw new Error("Source node for '" + edge + "'not in node list");
			}

			var target = edge.target.content.id;
			if (!graph.hasNode(target)) {
				throw new Error("Target node for '" + edge + "'not in node list");
			}

			if (source !== target) {
				var id = (_.has(edge, "id") ? edge.id : "_E" + nextId++);
				edge.content = {
					id: id,
					minLen: edge.minLen || 1,
					width: edge.width || 0,
					height: edge.height || 0,
					points: []
				};
				graph.addEdge(id, source, target, edge.content);
			}
		});

		return graph;
	};

	var run = function () {
		var rankSep = self.rankSep();
		try {
			if (!config.nodes.length) {
				return;
			}

			var graph = init();

			// Make space for edge labels
			_.values(graph.getEdges()).forEach(function (edge) {
				edge.value.minLen *= 2;
			});
			self.rankSep(rankSep / 2);

			acyclic.run(graph);
			rank.run(graph);
			normalize.run(graph);
			order.run(graph);
			position.run(graph);
			normalize.undo(graph);
			acyclic.undo(graph);
		} finally {
			self.rankSep(rankSep);
		}

		return self;
	};

	self.run = run;

	return self;
	
});
