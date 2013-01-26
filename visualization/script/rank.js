define(["lib/underscore", "lib/priority-queue", "prim"], function (_, PriorityQueue, prim) {

    var initRank = function (graph) {
        var minRank = {};
        var priorityQueue = PriorityQueue();

        _.values(graph.getNodes()).forEach(function (node) {
            priorityQueue.add(node.id, graph.getInEdges(node.id).length);
            minRank[node.id] = 0;
        });
        
        while (priorityQueue.size() > 0) {
            var nodeId = priorityQueue.removeMin();
            if (priorityQueue.priority(nodeId) > 0) {
                throw new Error("Input graph is not acyclic: " + graph.toString());
            }

            var rank = minRank[nodeId];
            graph.getNode(nodeId).value.rank = rank;

            graph.getOutEdges(nodeId).forEach(function (id) {
                var target = graph.getEdge(id).target;
                minRank[target] = Math.max(minRank[target], rank + (graph.getEdge(id).value.minLen || 1));
                priorityQueue.decrease(target, priorityQueue.priority(target) - 1);
            });
        }
    };

    var feasibleTree = function (graph) {
        var nodePairId = function (source, target) {
            var sourceName = source.toString();
            var targetName = target.toString();
            return source < target ? (sourceName + "-" + targetName) : (targetName + "-" + sourceName);
        };

        var minLen = {};
        _.values(graph.getEdges()).forEach(function (edge) {
            var id = nodePairId(edge.source, edge.target);
            minLen[id] = Math.max(minLen[id] || 1, edge.value.minLen || 1);
        });

        var tree = prim(graph, function (left, right) {
            return Math.abs(graph.getNode(left).value.rank - graph.getNode(right).value.rank) - minLen[nodePairId(left, right)];
        });

        var visited = {};
        var dfs = function (id, rank) {
            visited[id] = true;
            graph.getNode(id).value.rank = rank;

            tree[id].forEach(function (next) {
                if (!_.has(visited, next)) {
                    var delta = minLen[nodePairId(id, next)];
                    dfs(next, rank + (graph.getIncidentEdges(id, next).length ? delta : -delta));
                }
            });
        };

        dfs(_.keys(graph.getNodes())[0], 0);

        return tree;
    };

    var normalize = function (graph) {
        var minRank = _.min(_.values(graph.getNodes()).map(function (node) {
            return node.value.rank; 
        }));
        _.values(graph.getNodes()).forEach(function (node) {
            node.value.rank -= minRank;
        });
    };

    var run = function (graph) {
        initRank(graph); 

        graph.getComponents().forEach(function (component) {
            var subgraph = graph.getSubgraph(component);
            feasibleTree(subgraph);
            normalize(subgraph);
        });
    };

    return {
        run: run
    };

});
