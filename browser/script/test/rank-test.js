define(["../graph", "../rank"], function (Graph, rank) {

    describe("rank", function () {
        it("assigns the minimum rank that satisfies all in-edges", function () {
            var graph = Graph();

            graph.addNode(1, { name: 'A' });
            graph.addNode(2, { name: 'B' });
            graph.addNode(3, { name: 'C' });

            graph.addEdge(1, 1, 2, { name: 'AB' });
            graph.addEdge(2, 2, 3, { name: 'BC' });
            graph.addEdge(3, 1, 3, { name: 'AC' });

            rank.run(graph);

            expect(graph.getNode(1).value.rank).toEqual(0);
            expect(graph.getNode(2).value.rank).toEqual(1);
            // expect(graph.getNode(3).value.rank).toEqual(2);
        });
    });

});
