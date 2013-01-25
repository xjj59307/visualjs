define(["lib/underscore", "graph", "acyclic", "rank", "order", "normalize", "position"], function (_, Graph, acyclic, rank, order, normalize, position) {

	var init = function (graph) {
		_.values(graph.getEdges()).forEach(function (edge) {
			if (edge.source !== edge.target) {
				if(_.isUndefined(edge.value.minLen)) {
					edge.value.minLen = 1;
				};
				if (_.isUndefined(edge.value.width)) {
					edge.value.width = 0;
				}
				if (_.isUndefined(edge.value.height)) {
					edge.value.height = 0;
				}
				if (_.isUndefined(edge.value.points)) {
					edge.value.points = [];
				}
			}
		});
	};

	var run = function (graph) {
		init(graph);

		// Make space for edge labels
		// _.values(graph.getEdges()).forEach(function (edge) {
		// 	edge.value.minLen *= 2;
		// });
		// position.config.rankSep /= 2;

		acyclic.run(graph);
		rank(graph);
		normalize.run(graph);
		order.run(graph);
		position.run(graph);
		normalize.undo(graph);
		acyclic.undo(graph);
	};

	return {
		run: run
	};
	
});
