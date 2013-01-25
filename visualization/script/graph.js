define(["lib/underscore"], function (_) {

    return function Graph () {
        var nodes = {}; 
        var edges = {};
        var inEdges = {};
        var outEdges = {};
        var self = {};
        var idCounter = 0;

        self.addNode = function (id, value) {
            if (self.hasNode(id)) {
                throw new Error("Graph already has node '" + id + "':\n" + self.toString());
            }

            nodes[id] = { id: id, value: value };
            inEdges[id] = {};
            outEdges[id] = {};
        };

        self.deleteNode = function (id) {
            self.getNode(id);

            self.getIncidentEdges(id).forEach(function (edgeId) {
                self.deleteEdge(edgeId);
            });

            delete inEdges[id];
            delete outEdges[id];
            delete nodes[id];
        };

        self.getNode = function (id) {
            var node = nodes[id];
            if (!node) {
                throw new Error("Node '" + id + "' is not in graph:\n" + self.toString());
            }
            return node;
        };

        self.getNodes = function () {
            return nodes;
        };

        self.getSuccessors = function (id) {
            self.getNode(id);

            return _.keys(outEdges[id]);
        };

        self.getPredecessors = function (id) {
            self.getNode(id);

            return _.keys(inEdges[id]);
        };

        self.getNeighbors = function(id) {
            self.getNode(id);

            return _.union(self.getSuccessors(id), self.getPredecessors(id));
        };

        self.getSource = function (id) {
            var edge = self.getEdge(id);

            return edge.source;
        };

        self.getTarget = function (id) {
            var edge = self.getEdge(id);

            return edge.target;
        };

        self.hasNode = function (id) {
            return _.has(nodes, id);
        };

        self.addEdge = function (id, source, target, value) {
            self.getNode(source);
            self.getNode(target);

            if (id === null) {
                id = "_ANON-" + (++idCounter);
            }
            if (self.hasEdge(id)) {
                throw new Error("Graph already has edge '" + id + "':\n" + self.toString());
            }

            edges[id] = { id: id, source: source, target: target, value: value };
            addEdgeToMap(inEdges[target], source, id);
            addEdgeToMap(outEdges[source], target, id);
        };

        self.deleteEdge = function (id) {
            var edge = self.getEdge(id);

            deleteEdgeFromMap(inEdges[edge.target], edge.source, id);
            deleteEdgeFromMap(outEdges[edge.source], edge.target, id);
            delete edges[id];
        };

        self.getEdge = function (id) {
            var edge = edges[id];
            if (!edge) {
                throw new Error("Edge '" + id + "' is not in graph:\n" + self.toString());
            }
            return edge;
        };

        self.getEdges = function () {
            return edges;
        };

        self.getIncidentEdges = function (firstId, secondId) {
            if (!arguments.length) {
                return _.keys(edges);
            } else if (arguments.length === 1) {
                self.getNode(firstId);

                var inEdgeIds = _.flatten(_.values(inEdges[firstId]).map(function (entry) {
                    return _.keys(entry.edges);
                }));
                var outEdgeIds = _.flatten(_.values(outEdges[firstId]).map(function (entry) {
                    return _.keys(entry.edges);
                }));
                return _.union(inEdgeIds, outEdgeIds);
            } else {
                self.getNode(firstId);
                self.getNode(secondId);

                var entries = outEdges[firstId];
                return _.has(entries, secondId) ? _.keys(entries[secondId].edges) : [];
            }
        };

        self.getInEdges = function (target) {
            self.getNode(target);

            return _.flatten(_.values(inEdges[target]).map(function (entry) {
                return _.keys(entry.edges);
            }));
        };

        self.getOutEdges = function (source) {
            self.getNode(source);

            return _.flatten(_.values(outEdges[source]).map(function (entry) {
                return _.keys(entry.edges);
            }));
        };

        self.hasEdge = function (id) {
            return _.has(edges, id);
        };

        self.getSubgraph = function (subNodes) {
            var subgraph = Graph();

            subNodes.forEach(function (nodeId) {
                subgraph.addNode(nodeId, nodes[nodeId].value); 
            });
            _.values(edges).forEach(function (edge) {
                if (subgraph.hasNode(edge.source) && subgraph.hasNode(edge.target)) {
                    subgraph.addEdge(edge.id, edge.source, edge.target, edge.value);
                }
            });

            return subgraph;
        };

        self.getComponents = function () {
            var components = [];
            var visited = {};

            var dfs = function (id, component) {
                if (!_.has(visited, id)) {
                    visited[id] = true;
                    component.push(id);
                    self.getNeighbors(id).forEach(function (neighbor) {
                        dfs(neighbor, component);
                    });
                }
            };

            _.keys(nodes).forEach(function (id) {
                var component = [];
                dfs(id, component);
                if (component.length > 0) {
                    components.push(component);
                }
            });

            return components;
        };

        self.toString = function () {
            var string = "Graph:\n";

            string += "Nodes:\n";
            _.keys(nodes).forEach(function (id) {
                string += id + ": " + JSON.stringify(nodes[id].value) + "\n";
            });

            string += "Edges:\n";
            _.keys(edges).forEach(function (id) {
                var edge = edges[id];
                string += id + "(" + edge.source + " -> " + edge.target + "): " + JSON.stringify(edges[id].value) + "\n";
            });

            return string;
        };

        var addEdgeToMap = function (map, nodeId, edgeId) {
            var entry = map[nodeId];
            if (!entry) {
                map[nodeId] = { count: 0, edges: {} };
                entry = map[nodeId];
            }
            entry.count++;
            entry.edges[edgeId] = true;	
        };

        var deleteEdgeFromMap = function (map, nodeId, edgeId) {
            var entry = map[nodeId];
            if (--entry.count === 0) {
                delete map[nodeId];
            } else {
                delete entry.edges[edgeId];	
            }
        };

        return self;
    };

});
