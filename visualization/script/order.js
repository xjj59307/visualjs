define(["lib/underscore"], function (_) {

	var initOrder = function (graph) {
		var layering = [];
		_.values(graph.getNodes()).forEach(function (node) {
			var layer = layering[node.value.rank] || (layering[node.value.rank] = []);
			layer.push(node.id);
		});

		return layering;
	};

	var copyLayering = function (layering) {
		return layering.map(function (layer) {
			return layer.slice(0);
		});
	};

	var layerPosition = function (layer) {
		var position = {};
		layer.forEach(function (value, index) {
			position[value] = index;
		});
		return position;
	};

	// use accumulator tree to counting inversions 
	var bilayerCrossCount = function (graph, upperLayering, lowerLayering) {
		var lowerLayeringPosition = layerPosition(lowerLayering);

		var southSequence = [];
		upperLayering.forEach(function (nodeId) {
			var nodeSouthSequence = [];
			graph.getOutEdges(nodeId).forEach(function (edgeId) {
				var target = graph.getEdge(edgeId).target;
				nodeSouthSequence.push(lowerLayeringPosition[target]);
			});
			nodeSouthSequence.sort();
			southSequence = southSequence.concat(nodeSouthSequence);
		});

		var firstIndex = 1;
		while (firstIndex < lowerLayering.length) {
			firstIndex *= 2;
		}
		var treeSize = 2 * firstIndex - 1;
		firstIndex -= 1;
		var tree = [];
		for (var i = 0; i < treeSize; ++i) {
			tree[i] = 0;
		}

		var crossCount = 0;
		southSequence.forEach(function (position) {
			var treeIndex = position + firstIndex;
			tree[treeIndex]++;
			while (treeIndex > 0) {
				if (treeIndex % 2) {
					crossCount += tree[treeIndex + 1];
				}
				treeIndex = (treeIndex - 1) >> 1;
				tree[treeIndex]++;
			}
		});

		return crossCount;
	};

	var crossCount = function (graph, layering) {
		
	};

	var run = function (graph) {
		var layering = initOrder(graph);
		var bestLayering = copyLayering(layering);
	};

	return {
		run: run,
		crossCount: crossCount,
		bilayerCrossCount: bilayerCrossCount
	};

});