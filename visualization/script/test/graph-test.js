define(["../graph"], function(graph) {
	describe("graph", function() {
		it("graph definition", function() {
            var g = graph.newGraph();
            expect(g.getNodes()).toEqual({});
		});
	});
});
