define(["lib/underscore"], function (_) {

	var run = function (graph) {
		var dummyCount = 0;
		_.values(graph.getEdges()).forEach(function (edge) {
			var sourceRank = graph.getNode(edge.source).value.rank;
			var targetRank = graph.getNode(edge.target).value.rank;

			if (sourceRank + 1 < targetRank) {
				for (var sourceId = edge.source, rank = sourceRank + 1, i = 0; rank < targetRank; ++rank, ++i) {
					var dummyNodeId = "_D" + (++dummyCount);
					var node = {
						width: edge.value.width,
						height: edge.value.height,
						edge: edge,
						rank: rank,
						dummy: true
					};

					// If this node represents a bend then we will use it as a control point. For edges with 2 segments this will be the center dummy node. For edges with more than 2 segments, this will be the first and last dummy node
					if (i === 0) {
						node.index = 0;
					} else if (rank + 1 === targetRank) {
						node.index = 1;
					}

					graph.addNode(dummyNodeId, node);
					graph.addEdge(null, sourceId, dummyNodeId, {});
					sourceId = dummyNodeId;
				}

				graph.addEdge(null, sourceId, edge.target, {});
				graph.deleteEdge(edge);
			}
		});
	};

	var undo = function (graph) {
		_.values(graph.getNodes()).forEach(function (node) {
			if (node.value.dummy && _.has(node.value, "index")) {
				var edge = node.value.edge;
				if (graph.hasEdge(edge.id)) {
					graph.addEdge(edge.id, edge.source, edge.target, edge.value);
				}

				var points = graph.getEdge(edge.id).value.points;
				points[node.value.index] = {
					x: node.value.x,
					y: node.value.y,
				};
			}

			if (node.value.dummy) {
				graph.deleteNode(node.id);
			}
		});
	};

	return {
		run: run,
		undo: undo
	};

});
