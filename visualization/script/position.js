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

	var run = function (graph) {
		var layering = [];
		_.values(graph.getNodes()).forEach(function (node) {
			var rank = node.value.rank;
			var layer = layering[rank] || (layering[rank] = []);
			layer[node.value.order] = node.id;
		});
	};

	return {
		run: run,
		_findConflicts: findConflicts
	};

});
