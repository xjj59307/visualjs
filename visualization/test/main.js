require(
['d3-test'], 
function(){
    var env = jasmine.getEnv();
    env.addReporter(new jasmine.HtmlReporter);
    env.execute();
});