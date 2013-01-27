define(["../graph"], function (Graph) {

    describe("graph", function () {
        describe("outEdges", function () {
            it("returns all out edges from a source", function () {
                var graph = Graph();
                graph.addNode(1);
                graph.addNode(2);
                graph.addEdge("A", 1, 2);
                graph.addEdge("B", 1, 2);
                graph.addEdge("C", 1, 1);
                graph.addEdge("D", 2, 1);
                graph.addEdge("E", 2, 2);

                expect(graph.getOutEdges(1).sort()).toEqual(["A", "B", "C"]);
                expect(graph.getOutEdges(2).sort()).toEqual(["D", "E"]);
            });
        });

        describe("inEdges", function () {
            it("returns all in edges from a target", function () {
                var graph = Graph();
                graph.addNode(1);
                graph.addNode(2);
                graph.addEdge("A", 1, 2);
                graph.addEdge("B", 1, 2);
                graph.addEdge("C", 1, 1);
                graph.addEdge("D", 2, 1);
                graph.addEdge("E", 2, 2);

                expect(graph.getInEdges(1).sort()).toEqual(["C", "D"]);
                expect(graph.getInEdges(2).sort()).toEqual(["A", "B", "E"]);
            });
        });
    });

});
