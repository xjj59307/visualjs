define(["lib/underscore"], function (_) {

    var run = function (graph) {
        var subRoot = {};
        var visited = {};
        var reverseCount = 0;

        var dfs = function (nodeId) {
            if (_.has(visited, nodeId)) {
                return;
            }

            visited[nodeId] = true;
            subRoot[nodeId] = true;
            graph.getOutEdges(nodeId).forEach(function (edgeId) {
                var target = graph.getTarget(edgeId);
                
                if (_.has(subRoot, target)) {
                    var edgeValue = graph.getEdge(edgeId).value;
                    graph.deleteEdge(edgeId);
                    edgeValue.reversed = true;
                    reverseCount++;
                    graph.addEdge(edgeId, target, nodeId, edgeValue);
                } else {
                    dfs(target);
                }
            });

            delete subRoot[nodeId];
        };
        
        _.keys(graph.getNodes()).forEach(function (id) {
            dfs(id);
        });
    };   

    var undo = function (graph) {
        _.each(graph.getEdges(), function (edge, id) {
            if (edge.value.reversed) {
                delete edge.value.reversed;
                graph.deleteEdge(id);
                graph.addEdge(id, edge.target, edge.source, edge.value);
            }
        });
    };

    return {
        run: run,
        undo: undo
    };

});
