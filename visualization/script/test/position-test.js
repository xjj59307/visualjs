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
            graph.addEdge("A", 11, 21, {});
            graph.addEdge("B", 11, 31, {});
            graph.addEdge("C", 21, 31, {});

            layout.run(graph);
        });
    });

});


