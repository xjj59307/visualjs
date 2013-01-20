define(["../graph", "../order"], function (Graph, order) {

    describe("order", function () {
        describe("bilayerCrossCount", function () {
            it("calculates 0 crossings for an empty graph", function () {
                var graph = Graph();
                var upperLayer = [];
                var lowerLayer = [];

                expect(order.bilayerCrossCount(graph, upperLayer, lowerLayer)).toEqual(0);
            });

            it("calculates the correct number of crossings", function () {
                var graph = Graph();
                graph.addNode(11);
                graph.addNode(12);
                graph.addNode(13);
                graph.addNode(21);
                graph.addNode(22);
                graph.addNode(23);
                graph.addEdge("A", 11, 21);
                graph.addEdge("B", 12, 22);
                graph.addEdge("C", 13, 23);
                var upperLayer = [11, 12, 13];
                var lowerLayer = [21, 22, 23];

                expect(order.bilayerCrossCount(graph, upperLayer, lowerLayer)).toEqual(0);
            });

            it("calculates the correct number of crossings", function () {
                var graph = Graph();
                graph.addNode(11);
                graph.addNode(12);
                graph.addNode(13);
                graph.addNode(21);
                graph.addNode(22);
                graph.addEdge("A", 11, 22);
                graph.addEdge("B", 12, 21);
                graph.addEdge("C", 12, 22);
                graph.addEdge("D", 13, 21);
                graph.addEdge("E", 13, 22);
                var upperLayer = [11, 12, 13];
                var lowerLayer = [21, 22];

                expect(order.bilayerCrossCount(graph, upperLayer, lowerLayer)).toEqual(3);
            });
        });
    });

});
