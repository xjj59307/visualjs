require(["test/graph-test", "test/rank-test", "test/order-test", "test/position-test"], function () {
    var env = jasmine.getEnv();
    env.addReporter(new jasmine.HtmlReporter);
    env.execute();
});
