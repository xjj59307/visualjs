define(["../graph", "../position"], function (Graph, position) {

    describe("position", function () {
        it("find type 1 conflicts", function () {
            var graph = Graph();
            graph.addNode(11, { dummy: false });
            graph.addNode(21, { dummy: false });
            graph.addNode(22, { dummy: true });
            graph.addNode(23, { dummy: false });
            graph.addNode(24, { dummy: false });
            graph.addNode(25, { dummy: false });
            graph.addNode(31, { dummy: true });
            graph.addNode(32, { dummy: false });
            graph.addNode(33, { dummy: false });
            graph.addNode(34, { dummy: false });
            graph.addNode(35, { dummy: false });
            graph.addEdge("A", 21, 32);
            graph.addEdge("B", 22, 31);
            graph.addEdge("C", 23, 33);
            graph.addEdge("D", 24, 34);
            graph.addEdge("E", 21, 35);
            var layering = [[11], [21, 22, 23, 24, 25], [31, 32, 33, 34, 35]];

            var conflicts = position._findConflicts(graph, layering);

            expect(conflicts["21-32"]).toEqual(true);
            expect(conflicts["21-35"]).toEqual(true);
        });
    });

});


