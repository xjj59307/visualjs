define(["../graph", "../position"], function (Graph, position) {

    describe("position", function () {
        it("find type 1 conflicts", function () {
            var graph = Graph();
            graph.addNode(11, { rank: 0, order: 0, dummy: false, width: 20, height: 20 });
            graph.addNode(21, { rank: 1, order: 0, dummy: false, width: 20, height: 20 });
            graph.addNode(22, { rank: 1, order: 1, dummy: true, width: 20, height: 20 });
            graph.addNode(23, { rank: 1, order: 2, dummy: false, width: 20, height: 20 });
            graph.addNode(24, { rank: 1, order: 3, dummy: false, width: 20, height: 20 });
            graph.addNode(25, { rank: 1, order: 4, dummy: false, width: 20, height: 20 });
            graph.addNode(31, { rank: 2, order: 0, dummy: true, width: 20, height: 20 });
            graph.addNode(32, { rank: 2, order: 1, dummy: false, width: 20, height: 20 });
            graph.addNode(33, { rank: 2, order: 2, dummy: false, width: 20, height: 20 });
            graph.addNode(34, { rank: 2, order: 3, dummy: false, width: 20, height: 20 });
            graph.addNode(35, { rank: 2, order: 4, dummy: false, width: 20, height: 20 });
            graph.addEdge("A", 21, 32);
            graph.addEdge("B", 22, 31);
            graph.addEdge("C", 23, 33);
            graph.addEdge("D", 24, 34);
            graph.addEdge("E", 21, 35);
            var layering = [[11], [21, 22, 23, 24, 25], [31, 32, 33, 34, 35]];

            // var conflicts = position._findConflicts(graph, layering);
            // var align = position._verticalAlignment(graph, layering, conflicts, "getPredecessors");
            // var xCoordinates = position._horizontalCompacting(graph, layering, align.position, align.root, align.align);
            position.run(graph);

            // expect(conflicts["21-32"]).toEqual(true);
            // expect(conflicts["21-35"]).toEqual(true);
        });
    });

});


