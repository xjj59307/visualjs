define(["lib/underscore"], function (_) {

    var newGraph = function () {
        var nodes = {}; 
        var edges = {};
        var inEdges = {};
        var outEdges = {};
        var graph = {};

        graph.addNode = function (id, value) {
            if (graph.hasNode(id)) {
                throw new Error("Graph already has node '" + id + "'");
            }

            nodes[id] = { id: id, value: value };
            inEdges[id] = {};
            outEdges[id] = {};
        };

        graph.deleteNode = function (id) {
            graph.getNode(id);

            graph.getIncidentEdges(id).forEach(function (edgeId) {
                graph.deleteEdge(edgeId);
            });

            delete inEdges[id];
            delete outEdges[id];
            delete nodes[id];
        };

        graph.getNode = function (id) {
            var node = nodes[id];
            if (!node) {
                throw new Error("Node '" + id + "' is not in graph");
            }
            return node;
        };

        graph.getNodes = function () {
            return nodes;
        };

        graph.getSuccessors = function (id) {
            graph.getNode(id);

            return _.keys(outEdges[id]);
        };

        graph.getPredecessors = function (id) {
            graph.getNode(id);

            return _.keys(inEdges[id]);
        };

        graph.getNeighbors = function(id) {
            graph.getNode(id);

            return _.union(graph.getSuccessors(id), graph.getPredecessors(id));
        };

        graph.hasNode = function (id) {
            return id in nodes;
        };

        graph.addEdge = function (id, source, target, value) {
            graph.getNode(source);
            graph.getNode(target);

            if (graph.hasEdge(id)) {
                throw new Error("Graph already has edge '" + id + "'");
            }

            edges[id] = { id: id, source: source, target: target, value: value };
            addEdgeToMap(inEdges[target], source, id);
            addEdgeToMap(outEdges[source], target, id);
        };

        graph.deleteEdge = function (id) {
            var edge = graph.getEdge(id);

            deleteEdgeFromMap(inEdges[edge.target], edge.source, id);
            deleteEdgeFromMap(outEdges[edge.source], edge.target, id);
            delete edges[id];
        };

        graph.getEdge = function (id) {
            var edge = edges[id];
            if (!edge) {
                throw new Error("Edge '" + id + "' is not in graph");
            }
            return edge;
        };

        graph.getEdges = function () {
            return edges;
        };

        graph.getIncidentEdges = function (firstId, secondId) {
            if (!arguments.length) {
                return _.keys(edges);
            } else if (arguments.length === 1) {
                graph.getNode(firstId);

                var inEdgeIds = _.flatten(_.values(inEdges[firstId]).map(function (entry) {
                    return _.keys(entry.edges);
                }));
                var outEdgeIds = _.flatten(_.values(outEdges[firstId]).map(function (entry) {
                    return _.keys(entry.edges);
                }));
                return _.union(inEdgeIds, outEdgeIds);
            } else {
                graph.getNode(firstId);
                graph.getNode(secondId);

                var entries = outEdges[firstId];
                return (secondId in entries) ? _.keys(entries[secondId].edges) : [];
            }
        };

        graph.getInEdges = function (target) {
            graph.getNode(target);

            return _.flatten(_.values(inEdges[target]).map(function (entry) {
                return _.keys(entry.edges);
            }));
        };

        graph.getOutEdges = function (source) {
            graph.getNode(source);

            return _.flatten(_.values(outEdges[source]).map(function (entry) {
                return _.keys(entry.edges);
            }));
        };

        graph.hasEdge = function (id) {
            return id in edges;
        };

        graph.getSubgraph = function(subNodes) {
            var subgraph = newGraph();

            subNodes.forEach(function (nodeId) {
                subgraph.addNode(nodeId, nodes[nodeId]); 
            });
            _.values(edges).forEach(function (edge) {
                if (subgraph.hasNode(edge.source) && subgraph.hasNode(edge.target)) {
                    subgraph.addEdge(edge.id, edge.source, edge.target, edge.value);
                }
            });

            return subgraph;
        };

        function addEdgeToMap (map, nodeId, edgeId) {
            var entry = map[nodeId];
            if (!entry) {
                map[nodeId] = { count: 0, edges: {} };
                entry = map[nodeId];
            }
            entry.count++;
            entry.edges[edgeId] = true;	
        };

        function deleteEdgeFromMap (map, nodeId, edgeId) {
            var entry = map[nodeId];
            if (--entry.count === 0) {
                delete map[nodeId];
            } else {
                delete entry.edges[edgeId];	
            }
        };

        return graph;
    };

    return {
        newGraph: newGraph
    }

});
