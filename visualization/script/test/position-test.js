define(["../layout"], function (layout) {

    describe("position", function () {
        it("find type 1 conflicts", function () {
            var nodes = [
                { width: 20, height: 20 },
                { width: 20, height: 20 },
                { width: 20, height: 20 },
                { width: 20, height: 20 },
                { width: 20, height: 20 },
                { width: 20, height: 20 },
                { width: 20, height: 20 },
                { width: 20, height: 20 },
                { width: 20, height: 20 },
                { width: 20, height: 20 },
                { width: 20, height: 20 },
            ];
            var edges = [
                { source: 11, target: 21 },
                { source: 21, target: 31 },
                { source: 11, target: 31 }
            ];

            // layout.nodes(nodes).edges(edges).run();
        });
    });

});


