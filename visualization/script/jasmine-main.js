require(["test/graph-test", "test/rank-test"], function () {
    var env = jasmine.getEnv();
    env.addReporter(new jasmine.HtmlReporter);
    env.execute();
});
