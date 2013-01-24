define(["../graph", "../layout"], function (Graph, layout) {

    describe("position", function () {
        it("find type 1 conflicts", function () {
            var graph = Graph();
            graph.addNode(11, { width: 20, height: 20 });
            graph.addNode(21, { width: 20, height: 20 });
            graph.addNode(22, { width: 20, height: 20 });
            graph.addNode(23, { width: 20, height: 20 });
            graph.addNode(24, { width: 20, height: 20 });
            graph.addNode(25, { width: 20, height: 20 });
            graph.addNode(31, { width: 20, height: 20 });
            graph.addNode(32, { width: 20, height: 20 });
            graph.addNode(33, { width: 20, height: 20 });
            graph.addNode(34, { width: 20, height: 20 });
            graph.addNode(35, { width: 20, height: 20 });
            graph.addEdge("A", 21, 32, {});
            graph.addEdge("B", 22, 31, {});
            graph.addEdge("C", 23, 33, {});
            graph.addEdge("D", 24, 34, {});
            graph.addEdge("E", 21, 35, {});
            var layering = [[11], [21, 22, 23, 24, 25], [31, 32, 33, 34, 35]];

            // var conflicts = position._findConflicts(graph, layering);
            // var align = position._verticalAlignment(graph, layering, conflicts, "getPredecessors");
            // var xCoordinates = position._horizontalCompacting(graph, layering, align.position, align.root, align.align);
            // position.run(graph);
            layout.run(graph);

            // expect(conflicts["21-32"]).toEqual(true);
            // expect(conflicts["21-35"]).toEqual(true);
        });
    });

});


