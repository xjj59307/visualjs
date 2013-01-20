define(["../graph", "../rank"], function (graph, rank) {

    describe("rank", function () {
        it("assigns the minimum rank that satisfies all in-edges", function () {
            var g = graph();

            g.addNode(1, { name: 'A' });
            g.addNode(2, { name: 'B' });
            g.addNode(3, { name: 'C' });

            g.addEdge(1, 1, 2, { name: 'AB' });
            g.addEdge(2, 2, 3, { name: 'BC' });
            g.addEdge(3, 1, 3, { name: 'AC' });

            rank(g);

            expect(g.getNode(1).value.rank).toEqual(0);
            expect(g.getNode(2).value.rank).toEqual(1);
            // expect(g.getNode(3).value.rank).toEqual(2);

            console.log(g.toString());
        });
    });

});
