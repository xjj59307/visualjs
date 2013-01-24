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
		var visited = {};

		_.values(graph.getNodes()).forEach(function (node) {
			if (node.value.dummy) {
				var edge = node.value.edge;
				if (graph.hasEdge(edge.id)) {
					graph.addEdge(edge.id, edge.source, edge.target, edge.value);
				}

				graph.deleteNode(node.id);
			}
		});
	};

	return {
		run: run,
		undo: undo
	};

});
