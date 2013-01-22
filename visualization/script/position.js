define(["lib/underscore"], function (_) {

	var config = {
		nodeSep: 50,
		edgeSep: 10,
		universalSep: null,
		rankSep: 30,
		rankDir: "TB",
	};

	var nodePairId = function (source, target) {
		var sourceName = source.toString();
		var targetName = target.toString();
		return source < target ? (sourceName + "-" + targetName) : (targetName + "-" + sourceName);
	};

	var findConflicts = function (graph, layering) {
		var conflicts = {};
		var position = {};

		if (layering.length <= 2) {
			return conflicts;
		}

		layering[1].forEach(function (value, index) {
			position[value] = index;
		});

		for (var i = 1; i < layering.length - 1; ++i) {
			var prevLayer = layering[i];
			var currLayer = layering[i + 1];
			var lInnerPos = 0; // Position of the last inner segment in the previous layer
			var currPos = 0; // Current position in the current layer

			for (var j = 0; j < currLayer.length; ++j) {
				var nodeId = currLayer[j];
				position[nodeId] = j;
				var rInnerPos = undefined; // Position of the next inner segment in the previous layer or the position of the last element in the previous layer

				if (graph.getNode(nodeId).value.dummy) {
					var predId = graph.getPredecessors(nodeId)[0];
					if (graph.getNode(predId).value.dummy) {
						rInnerPos = position[predId];
					}
				}
				if (rInnerPos === undefined && j === currLayer.length - 1) {
					rInnerPos = currLayer.length - 1;
				}

				if (rInnerPos !== undefined) {
					for(; currPos <= j; ++currPos) {
						graph.getPredecessors(currLayer[currPos]).forEach(function (predId) {
							var predPos = position[predId];
							if (predPos < lInnerPos || predPos > rInnerPos) {
								conflicts[nodePairId(currLayer[currPos], predId)] = true;
							}
						});
					}
					lInnerPos = rInnerPos;
				}
			}
		}

		return conflicts;
	};

	var verticalAlignment = function (graph, layering, conflicts, getOpposites) {
		var position = {};
		var root = {}; // Root of the block that the node participates in
		var align = {}; // Points to the next node in the block or, if the last element in the block, points to the first block's root

		layering.forEach(function (layer) {
			layer.forEach(function (value, index) {
				root[value] = value;
				align[value] = value;
				position[value] = index;
			});
		});

		layering.forEach(function (layer) {
			var prevPos = -1;
			layer.forEach(function (value, index) {
				var opposites = graph[getOpposites](value);

				if (opposites.length > 0) {
					opposites.sort(function (left, right) {
						return position[left] - position[right];
					});
					var midIndex = (opposites.length - 1) / 2;
					opposites.slice(Math.floor(midIndex), Math.ceil(midIndex) + 1).forEach(function (midId) {
						if (align[value] === value) {
							if (!conflicts[nodePairId(midId, value)] && prevPos < position[midId]) {
								align[midId] = value;
								align[value] = root[value] = root[midId];
								predPos = position[midId];
							}
						}
					});
				}
			});
		});

		return { position: position, root: root, align: align };
	}; 

	var getWidth = function (graph, nodeId) {
		switch (config.rankDir) {
			case "LR": return graph.getNode(nodeId).value.height;
			default: return graph.getNode(nodeId).value.width;
		}
	};

	var getSeparation = function (graph, nodeId) {
		if (config.universalSep !== null) {
			return config.universalSep;
		}

		var width = getWidth(graph, nodeId);
		var separation = graph.getNode(nodeId).value.dummy ? config.edgeSep : config.nodeSep;
		return (width + separation) / 2;
	};

	var horizontalCompacting = function (graph, layering, position, root, align) {
		var sink = {};
		var shift = {};
		var prevId = {};
		var xCoordinates = {};

		layering.forEach(function (layer) {
			layer.forEach(function (value, index) {
				sink[value] = value;
				if (index > 0) {
					prevId[value] = layer[index - 1];
				}
			});
		});

		// Root coordinates relative to sink
		var placeBlock = function (rootId) {
			if (!_.has(xCoordinates, rootId)) {
				xCoordinates[rootId] = 0;
				var nodeId = rootId;
				do {
					if (position[nodeId] > 0) {
						var rootOfPrev = root[prevId[nodeId]];
						placeBlock(rootOfPrev);
						if (sink[rootId] === rootId) {
							sink[rootId] = sink[rootOfPrev];
						}
						var delta = getSeparation(graph, prevId[nodeId]) + getSeparation(graph, nodeId);
						if (sink[rootId] !== sink[rootOfPrev]) {
							shift[sink[rootOfPrev]] = Math.min(shift[sink[rootOfPrev]] || Number.POSITIVE_INFINITY, xCoordinates[rootId] - xCoordinates[rootOfPrev] - delta);
						} else {
							xCoordinates[rootId] = Math.max(xCoordinates[rootId], xCoordinates[rootOfPrev] + delta);
						}
					}
					nodeId = align[nodeId];
				} while (nodeId !== rootId);
			}
		};

		_.values(root).forEach(function (rootId) {
			placeBlock(rootId);
		});

		// Absolute coordinates
		layering.forEach(function (layer) {
			layer.forEach(function (nodeId) {
				xCoordinates[nodeId] = xCoordinates[root[nodeId]];
				var xDelta = shift[sink[nodeId]];
				if (root[nodeId] === nodeId && xDelta < Number.POSITIVE_INFINITY) {
					xCoordinates[nodeId] += xDelta;
				}
			});
		});

		return xCoordinates;
	};

	var run = function (graph) {
		var layering = [];
		_.values(graph.getNodes()).forEach(function (node) {
			var rank = node.value.rank;
			var layer = layering[rank] || (layering[rank] = []);
			layer[node.value.order] = node.id;
		});

		var conflicts = findConflicts(graph, layering);
	};

	return {
		run: run,
		_findConflicts: findConflicts,
		_verticalAlignment: verticalAlignment,
		_horizontalCompacting: horizontalCompacting
	};

});
