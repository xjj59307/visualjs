define(["lib/underscore", "lib/buckets", "lib/priority-queue"], function (_, buckets, PriorityQueue) {

	return function prim (graph, getWeight) {
		var tree = {};
		var predecessor = {};
        var priorityQueue = PriorityQueue();

        _.values(graph.getNodes()).forEach(function (node) {
        	priorityQueue.add(node.id, Number.POSITIVE_INFINITY);
        	tree[node.id] = [];
        });
        priorityQueue.decrease(_.keys(graph.getNodes())[0], 0);

        var initial = false;
        while (priorityQueue.size() > 0) {
        	var nodeId = priorityQueue.removeMin();

        	if (_.has(predecessor, nodeId)) {
        		tree[nodeId].push(predecessor[nodeId]);
        		tree[predecessor[nodeId]].push(nodeId);
        	} else if (initial) {
        		throw new Error("Input graph is not connected:\n" + graph.toString());
        	} else {
        		initial = true;
        	}

        	graph.getNeighbors(nodeId).forEach(function (neighborId) {
        		var priority = priorityQueue.priority(neighborId);
                if (!_.isUndefined(priority)) {
                    var weight = getWeight(nodeId, neighborId);
                    if (weight < priority) {
                        predecessor[neighborId] = nodeId;
                        priorityQueue.decrease(neighborId, weight);
                    }
                }
            });
        }

        return tree;
    };

});
