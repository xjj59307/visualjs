define(["lib/underscore"], function (_) {

	var config = {
		iterations: 24
	};

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
			nodeSouthSequence.sort(function (left, right) {
				return left - right;
			});
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

	var getCrossCount = function (graph, layering) {
		var result = 0;
		var prevLayer;
		layering.forEach(function (layer) {
			if (prevLayer) {
				result += bilayerCrossCount(graph, prevLayer, layer);
			}
			prevLayer = layer;
		});

		return result;
	};

	// This function differs with graph.getPredecessors(nodeId). Here returns predecessors of every incident edge which can be repeated
	var getMultiPredecessors = function (graph) {
		return function (nodeId) {
			var predecessors = [];
			graph.getInEdges(nodeId).forEach(function (edgeId) {
				predecessors.push(graph.getEdge(edgeId).source);
			});

			return predecessors;
		};
	};

	var getMultiSuccessors = function (graph) {
		return function (nodeId) {
			var successors = [];
			graph.getOutEdges(nodeId).forEach(function (edgeId) {
				successors.push(graph.getEdge(edgeId).target);
			});

			return successors;
		};
	};

	var barycenterLayer = function (fixed, movable, getOpposites) {
		var position = layerPosition(movable);
		var centers = barycenters(fixed, movable, getOpposites);

		var newOrder = movable.filter(function (nodeId) {
			return centers[nodeId] !== -1;
		});
		newOrder.sort(function (left, right) {
			return centers[left] - centers[right] || position[left] - position[right];
		});

		for (var i = movable.length - 1; i >= 0; --i) {
			if (centers[movable[i]] !== -1) {
				movable[i] = newOrder.pop();
			}
		}
	};

	var barycenters = function (fixed, movable, getOpposites) {
		var position = layerPosition(fixed);
		var centers = {};

		movable.forEach(function (nodeId) {
			var average = -1;
			var opposites = getOpposites(nodeId);
			if (opposites.length > 0) {
				average = 0;
				opposites.forEach(function (opposite) {
					average += position[opposite];
				});
				average /= opposites.length;
			}
			centers[nodeId] = average;
		});

		return centers;
	};

	var sweep = function (graph, iter, layering) {
		if (iter % 2 === 0) {
			for (var i = 1; i < layering.length; ++i) {
				barycenterLayer(layering[i - 1], layering[i], getMultiPredecessors(graph));
			}
		} else {
			for (var i = layering.length - 2; i >= 0; --i) {
				barycenterLayer(layering[i + 1], layering[i], getMultiSuccessors(graph));
			}
		}

		return getCrossCount(graph, layering);
	};

	var run = function (graph) {
		var layering = initOrder(graph);
		var bestLayering = copyLayering(layering);
		var bestCrossCount = getCrossCount(graph, layering);

		for (var i = 0, lastBest = 0; lastBest < 4 && i < config.iterations; ++i, ++lastBest) {
			var crossCount = sweep(graph, i, layering);
			if (crossCount < bestCrossCount) {
				bestLayering = copyLayering(layering);
				bestCrossCount = crossCount;
				lastBest = 0;
			}
		}

		bestLayering.forEach(function (layer) {
			layer.forEach(function (value, index) {
				graph.getNode(value).value.order = index;
			});
		});

		return bestLayering;
	};

	// expose methods except for run() for test
	return {
		run: run,
		_getCrossCount: getCrossCount,
		_bilayerCrossCount: bilayerCrossCount,
		_barycenterLayer: barycenterLayer
	};

});